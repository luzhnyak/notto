import { NoteRepository } from "../../domain/repositories";
import {
  Note,
  NoteFilter,
  NoteInput,
  NoteStatus,
  NoteType,
  Emotion,
  Tag,
} from "../../domain/entities";
import { Database } from "../database/connection";
import { buildQuery } from "./query";
interface Row {
  id: number;
  title: string;
  content: string;
  note_type_id: number;
  emotion_id: number | null;
  event_date: string | null;
  status: NoteStatus;
  is_favorite: number;
  is_pinned: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export class SQLiteNoteRepository implements NoteRepository {
  constructor(
    private db: Database,
    private fts: boolean,
  ) {}
  private async hydrate(rows: Row[]): Promise<Note[]> {
    if (!rows.length) return [];
    const types = await this.db.getAllAsync<NoteType>(
      "SELECT id,name,color,icon,sort_order AS sortOrder FROM note_types",
    );
    const emotions = await this.db.getAllAsync<Emotion>(
      "SELECT id,name,color,icon,sort_order AS sortOrder FROM emotions",
    );
    const ids = rows.map((r) => r.id);
    const tags = await this.db.getAllAsync<Tag & { noteId: number }>(
      `SELECT t.id,t.name,t.normalized_name AS normalizedName,nt.note_id AS noteId FROM tags t JOIN note_tags nt ON t.id=nt.tag_id WHERE nt.note_id IN (${ids.map(() => "?").join(",")}) ORDER BY t.normalized_name`,
      ids,
    );
    return rows.map((r) => {
      const type = types.find((t) => t.id === r.note_type_id);
      if (!type) throw new Error("Не знайдено тип нотатки");
      return {
        id: r.id,
        title: r.title,
        content: r.content,
        noteTypeId: r.note_type_id,
        emotionId: r.emotion_id,
        eventDate: r.event_date,
        status: r.status,
        isFavorite: !!r.is_favorite,
        isPinned: !!r.is_pinned,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at,
        type,
        emotion: emotions.find((e) => e.id === r.emotion_id) ?? null,
        tags: tags.filter((t) => t.noteId === r.id),
      };
    });
  }
  async list(filter: NoteFilter) {
    const { sql, params } = buildQuery(filter, this.fts);
    return this.hydrate(await this.db.getAllAsync<Row>(sql, params));
  }
  async get(id: number) {
    return (
      (
        await this.hydrate(
          await this.db.getAllAsync<Row>("SELECT * FROM notes WHERE id=?", id),
        )
      )[0] ?? null
    );
  }
  async save(input: NoteInput, timestamp: string, id?: number) {
    let resultId = id ?? 0;
    await this.db.transaction(async (tx) => {
      if (id !== undefined) {
        const result = await tx.runAsync(
          "UPDATE notes SET title=?,content=?,search_title=?,search_content=?,note_type_id=?,emotion_id=?,event_date=?,updated_at=? WHERE id=? AND status!='deleted'",
          input.title,
          input.content,
          input.title.normalize("NFC").toLocaleLowerCase("uk-UA"),
          input.content.normalize("NFC").toLocaleLowerCase("uk-UA"),
          input.noteTypeId,
          input.emotionId,
          input.eventDate,
          timestamp,
          id,
        );
        if (!result.changes)
          throw new Error("Нотатку не знайдено або вона в кошику");
      } else {
        const result = await tx.runAsync(
          "INSERT INTO notes(title,content,search_title,search_content,note_type_id,emotion_id,event_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",
          input.title,
          input.content,
          input.title.normalize("NFC").toLocaleLowerCase("uk-UA"),
          input.content.normalize("NFC").toLocaleLowerCase("uk-UA"),
          input.noteTypeId,
          input.emotionId,
          input.eventDate,
          timestamp,
          timestamp,
        );
        resultId = result.lastInsertRowId;
      }
      await tx.runAsync("DELETE FROM note_tags WHERE note_id=?", resultId);
      for (const tag of [...new Set(input.tagIds)])
        await tx.runAsync(
          "INSERT INTO note_tags(note_id,tag_id) VALUES(?,?)",
          resultId,
          tag,
        );
    });
    return resultId;
  }
  async setStatus(id: number, status: NoteStatus, timestamp: string) {
    const r = await this.db.runAsync(
      "UPDATE notes SET status=?,deleted_at=?,updated_at=? WHERE id=?",
      status,
      status === "deleted" ? timestamp : null,
      timestamp,
      id,
    );
    if (!r.changes) throw new Error("Нотатку не знайдено");
  }
  async toggle(
    id: number,
    field: "is_favorite" | "is_pinned",
    timestamp: string,
  ) {
    const column = field === "is_favorite" ? "is_favorite" : "is_pinned";
    const r = await this.db.runAsync(
      `UPDATE notes SET ${column}=1-${column},updated_at=? WHERE id=? AND status!='deleted'`,
      timestamp,
      id,
    );
    if (!r.changes) throw new Error("Нотатку не знайдено або вона в кошику");
  }
  async permanentDelete(id: number) {
    await this.db.transaction(async (tx) => {
      const files = await tx.getFirstAsync<{ count: number }>(
        "SELECT count(*) AS count FROM attachments WHERE note_id=? AND path IS NOT NULL",
        id,
      );
      if (files?.count) throw new Error("Спочатку видаліть локальні вкладення");
      const r = await tx.runAsync(
        "DELETE FROM notes WHERE id=? AND status='deleted'",
        id,
      );
      if (!r.changes)
        throw new Error("Остаточно видаляти можна лише нотатки з кошика");
    });
  }
}
