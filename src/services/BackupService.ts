import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { OperationGate } from "./OperationGate";
export interface BackupPort {
  snapshot(): Promise<Record<string, Uint8Array>>;
  restore(files: Record<string, Uint8Array>): Promise<void>;
  hash(bytes: Uint8Array): Promise<string>;
}
interface Manifest {
  format: "notto";
  version: 1;
  createdAt: string;
  files: { name: string; size: number; sha256: string }[];
}
const MAX_BYTES = 200 * 1024 * 1024;
export function backupPath(name: string) {
  if (
    name === "notto.db" ||
    (/^attachments\/[a-zA-Z0-9._-]+$/.test(name) && !name.includes(".."))
  )
    return name;
  throw new Error("Некоректний шлях у резервній копії");
}
export class BackupService {
  constructor(
    private port: BackupPort,
    private gate: OperationGate,
    private maxBytes = MAX_BYTES,
  ) {}
  create() {
    return this.gate.run(async () => {
      const files = await this.port.snapshot();
      let total = 0;
      const manifest: Manifest = {
        format: "notto",
        version: 1,
        createdAt: new Date().toISOString(),
        files: [],
      };
      for (const [name, bytes] of Object.entries(files)) {
        backupPath(name);
        total += bytes.length;
        if (total > this.maxBytes)
          throw new Error("Резервна копія перевищує 200 МБ");
        manifest.files.push({
          name,
          size: bytes.length,
          sha256: await this.port.hash(bytes),
        });
      }
      files["manifest.json"] = strToU8(JSON.stringify(manifest));
      if (total + files["manifest.json"].length > this.maxBytes)
        throw new Error("Пакет із маніфестом перевищує ліміт");
      const archive = zipSync(files, { level: 1 });
      if (archive.length > this.maxBytes)
        throw new Error("Готовий архів перевищує ліміт");
      return archive;
    });
  }
  restore(bytes: Uint8Array) {
    return this.gate.run(async () => {
      if (bytes.length > this.maxBytes)
        throw new Error("Завеликий резервний пакет");
      let total = 0;
      const files = unzipSync(bytes, {
        filter: (entry) => {
          total += entry.originalSize;
          if (total > this.maxBytes) throw new Error("Пакет перевищує 200 МБ");
          if (entry.name !== "manifest.json") backupPath(entry.name);
          return true;
        },
      });
      if (!files["manifest.json"] || !files["notto.db"])
        throw new Error("Неповна резервна копія");
      const manifest: unknown = JSON.parse(strFromU8(files["manifest.json"]));
      if (!isManifest(manifest))
        throw new Error("Непідтримуваний формат копії");
      const seen = new Set<string>();
      for (const entry of manifest.files) {
        backupPath(entry.name);
        if (seen.has(entry.name))
          throw new Error("Повторення файлу в маніфесті");
        seen.add(entry.name);
        const file = files[entry.name];
        if (
          !file ||
          file.length !== entry.size ||
          (await this.port.hash(file)) !== entry.sha256
        )
          throw new Error("Файл копії пошкоджено");
      }
      if (!seen.has("notto.db") || Object.keys(files).length !== seen.size + 1)
        throw new Error("Маніфест не відповідає пакету");
      delete files["manifest.json"];
      await this.port.restore(files);
    });
  }
}
function isManifest(value: unknown): value is Manifest {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Manifest>;
  return (
    v.format === "notto" &&
    v.version === 1 &&
    typeof v.createdAt === "string" &&
    Array.isArray(v.files) &&
    v.files.every(
      (f) =>
        f &&
        typeof f.name === "string" &&
        Number.isSafeInteger(f.size) &&
        f.size >= 0 &&
        typeof f.sha256 === "string" &&
        /^[a-f0-9]{64}$/.test(f.sha256),
    )
  );
}
