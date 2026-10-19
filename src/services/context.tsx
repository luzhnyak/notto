import { createContext, useContext } from "react";
import { nativeDatabase } from "../infrastructure/database/native";
import type { SQLiteDatabase } from "expo-sqlite";
import { NativeAttachmentFiles } from "../infrastructure/filesystem/AttachmentFiles";
import { NativeBackupPort } from "../infrastructure/filesystem/NativeBackupPort";
import { SQLiteAttachmentRepository } from "../infrastructure/repositories/SQLiteAttachmentRepository";
import { AttachmentService } from "./AttachmentService";
import { BackupService } from "./BackupService";
import { GoogleDriveService } from "./GoogleDriveService";
import { OperationGate } from "./OperationGate";
import { SQLiteNoteRepository } from "../infrastructure/repositories/SQLiteNoteRepository";
import {
  SQLiteEmotionRepository,
  SQLiteNoteTypeRepository,
  SQLiteTagRepository,
} from "../infrastructure/repositories/SQLiteCatalogRepositories";
import { NoteService } from "./NoteService";
import { EmotionService, NoteTypeService, TagService } from "./CatalogServices";
export function createServices(db: SQLiteDatabase, fts: boolean) {
  const gate = new OperationGate();
  const connection = nativeDatabase(db);
  const files = new NativeAttachmentFiles(connection);
  const attachments = new SQLiteAttachmentRepository(connection);
  return {
    attachments: new AttachmentService(attachments, files, gate),
    backup: new BackupService(new NativeBackupPort(db, files), gate),
    drive: new GoogleDriveService(),
    notes: new NoteService(
      new SQLiteNoteRepository(connection, fts),
      () => new Date(),
      gate,
      async (id) => {
        for (const a of await attachments.list(id)) {
          await attachments.remove(a.id);
          if (a.path) await files.remove(a.path);
        }
      },
    ),
    types: new NoteTypeService(new SQLiteNoteTypeRepository(connection)),
    emotions: new EmotionService(new SQLiteEmotionRepository(connection)),
    tags: new TagService(new SQLiteTagRepository(connection)),
    settings: {
      async get(key: string) {
        return (
          (
            await db.getFirstAsync<{ value: string }>(
              "SELECT value FROM settings WHERE key=?",
              key,
            )
          )?.value ?? null
        );
      },
      async set(key: string, value: string) {
        await db.runAsync(
          "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          key,
          value,
        );
      },
    },
  };
}
export type Services = ReturnType<typeof createServices>;
export const ServicesContext = createContext<Services | null>(null);
export function useServices() {
  const value = useContext(ServicesContext);
  if (!value) throw new Error("Notto is not initialized");
  return value;
}
