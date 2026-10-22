import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { Database } from "../database/connection";
import { AttachmentFiles } from "../../services/AttachmentService";
export function safePath(value: string): string {
  if (!/^attachments\/[a-zA-Z0-9._-]+$/.test(value) || value.includes(".."))
    throw new Error("Некоректний шлях вкладення");
  return value;
}
export class NativeAttachmentFiles implements AttachmentFiles {
  constructor(private db: Database) {}
  async root() {
    const row = await this.db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key='storage_generation'",
    );
    const generation = row?.value ?? "initial";
    if (!/^[a-zA-Z0-9-]+$/.test(generation))
      throw new Error("Некоректне сховище");
    const dir = new Directory(Paths.document, "data", generation);
    if (!dir.exists) dir.create({ intermediates: true });
    return dir;
  }
  async copy(uri: string, name: string) {
    const source = new File(uri);
    if (!source.exists) throw new Error("Файл недоступний");
    if (source.size > 50 * 1024 * 1024)
      throw new Error("Максимальний розмір вкладення — 50 МБ");
    const extension =
      name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 10) || "bin";
    const path = `attachments/${Crypto.randomUUID()}.${extension}`;
    const root = await this.root();
    const dir = new Directory(root, "attachments");
    if (!dir.exists) dir.create();
    const target = new File(root, path);
    source.copy(target);
    return { path, size: target.size };
  }
  async remove(path: string) {
    const file = new File(await this.root(), safePath(path));
    if (file.exists) file.delete();
  }
  async uri(path: string) {
    const file = new File(await this.root(), safePath(path));
    if (!file.exists) throw new Error("Вкладення не знайдено");
    return file.uri;
  }
}

export async function cleanupStorageGenerations(db: Database): Promise<void> {
  const active =
    (
      await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key='storage_generation'",
      )
    )?.value ?? "initial";
  if (!/^[a-zA-Z0-9-]+$/.test(active))
    throw new Error("Некоректне активне сховище");
  const data = new Directory(Paths.document, "data");
  if (!data.exists) return;
  for (const entry of data.list())
    if (entry instanceof Directory && entry.name !== active) entry.delete();
}
