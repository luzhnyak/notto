import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";
import { Attachment, Note } from "../../domain/entities";
import { ExportFormat, exportNote } from "../../services/ExportService";
export async function shareExport(
  note: Note,
  attachments: Attachment[],
  format: ExportFormat,
) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Поширення файлів недоступне");
  const text = exportNote(note, attachments, format);
  let uri: string;
  if (format === "pdf")
    uri = (await Print.printToFileAsync({ html: text })).uri;
  else {
    const file = new File(
      Paths.cache,
      `notto-${note.id}-${Crypto.randomUUID()}.${format}`,
    );
    file.write(text);
    uri = file.uri;
  }
  await Sharing.shareAsync(uri, {
    mimeType:
      format === "pdf"
        ? "application/pdf"
        : format === "json"
          ? "application/json"
          : format === "md"
            ? "text/markdown"
            : "text/plain",
    dialogTitle: "Поширити нотатку",
  });
}
