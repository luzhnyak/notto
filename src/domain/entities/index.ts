export type NoteStatus = "active" | "archived" | "deleted";
export interface NoteType {
  id: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}
export interface Emotion {
  id: number;
  name: string;
  icon: string;
  color: string | null;
  sortOrder: number;
}
export interface Tag {
  id: number;
  name: string;
  normalizedName: string;
}
export interface Attachment {
  id: number;
  noteId: number;
  type: "image" | "document" | "url";
  title: string | null;
  path: string | null;
  url: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}
export interface Note {
  id: number;
  title: string;
  content: string;
  noteTypeId: number;
  emotionId: number | null;
  eventDate: string | null;
  status: NoteStatus;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tags: Tag[];
  type: NoteType;
  emotion: Emotion | null;
}
export interface NoteInput {
  title: string;
  content: string;
  noteTypeId: number;
  emotionId: number | null;
  eventDate: string | null;
  tagIds: number[];
}
export interface NoteFilter {
  query?: string;
  status?: NoteStatus;
  noteTypeId?: number;
  emotionId?: number;
  tagIds?: number[];
  day?: string;
  createdDay?: string;
  eventDay?: string;
  favorite?: boolean;
  pinned?: boolean;
  sort?: "date" | "title" | "updated";
  chronological?: boolean;
  limit?: number;
  offset?: number;
}
