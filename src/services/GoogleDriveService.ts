// Google OAuth identifiers belong to this Notto project, never to Home Cellar.
import { GoogleSignin } from "@react-native-google-signin/google-signin";
export interface DriveBackup {
  id: string;
  modifiedTime: string;
  name: string;
}
const scope = "https://www.googleapis.com/auth/drive.appdata";
export class GoogleDriveService {
  private configured = false;
  private configure() {
    if (this.configured) return;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId)
      throw new Error(
        "Налаштуйте OAuth Notto за інструкцією README та створіть development build.",
      );
    GoogleSignin.configure({
      webClientId,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: [scope],
    });
    this.configured = true;
  }
  async connect() {
    this.configure();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== "success") throw new Error("Підключення скасовано");
    const scopes = await GoogleSignin.addScopes({ scopes: [scope] });
    if (scopes?.type !== "success")
      throw new Error("Потрібен дозвіл Google Drive appDataFolder");
  }
  async disconnect() {
    this.configure();
    await GoogleSignin.signOut();
  }
  private async headers() {
    this.configure();
    const result = await GoogleSignin.signInSilently();
    if (result.type !== "success")
      throw new Error("Спочатку підключіть Google-акаунт");
    const { accessToken } = await GoogleSignin.getTokens();
    return { Authorization: `Bearer ${accessToken}` };
  }
  private async checked(response: Response) {
    if (!response.ok) throw new Error(`Google Drive: HTTP ${response.status}`);
    return response;
  }
  async latest(): Promise<DriveBackup | null> {
    const q = encodeURIComponent("name='notto-backup.zip' and trashed=false");
    const response = await this.checked(
      await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&pageSize=1&fields=files(id,name,modifiedTime)`,
        { headers: await this.headers() },
      ),
    );
    const data = (await response.json()) as { files: DriveBackup[] };
    return data.files[0] ?? null;
  }
  async upload(bytes: Uint8Array): Promise<DriveBackup> {
    const headers = await this.headers();
    const response = await this.checked(
      await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,modifiedTime",
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": "application/zip",
          },
          body: JSON.stringify({
            name: "notto-backup.zip",
            parents: ["appDataFolder"],
          }),
        },
      ),
    );
    const location = response.headers.get("Location");
    if (!location || !location.startsWith("https://www.googleapis.com/"))
      throw new Error("Не вдалося почати завантаження");
    const uploaded = await this.checked(
      await fetch(location, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/zip" },
        body: new Uint8Array(bytes).buffer,
      }),
    );
    return (await uploaded.json()) as DriveBackup;
  }
  async download(id: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Некоректний ID копії");
    const response = await this.checked(
      await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
        headers: await this.headers(),
      }),
    );
    const size = Number(response.headers.get("content-length"));
    if (size > 200 * 1024 * 1024) throw new Error("Завеликий резервний пакет");
    return new Uint8Array(await response.arrayBuffer());
  }
}
