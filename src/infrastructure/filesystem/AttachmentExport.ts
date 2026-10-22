import { Platform } from "react-native";
import { File } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { message } from "../../utils/values";

export async function shareAttachment(uri: string, mimeType?: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Надсилання файлів недоступне");
  await Sharing.shareAsync(uri, { mimeType });
}

export async function saveAttachment(
  uri: string,
  name: string,
  mimeType: string,
) {
  if (Platform.OS !== "android") {
    await shareAttachment(uri, mimeType);
    return false; // The system sheet handles saving or cancellation.
  }
  // Read before showing the picker so a missing source cannot leave an empty file.
  const bytes = await saveStep("SAVE_READ_SOURCE", "Читання вкладення", () =>
    new File(uri).bytes(),
  );
  const filename =
    name.replace(/[\\/\u0000-\u001f]/g, "_").trim() || "attachment";
  const destination = await saveStep(
    "SAVE_CREATE_FILE",
    "Вибір файла для збереження",
    async () => {
      const result = await IntentLauncher.startActivityAsync(
        "android.intent.action.CREATE_DOCUMENT",
        {
          category: "android.intent.category.OPENABLE",
          type: mimeType || "application/octet-stream",
          extra: { "android.intent.extra.TITLE": filename },
        },
      );
      if (result.resultCode === IntentLauncher.ResultCode.Canceled) return null;
      const documentUri = createdDocumentUri(result.data);
      if (
        result.resultCode !== IntentLauncher.ResultCode.Success ||
        !documentUri
      ) {
        const details = JSON.stringify({
          resultCode: result.resultCode,
          dataType: typeof result.data,
          data: result.data ?? null,
        });
        throw new Error(
          `Android не повернув адресу файла для збереження. Результат діалогу: ${details}`,
        );
      }
      return documentUri;
    },
  );
  if (!destination) return false;
  // CREATE_DOCUMENT grants access to this single document. The modern API opens
  // its content URI directly, without the legacy SAF tree/canWrite checks.
  await saveStep("SAVE_WRITE_FILE", "Запис файла", async () => {
    new File(destination).write(bytes);
  });
  return true;
}

async function saveStep<T>(
  code: string,
  title: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    // Keep the original native exception in Metro/logcat as well as the alert.
    console.error(`Notto attachment save [${code}]`, error);
    throw new Error(`${title} [${code}]: ${message(error)}`);
  }
}

// Compatibility with installed Expo binaries returning Intent.toString(). Only
// accept the exact CREATE_DOCUMENT result shape observed in device logs. Keep
// the URI verbatim: decoding it or splitting on spaces changes document IDs.
function createdDocumentUri(data: unknown): string | undefined {
  if (typeof data !== "string") return undefined;
  if (data.startsWith("content://")) return data;
  return /^Intent \{ dat=(content:\/\/[^\r\n]+) flg=0x[0-9a-fA-F]+ \}$/.exec(
    data,
  )?.[1];
}
