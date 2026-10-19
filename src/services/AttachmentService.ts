import { Attachment } from "../domain/entities";
import { AttachmentRepository } from "../domain/repositories";
import { cleanName } from "../utils/values";
import { OperationGate } from "./OperationGate";
export interface AttachmentFiles {
  copy(uri: string, name: string): Promise<{ path: string; size: number }>;
  remove(path: string): Promise<void>;
  uri(path: string): Promise<string>;
}
export function webUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Некоректне вебпосилання");
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname)
    throw new Error("Підтримуються лише HTTP та HTTPS");
  return url.toString();
}
export class AttachmentService {
  constructor(
    private repo: AttachmentRepository,
    private files: AttachmentFiles,
    private gate: OperationGate,
  ) {}
  list(noteId: number) {
    return this.repo.list(noteId);
  }
  addUrl(noteId: number, url: string, title: string) {
    return this.gate.run(() =>
      this.repo.create({
        noteId,
        type: "url",
        title: cleanName(title || url),
        url: webUrl(url),
        path: null,
        mimeType: null,
        fileSize: null,
        createdAt: new Date().toISOString(),
      }),
    );
  }
  addFile(
    noteId: number,
    type: "image" | "document",
    uri: string,
    name: string,
    mime: string,
  ) {
    return this.gate.run(async () => {
      if (type === "image" && !mime.startsWith("image/"))
        throw new Error("Оберіть зображення");
      const file = await this.files.copy(uri, name);
      try {
        return await this.repo.create({
          noteId,
          type,
          title: cleanName(name),
          path: file.path,
          url: null,
          mimeType: mime,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        await this.files.remove(file.path);
        throw e;
      }
    });
  }
  rename(id: number, title: string) {
    return this.gate.run(() => this.repo.rename(id, cleanName(title)));
  }
  remove(value: Attachment) {
    return this.gate.run(async () => {
      await this.repo.remove(value.id);
      if (value.path) await this.files.remove(value.path);
    });
  }
  uri(path: string) {
    return this.files.uri(path);
  }
}
