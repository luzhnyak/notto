import * as SQLite from "expo-sqlite";
import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { BackupPort } from "../../services/BackupService";
import {
  NativeAttachmentFiles,
  safePath,
  cleanupStorageGenerations,
} from "./AttachmentFiles";
import { nativeDatabase } from "../database/native";
import { initialize, SQLConnection } from "../database/connection";
import { migrations } from "../database/schema";
export class NativeBackupPort implements BackupPort {
  constructor(
    private db: SQLite.SQLiteDatabase,
    private files: NativeAttachmentFiles,
  ) {}
  async hash(bytes: Uint8Array) {
    const digest = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      // Native Expo Crypto expects a TypedArray; ArrayBuffer is web-only here.
      new Uint8Array(bytes),
    );
    return Array.from(new Uint8Array(digest), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
  }
  async snapshot() {
    const copy = await SQLite.openDatabaseAsync(":memory:");
    try {
      await SQLite.backupDatabaseAsync({
        sourceDatabase: this.db,
        destDatabase: copy,
      });
      const result: Record<string, Uint8Array> = {
        "notto.db": await copy.serializeAsync(),
      };
      const refs = await copy.getAllAsync<{ path: string }>(
        "SELECT path FROM attachments WHERE path IS NOT NULL",
      );
      for (const ref of refs) {
        const file = new File(await this.files.uri(ref.path));
        if (
          Object.values(result).reduce((sum, bytes) => sum + bytes.length, 0) +
            file.size >
          200 * 1024 * 1024
        )
          throw new Error("Резервна копія перевищує 200 МБ");
        result[safePath(ref.path)] = await file.bytes();
      }
      return result;
    } finally {
      await copy.closeAsync();
    }
  }
  async restore(files: Record<string, Uint8Array>) {
    // Persist staging bytes before opening them; serialized WAL headers cannot always be deserialized into memory.
    const token = Crypto.randomUUID();
    const staging = new Directory(Paths.cache, "restore", token);
    staging.create({ intermediates: true });
    const file = new File(staging, "candidate.db");
    file.write(files["notto.db"]);
    let candidate: SQLite.SQLiteDatabase | undefined;
    let generation: Directory | undefined;
    let installed = false;
    try {
      candidate = await SQLite.openDatabaseAsync(
        "candidate.db",
        {},
        staging.uri,
      );
      const version = await candidate.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
      );
      if (version?.user_version !== migrations.length)
        throw new Error(
          "Версія бази копії не підтримується цією версією Notto",
        );
      const integrity = await candidate.getFirstAsync<{
        integrity_check: string;
      }>("PRAGMA integrity_check");
      if (integrity?.integrity_check !== "ok")
        throw new Error("База резервної копії пошкоджена");
      if ((await candidate.getAllAsync("PRAGMA foreign_key_check")).length)
        throw new Error("Пошкоджені зв’язки резервної копії");
      // Verify the application schema and reject missing attachment bytes before touching current data.
      await validateCandidate(candidate, files);
      generation = new Directory(Paths.document, "data", token);
      generation.create({ intermediates: true });
      new Directory(generation, "attachments").create();
      for (const [name, bytes] of Object.entries(files))
        if (name !== "notto.db")
          new File(generation, safePath(name)).write(bytes);
      await candidate.runAsync(
        "INSERT INTO settings(key,value) VALUES('storage_generation',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        token,
      );
      await initialize(nativeDatabase(candidate));
      // SQLite online backup commits the database replacement atomically. The generation pointer is part of that commit.
      await SQLite.backupDatabaseAsync({
        sourceDatabase: candidate,
        destDatabase: this.db,
      });
      installed = true;
      // Cleanup is best-effort after the atomic commit; a cleanup error must not report a failed restore.
      try {
        await cleanupStorageGenerations(nativeDatabase(this.db));
      } catch {
        console.warn(
          "Notto: obsolete attachment directories will be cleaned on next startup",
        );
      }
    } finally {
      await candidate?.closeAsync();
      if (!installed && generation?.exists) generation.delete();
      if (staging.exists) staging.delete();
    }
  }
}
async function validateCandidate(
  db: SQLConnection,
  files: Record<string, Uint8Array>,
) {
  await db.getFirstAsync(
    "SELECT n.title,n.content,n.search_title,n.search_content,n.note_type_id,n.emotion_id,n.event_date,n.status,n.is_favorite,n.is_pinned,n.created_at,n.updated_at,n.deleted_at FROM notes n LIMIT 1",
  );
  await db.getFirstAsync(
    "SELECT id,name,color,icon,sort_order FROM note_types LIMIT 1",
  );
  await db.getFirstAsync(
    "SELECT id,name,icon,color,sort_order FROM emotions LIMIT 1",
  );
  await db.getFirstAsync("SELECT id,name,normalized_name FROM tags LIMIT 1");
  await db.getFirstAsync("SELECT note_id,tag_id FROM note_tags LIMIT 1");
  await db.getFirstAsync("SELECT key,value FROM settings LIMIT 1");
  const refs = await db.getAllAsync<{ path: string }>(
    "SELECT path FROM attachments WHERE path IS NOT NULL",
  );
  const paths = new Set(refs.map((v) => safePath(v.path)));
  for (const path of paths)
    if (!files[path]) throw new Error("У копії відсутнє вкладення");
  for (const path of Object.keys(files))
    if (path !== "notto.db" && !paths.has(path))
      throw new Error("Копія містить невідомі вкладення");
}
