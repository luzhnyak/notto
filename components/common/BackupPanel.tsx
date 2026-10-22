import { useState } from "react";
import { Alert } from "react-native";
import { File, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useServices } from "../../src/services/context";
import { useAppStore } from "../../src/store/useAppStore";
import { useLoad } from "../../src/hooks/useLoad";
import { message } from "../../src/utils/values";
import { Button, Card, confirm, Heading, Label, LoadState, Row } from "./UI";
export function BackupPanel() {
  const s = useServices();
  const changed = useAppStore((v) => v.changed);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [remoteDate, setRemoteDate] = useState<string | null>(null);
  const last = useLoad(
    () => s.settings.get("last_backup"),
    null as string | null,
  );
  async function act(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    useAppStore.setState({ busy: true });
    setStatus("Виконується…");
    try {
      await action();
      const theme = await s.settings.get("theme");
      if (theme === "system" || theme === "light" || theme === "dark")
        useAppStore.getState().setTheme(theme);
      changed();
      last.reload();
      setStatus("Готово");
    } catch (e) {
      setStatus(message(e));
      Alert.alert("Резервне копіювання", message(e));
    } finally {
      setBusy(false);
      useAppStore.setState({ busy: false });
    }
  }
  async function mark() {
    await s.settings.set("last_backup", new Date().toISOString());
  }
  async function localBackup() {
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("Поширення файлів недоступне");
    const bytes = await s.backup.create();
    const file = new File(Paths.cache, `notto-backup-${Date.now()}.zip`);
    file.write(bytes);
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/zip",
      dialogTitle: "Збережіть резервну копію Notto",
    });
    await mark();
  }
  async function restoreLocal() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/octet-stream"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = new File(result.assets[0].uri);
    if (file.size > 200 * 1024 * 1024)
      throw new Error("Копія перевищує 200 МБ");
    await s.backup.restore(await file.bytes());
  }
  function restore(action: () => Promise<void>) {
    confirm(
      "Замінити дані Notto?",
      "Усі поточні нотатки та вкладення буде замінено вмістом копії. Спочатку збережіть власну резервну копію.",
      () => void act(action),
    );
  }
  return (
    <Card>
      <Heading small>Резервні копії</Heading>
      <Label muted>
        Пакет містить базу та всі фотографії й документи. Копія не зашифрована:
        зберігайте її приватно.
      </Label>
      <LoadState
        loading={last.loading}
        error={last.error}
        retry={last.reload}
      />
      <Label>
        Останній експорт / завантаження:{" "}
        {last.data ? new Date(last.data).toLocaleString("uk-UA") : "ще немає"}
      </Label>
      <Row>
        <Button
          title="Зберегти пакет"
          disabled={busy}
          onPress={() => void act(localBackup)}
        />
        <Button
          title="Відновити з файлу"
          disabled={busy}
          onPress={() => restore(restoreLocal)}
        />
      </Row>
      <Heading small>Google Drive</Heading>
      <Label muted>
        Ручні копії у прихованій папці Notto вашого Google-акаунта. Злиття між
        пристроями та автоматичне перезаписування не виконуються.
      </Label>
      <Button
        title={connected ? "Відключити Google" : "Підключити Google"}
        disabled={busy}
        onPress={() =>
          void act(async () => {
            if (connected) {
              await s.drive.disconnect();
              setConnected(false);
              setRemoteDate(null);
            } else {
              await s.drive.connect();
              setConnected(true);
              setRemoteDate((await s.drive.latest())?.modifiedTime ?? null);
            }
          })
        }
      />
      <Label>
        Остання копія в Drive:{" "}
        {remoteDate
          ? new Date(remoteDate).toLocaleString("uk-UA")
          : "ще не перевірено / немає"}
      </Label>
      <Row>
        <Button
          title="Створити копію в Drive"
          disabled={busy || !connected}
          onPress={() =>
            void act(async () => {
              const bytes = await s.backup.create();
              const remote = await s.drive.upload(bytes);
              setRemoteDate(remote.modifiedTime);
              await mark();
            })
          }
        />
        <Button
          title="Відновити з Drive"
          disabled={busy || !connected}
          onPress={() =>
            restore(async () => {
              const remote = await s.drive.latest();
              if (!remote) throw new Error("Резервних копій ще немає");
              await s.backup.restore(await s.drive.download(remote.id));
            })
          }
        />
      </Row>
      {!!status && <Label>{status}</Label>}
    </Card>
  );
}
