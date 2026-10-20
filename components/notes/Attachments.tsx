import { useState } from "react";
import { Alert, Image, Linking, Modal, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  saveAttachment,
  shareAttachment,
} from "../../src/infrastructure/filesystem/AttachmentExport";
import { Attachment } from "../../src/domain/entities";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { useAppStore } from "../../src/store/useAppStore";
import { message } from "../../src/utils/values";
import {
  Button,
  Card,
  confirm,
  Heading,
  Input,
  Label,
  LoadState,
  Row,
} from "../common/UI";
export function Attachments({
  noteId,
  editable,
}: {
  noteId: number;
  editable: boolean;
}) {
  const s = useServices();
  const changed = useAppStore((v) => v.changed);
  const state = useLoad(
    () => s.attachments.list(noteId),
    [] as Attachment[],
    String(noteId),
  );
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [rename, setRename] = useState<number>();
  const [preview, setPreview] = useState("");
  async function act(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      changed();
      state.reload();
    } catch (e) {
      Alert.alert("Вкладення", message(e));
    } finally {
      setBusy(false);
    }
  }
  async function image() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    await s.attachments.addFile(
      noteId,
      "image",
      a.uri,
      a.fileName ?? "image.jpg",
      a.mimeType ?? "image/jpeg",
    );
  }
  async function document() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    await s.attachments.addFile(
      noteId,
      "document",
      a.uri,
      a.name,
      a.mimeType ?? "application/octet-stream",
    );
  }
  async function open(a: Attachment) {
    if (a.type === "url" && a.url) {
      await Linking.openURL(a.url);
      return;
    }
    if (!a.path) throw new Error("Вкладення недоступне");
    const uri = await s.attachments.uri(a.path);
    if (a.type === "image") setPreview(uri);
    else {
      await shareAttachment(uri, a.mimeType ?? undefined);
    }
  }
  async function exportFile(a: Attachment, save: boolean) {
    if (!a.path) throw new Error("Вкладення недоступне");
    const uri = await s.attachments.uri(a.path);
    if (save) {
      const extension = a.path.split("/").pop() ?? "attachment";
      let name = a.title ?? extension;
      // Renaming a title must not remove the stored file's extension.
      const suffix = extension.includes(".")
        ? extension.slice(extension.lastIndexOf("."))
        : "";
      if (suffix && !name.toLowerCase().endsWith(suffix.toLowerCase()))
        name += suffix;
      if (
        await saveAttachment(
          uri,
          name,
          a.mimeType ?? "application/octet-stream",
        )
      )
        Alert.alert("Вкладення", "Файл збережено в обраній папці");
    } else await shareAttachment(uri, a.mimeType ?? undefined);
  }
  return (
    <View style={{ gap: 12 }}>
      <Heading small>Вкладення</Heading>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {state.data.map((a) => (
        <Card key={a.id}>
          {a.type === "image" && a.path && <Thumbnail path={a.path} />}
          <Button
            title={`${a.type === "image" ? "▧" : a.type === "url" ? "↗" : "▤"} ${a.title ?? "Вкладення"}`}
            disabled={busy}
            onPress={() => void act(() => open(a))}
          />
          {a.url && <Label muted>{a.url}</Label>}
          {a.type !== "url" && a.path && (
            <Row>
              <Button
                title="Зберегти"
                disabled={busy}
                onPress={() => void act(() => exportFile(a, true))}
              />
              <Button
                title="Надіслати"
                disabled={busy}
                onPress={() => void act(() => exportFile(a, false))}
              />
            </Row>
          )}
          {editable && (
            <Row>
              <Button
                title="Назва"
                disabled={busy}
                onPress={() => {
                  setRename(a.id);
                  setTitle(a.title ?? "");
                }}
              />
              <Button
                title="Прибрати"
                danger
                disabled={busy}
                onPress={() =>
                  confirm(
                    "Видалити вкладення?",
                    a.title ?? "",
                    () => void act(() => s.attachments.remove(a)),
                  )
                }
              />
            </Row>
          )}
        </Card>
      ))}
      {editable && (
        <>
          <Row>
            <Button
              title="Фотографія"
              disabled={busy}
              onPress={() => void act(image)}
            />
            <Button
              title="Документ"
              disabled={busy}
              onPress={() => void act(document)}
            />
          </Row>
          <Input
            placeholder="Назва вкладення / посилання"
            value={title}
            onChangeText={setTitle}
          />
          {rename ? (
            <Row>
              <Button
                title="Зберегти назву"
                disabled={busy || !title.trim()}
                onPress={() =>
                  void act(async () => {
                    await s.attachments.rename(rename, title);
                    setRename(undefined);
                    setTitle("");
                  })
                }
              />
              <Button
                title="Скасувати"
                onPress={() => {
                  setRename(undefined);
                  setTitle("");
                }}
              />
            </Row>
          ) : (
            <>
              <Input
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://…"
                value={url}
                onChangeText={setUrl}
              />
              <Button
                title="Додати посилання"
                disabled={busy || !url.trim()}
                onPress={() =>
                  void act(async () => {
                    await s.attachments.addUrl(noteId, url, title);
                    setUrl("");
                    setTitle("");
                  })
                }
              />
            </>
          )}
        </>
      )}
      <Modal
        visible={!!preview}
        onRequestClose={() => setPreview("")}
        animationType="fade"
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#101010" }}>
            <View style={{ flex: 1, padding: 12 }}>
              <Image
                source={{ uri: preview }}
                style={{ flex: 1 }}
                resizeMode="contain"
              />
              <Button title="Закрити" onPress={() => setPreview("")} />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

function Thumbnail({ path }: { path: string }) {
  const s = useServices();
  const state = useLoad(() => s.attachments.uri(path), "", path);
  return state.data ? (
    <Image
      source={{ uri: state.data }}
      style={{ width: 96, height: 72, borderRadius: 12 }}
      resizeMode="cover"
    />
  ) : null;
}
