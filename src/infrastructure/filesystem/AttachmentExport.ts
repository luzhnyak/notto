import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

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
  const permission =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return false;
  const bytes = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const filename =
    name.replace(/[\\/\u0000-\u001f]/g, "_").trim() || "attachment";
  const destination = await FileSystem.StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    filename,
    mimeType,
  );
  try {
    await FileSystem.writeAsStringAsync(destination, bytes, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(
      () => {},
    );
    throw error;
  }
  return true;
}
