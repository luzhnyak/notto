import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
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
  const permission = await saveStep("SAVE_PICK_DIRECTORY", "Вибір папки", () =>
    FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(),
  );
  if (!permission.granted) return false;
  const bytes = await saveStep("SAVE_READ_SOURCE", "Читання вкладення", () =>
    FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
  );
  const filename =
    name.replace(/[\\/\u0000-\u001f]/g, "_").trim() || "attachment";
  const destination = await saveStep(
    "SAVE_CREATE_FILE",
    "Створення файла",
    () =>
      FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        filename,
        mimeType,
      ),
  );
  await saveStep("SAVE_WRITE_FILE", "Запис файла", () =>
    FileSystem.writeAsStringAsync(destination, bytes, {
      encoding: FileSystem.EncodingType.Base64,
    }),
  );
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
