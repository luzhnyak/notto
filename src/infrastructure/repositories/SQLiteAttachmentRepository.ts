import { AttachmentRepository } from "../../domain/repositories";
import { Attachment } from "../../domain/entities";
import { Database } from "../database/connection";
const columns =
  "id,note_id AS noteId,type,title,path,url,mime_type AS mimeType,file_size AS fileSize,created_at AS createdAt";
export class SQLiteAttachmentRepository implements AttachmentRepository {
  constructor(private db: Database) {}
  list(noteId: number) {
    return this.db.getAllAsync<Attachment>(
      `SELECT ${columns} FROM attachments WHERE note_id=? ORDER BY id`,
      noteId,
    );
  }
  async create(v: Omit<Attachment, "id">) {
    let id = 0;
    await this.db.transaction(async (tx) => {
      const note = await tx.getFirstAsync<{ status: string }>(
        "SELECT status FROM notes WHERE id=?",
        v.noteId,
      );
      if (!note || note.status === "deleted")
        throw new Error("Нотатка недоступна");
      const r = await tx.runAsync(
        "INSERT INTO attachments(note_id,type,title,path,url,mime_type,file_size,created_at) VALUES(?,?,?,?,?,?,?,?)",
        v.noteId,
        v.type,
        v.title,
        v.path,
        v.url,
        v.mimeType,
        v.fileSize,
        v.createdAt,
      );
      id = r.lastInsertRowId;
      await tx.runAsync(
        "UPDATE notes SET updated_at=? WHERE id=?",
        new Date().toISOString(),
        v.noteId,
      );
    });
    return id;
  }
  async rename(id: number, title: string) {
    await this.db.runAsync(
      "UPDATE attachments SET title=? WHERE id=?",
      title,
      id,
    );
  }
  async remove(id: number) {
    await this.db.runAsync("DELETE FROM attachments WHERE id=?", id);
  }
}
