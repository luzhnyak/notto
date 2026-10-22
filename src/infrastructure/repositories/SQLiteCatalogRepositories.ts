import { Database } from "../database/connection";
import {
  NoteTypeRepository,
  EmotionRepository,
  TagRepository,
} from "../../domain/repositories";
import { NoteType, Emotion, Tag } from "../../domain/entities";
async function reorder(
  db: Database,
  table: "note_types" | "emotions",
  ids: number[],
) {
  await db.transaction(async (tx) => {
    const rows = await tx.getAllAsync<{ id: number }>(
      `SELECT id FROM ${table}`,
    );
    if (
      ids.length !== rows.length ||
      new Set(ids).size !== ids.length ||
      rows.some((r) => !ids.includes(r.id))
    )
      throw new Error("Некоректний порядок");
    for (let i = 0; i < ids.length; i++)
      await tx.runAsync(
        `UPDATE ${table} SET sort_order=? WHERE id=?`,
        i,
        ids[i],
      );
  });
}
export class SQLiteNoteTypeRepository implements NoteTypeRepository {
  constructor(private db: Database) {}
  list() {
    return this.db.getAllAsync<NoteType>(
      "SELECT id,name,color,icon,sort_order AS sortOrder FROM note_types ORDER BY sort_order,id",
    );
  }
  async save(v: Omit<NoteType, "id">, id?: number) {
    if (id !== undefined) {
      const r = await this.db.runAsync(
        "UPDATE note_types SET name=?,color=?,icon=?,sort_order=? WHERE id=?",
        v.name,
        v.color,
        v.icon,
        v.sortOrder,
        id,
      );
      if (!r.changes) throw new Error("Тип не знайдено");
    } else
      await this.db.runAsync(
        "INSERT INTO note_types(name,color,icon,sort_order) VALUES(?,?,?,?)",
        v.name,
        v.color,
        v.icon,
        v.sortOrder,
      );
  }
  async remove(id: number, replacementId: number) {
    await this.db.transaction(async (tx) => {
      if (id === replacementId) throw new Error("Оберіть інший тип");
      const target = await tx.getFirstAsync(
        "SELECT id FROM note_types WHERE id=?",
        replacementId,
      );
      if (!target) throw new Error("Тип для перенесення не знайдено");
      await tx.runAsync(
        "UPDATE notes SET note_type_id=?,updated_at=? WHERE note_type_id=?",
        replacementId,
        new Date().toISOString(),
        id,
      );
      const r = await tx.runAsync("DELETE FROM note_types WHERE id=?", id);
      if (!r.changes) throw new Error("Тип не знайдено");
    });
  }
  reorder(ids: number[]) {
    return reorder(this.db, "note_types", ids);
  }
}
export class SQLiteEmotionRepository implements EmotionRepository {
  constructor(private db: Database) {}
  list() {
    return this.db.getAllAsync<Emotion>(
      "SELECT id,name,icon,color,sort_order AS sortOrder FROM emotions ORDER BY sort_order,id",
    );
  }
  async save(v: Omit<Emotion, "id">, id?: number) {
    if (id !== undefined) {
      const r = await this.db.runAsync(
        "UPDATE emotions SET name=?,icon=?,color=?,sort_order=? WHERE id=?",
        v.name,
        v.icon,
        v.color,
        v.sortOrder,
        id,
      );
      if (!r.changes) throw new Error("Емоцію не знайдено");
    } else
      await this.db.runAsync(
        "INSERT INTO emotions(name,icon,color,sort_order) VALUES(?,?,?,?)",
        v.name,
        v.icon,
        v.color,
        v.sortOrder,
      );
  }
  async remove(id: number) {
    await this.db.transaction(async (tx) => {
      await tx.runAsync(
        "UPDATE notes SET emotion_id=NULL,updated_at=? WHERE emotion_id=?",
        new Date().toISOString(),
        id,
      );
      await tx.runAsync("DELETE FROM emotions WHERE id=?", id);
    });
  }
  reorder(ids: number[]) {
    return reorder(this.db, "emotions", ids);
  }
}
export class SQLiteTagRepository implements TagRepository {
  constructor(private db: Database) {}
  list() {
    return this.db.getAllAsync<Tag>(
      "SELECT id,name,normalized_name AS normalizedName FROM tags ORDER BY normalized_name",
    );
  }
  async save(name: string, normalized: string, id?: number) {
    if (id !== undefined) {
      const r = await this.db.runAsync(
        "UPDATE tags SET name=?,normalized_name=? WHERE id=?",
        name,
        normalized,
        id,
      );
      if (!r.changes) throw new Error("Тег не знайдено");
      return id;
    }
    await this.db.runAsync(
      "INSERT INTO tags(name,normalized_name) VALUES(?,?) ON CONFLICT(normalized_name) DO NOTHING",
      name,
      normalized,
    );
    const row = await this.db.getFirstAsync<{ id: number }>(
      "SELECT id FROM tags WHERE normalized_name=?",
      normalized,
    );
    if (!row) throw new Error("Не вдалося створити тег");
    return row.id;
  }
  async remove(id: number) {
    await this.db.runAsync("DELETE FROM tags WHERE id=?", id);
  }
}
