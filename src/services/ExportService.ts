import { Note, Attachment } from "../domain/entities";
import { displayDate, noteDay } from "../utils/values";
export type ExportFormat = "txt" | "md" | "json" | "pdf";
export function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}
export function exportNote(
  note: Note,
  attachments: Attachment[],
  format: ExportFormat,
): string {
  const info = `${displayDate(noteDay(note))} · ${note.type.name}${note.emotion ? ` · ${note.emotion.icon} ${note.emotion.name}` : ""}`;
  const tags = note.tags.map((t) => "#" + t.name).join(" ");
  const links = attachments
    .map((a) => `${a.title ?? "Вкладення"}${a.url ? " — " + a.url : ""}`)
    .join("\n");
  if (format === "json")
    return JSON.stringify(
      { format: "notto-note", version: 1, note, attachments },
      null,
      2,
    );
  if (format === "pdf")
    return `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#202631;padding:30px;line-height:1.65}h1{font-size:28px}p{white-space:pre-wrap;overflow-wrap:anywhere}.meta{color:#666;font-size:12px}</style></head><body><h1>${escapeHtml(note.title)}</h1><p class="meta">${escapeHtml(info)}</p><p>${escapeHtml(note.content)}</p><p class="meta">${escapeHtml(tags)}</p><p>${escapeHtml(links)}</p></body></html>`;
  return `${format === "md" ? "# " : ""}${note.title}\n\n${info}\n\n${note.content}\n\n${tags}${links ? "\n\nВкладення:\n" + links : ""}\n`;
}
