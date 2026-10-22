import {
  Emotion,
  Note,
  NoteFilter,
  NoteInput,
  NoteStatus,
  NoteType,
  Tag,
} from "../entities";
export interface NoteRepository {
  list(filter: NoteFilter): Promise<Note[]>;
  get(id: number): Promise<Note | null>;
  save(input: NoteInput, timestamp: string, id?: number): Promise<number>;
  setStatus(id: number, status: NoteStatus, timestamp: string): Promise<void>;
  toggle(
    id: number,
    field: "is_favorite" | "is_pinned",
    timestamp: string,
  ): Promise<void>;
  permanentDelete(id: number): Promise<void>;
}
export interface NoteTypeRepository {
  list(): Promise<NoteType[]>;
  save(input: Omit<NoteType, "id">, id?: number): Promise<void>;
  remove(id: number, replacementId: number): Promise<void>;
  reorder(ids: number[]): Promise<void>;
}
export interface EmotionRepository {
  list(): Promise<Emotion[]>;
  save(input: Omit<Emotion, "id">, id?: number): Promise<void>;
  remove(id: number): Promise<void>;
  reorder(ids: number[]): Promise<void>;
}
export interface TagRepository {
  list(): Promise<Tag[]>;
  save(name: string, normalizedName: string, id?: number): Promise<number>;
  remove(id: number): Promise<void>;
}
export interface AttachmentRepository {
  list(noteId: number): Promise<import("../entities").Attachment[]>;
  create(value: Omit<import("../entities").Attachment, "id">): Promise<number>;
  rename(id: number, title: string): Promise<void>;
  remove(id: number): Promise<void>;
}
