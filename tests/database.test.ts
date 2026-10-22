import { DatabaseSync, SQLInputValue } from "node:sqlite";
import type { Database } from "../src/infrastructure/database/connection";
import { initialize } from "../src/infrastructure/database/connection";
import { SQLiteNoteRepository } from "../src/infrastructure/repositories/SQLiteNoteRepository";
import {
  SQLiteNoteTypeRepository,
  SQLiteTagRepository,
} from "../src/infrastructure/repositories/SQLiteCatalogRepositories";
import { NoteInput } from "../src/domain/entities";
function adapter(raw: DatabaseSync): Database {
  const params = (args: unknown[]): SQLInputValue[] =>
    (Array.isArray(args[0]) ? args[0] : args) as SQLInputValue[];
  const db = {
    async execAsync(sql: string) {
      raw.exec(sql);
    },
    async getAllAsync(sql: string, ...args: unknown[]) {
      return raw.prepare(sql).all(...params(args));
    },
    async getFirstAsync(sql: string, ...args: unknown[]) {
      return raw.prepare(sql).get(...params(args)) ?? null;
    },
    async runAsync(sql: string, ...args: unknown[]) {
      const r = raw.prepare(sql).run(...params(args));
      return {
        changes: Number(r.changes),
        lastInsertRowId: Number(r.lastInsertRowid),
      };
    },
    async transaction(fn: (tx: Database) => Promise<void>) {
      raw.exec("BEGIN");
      try {
        await fn(db as unknown as Database);
        raw.exec("COMMIT");
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return db as unknown as Database;
}
let raw: DatabaseSync;
let db: Database;
let repo: SQLiteNoteRepository;
const value: NoteInput = {
  title: "Риболовля на Дністрі",
  content: "Вдала осіння риболовля",
  noteTypeId: 1,
  emotionId: 1,
  eventDate: "2026-10-19",
  tagIds: [],
};
const now = "2026-10-19T10:00:00Z";
beforeEach(async () => {
  raw = new DatabaseSync(":memory:");
  db = adapter(raw);
  repo = new SQLiteNoteRepository(db, await initialize(db));
});
afterEach(() => raw.close());
test("migration and seed are idempotent and preserve user changes", async () => {
  await db.runAsync("UPDATE note_types SET name='Мій тип' WHERE id=1");
  await initialize(db);
  expect(
    await db.getFirstAsync("SELECT count(*) AS n FROM note_types"),
  ).toEqual({ n: 6 });
  expect(
    await db.getFirstAsync("SELECT name FROM note_types WHERE id=1"),
  ).toEqual({ name: "Мій тип" });
});
test("create, edit, tags, favorite, pin, archive, trash, restore, permanent deletion", async () => {
  const tags = new SQLiteTagRepository(db);
  const tag = await tags.save("Річка", "річка");
  const id = await repo.save({ ...value, tagIds: [tag] }, now);
  expect((await repo.get(id))?.tags[0].name).toBe("Річка");
  await repo.save({ ...value, title: "Новий заголовок", tagIds: [] }, now, id);
  await repo.toggle(id, "is_favorite", now);
  await repo.toggle(id, "is_pinned", now);
  expect((await repo.list({ favorite: true, pinned: true }))[0].title).toBe(
    "Новий заголовок",
  );
  await repo.setStatus(id, "archived", now);
  expect(await repo.list({})).toHaveLength(0);
  await repo.setStatus(id, "deleted", now);
  expect((await repo.get(id))?.deletedAt).toBe(now);
  await repo.setStatus(id, "active", now);
  await expect(repo.permanentDelete(id)).rejects.toThrow();
  await repo.setStatus(id, "deleted", now);
  await repo.permanentDelete(id);
  expect(await repo.get(id)).toBeNull();
});
test("invalid foreign key rolls back whole note including tag changes", async () => {
  const id = await repo.save(value, now);
  await expect(
    repo.save({ ...value, title: "Should rollback", tagIds: [999] }, now, id),
  ).rejects.toThrow();
  expect((await repo.get(id))?.title).toBe(value.title);
});
test("type removal transfers active, archived, deleted records transactionally", async () => {
  const types = new SQLiteNoteTypeRepository(db);
  for (const status of ["active", "archived", "deleted"] as const) {
    const id = await repo.save(value, now);
    await repo.setStatus(id, status, now);
  }
  await expect(types.remove(1, 999)).rejects.toThrow();
  expect(
    await db.getFirstAsync(
      "SELECT count(*) AS n FROM notes WHERE note_type_id=1",
    ),
  ).toEqual({ n: 3 });
  await types.remove(1, 2);
  expect(
    await db.getFirstAsync(
      "SELECT count(*) AS n FROM notes WHERE note_type_id=2",
    ),
  ).toEqual({ n: 3 });
  await expect(types.remove(2, 2)).rejects.toThrow();
});
test("search combines text, type, emotion, dates, tags and flags", async () => {
  const tags = new SQLiteTagRepository(db);
  const tag = await tags.save("Осінь", "осінь");
  const id = await repo.save({ ...value, tagIds: [tag] }, now);
  await repo.toggle(id, "is_favorite", now);
  expect(
    await repo.list({
      query: "дністр",
      noteTypeId: 1,
      emotionId: 1,
      eventDay: "2026-10-19",
      tagIds: [tag],
      favorite: true,
    }),
  ).toHaveLength(1);
  expect(await repo.list({ query: "дністр", noteTypeId: 2 })).toHaveLength(0);
  await repo.save({ ...value, title: "Інший заголовок", content: "" }, now, id);
  expect(await repo.list({ query: "дністр" })).toHaveLength(0);
  await repo.setStatus(id, "deleted", now);
  await repo.permanentDelete(id);
  expect(
    await db.getAllAsync(
      "SELECT rowid FROM notes_fts WHERE notes_fts MATCH 'дністр*'",
    ),
  ).toHaveLength(0);
});
test("literal punctuation is safe in FTS and fallback search", async () => {
  await repo.save({ ...value, title: '100% _ результат "так"' }, now);
  for (const query of ['"', "%", "_", "так"])
    await expect(repo.list({ query })).resolves.toBeDefined();
  const fallback = new SQLiteNoteRepository(db, false);
  expect(await fallback.list({ query: "100% _" })).toHaveLength(1);
  expect(await fallback.list({ query: "немає" })).toHaveLength(0);
});
test("tag names stay unique and deleting tag preserves notes", async () => {
  const tags = new SQLiteTagRepository(db);
  const first = await tags.save("Річка", "річка");
  expect(await tags.save("РІЧКА", "річка")).toBe(first);
  const id = await repo.save({ ...value, tagIds: [first] }, now);
  await tags.remove(first);
  expect((await repo.get(id))?.tags).toEqual([]);
});
test("pinned records do not disrupt chronological order", async () => {
  const a = await repo.save({ ...value, eventDate: "2020-01-01" }, now);
  const b = await repo.save({ ...value, eventDate: "2026-01-01" }, now);
  await repo.toggle(a, "is_pinned", now);
  expect((await repo.list({})).map((n) => n.id)).toEqual([a, b]);
  expect((await repo.list({ chronological: true })).map((n) => n.id)).toEqual([
    b,
    a,
  ]);
});
test("invalid status and attachment data fail CHECK constraints", async () => {
  const id = await repo.save(value, now);
  await expect(
    db.runAsync("UPDATE notes SET status='invalid' WHERE id=?", id),
  ).rejects.toThrow();
  await expect(
    db.runAsync(
      "INSERT INTO attachments(note_id,type,created_at) VALUES(?,'url',?)",
      id,
      now,
    ),
  ).rejects.toThrow();
});
test("fallback search matches Ukrainian case-insensitively", async () => {
  await repo.save(value, now);
  const fallback = new SQLiteNoteRepository(db, false);
  expect(await fallback.list({ query: "РИБОЛОВЛЯ ДНІСТРІ" })).toHaveLength(1);
});
test("transaction setup enforces foreign keys before BEGIN on a fresh connection", async () => {
  const { runTransaction } =
    await import("../src/infrastructure/database/transactions");
  const fresh = new DatabaseSync(":memory:");
  const other = adapter(fresh);
  fresh.exec(
    "PRAGMA foreign_keys=OFF; CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(parent INTEGER REFERENCES parent(id) ON DELETE CASCADE); INSERT INTO parent VALUES(1); INSERT INTO child VALUES(1);",
  );
  await runTransaction(other, async (tx) => {
    await tx.runAsync("DELETE FROM parent WHERE id=1");
  });
  expect(await other.getFirstAsync("SELECT count(*) AS n FROM child")).toEqual({
    n: 0,
  });
  await expect(
    runTransaction(other, async (tx) => {
      await tx.runAsync("INSERT INTO child VALUES(999)");
    }),
  ).rejects.toThrow();
  fresh.close();
});
