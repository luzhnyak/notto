import { Attachments } from "../../components/notes/Attachments";
import { shareExport } from "../../src/infrastructure/filesystem/NativeExport";
import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { useAppStore } from "../../src/store/useAppStore";
import { Note } from "../../src/domain/entities";
import { useTheme } from "../../src/theme";
import { displayDate, noteDay, message } from "../../src/utils/values";
import {
  Button,
  Card,
  confirm,
  EmptyState,
  Heading,
  Label,
  LoadState,
  Row,
  Screen,
} from "../../components/common/UI";
export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useServices();
  const changed = useAppStore((v) => v.changed);
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const state = useLoad(() => s.notes.get(Number(id)), null as Note | null, id);
  const note = state.data;
  async function act(action: () => Promise<void>, leave = false) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      changed();
      if (leave) router.back();
      else state.reload();
    } catch (e) {
      Alert.alert("Помилка", message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {note ? (
        <>
          <Row>
            <Label>
              {note.type.name} · {displayDate(noteDay(note))}
            </Label>
            {note.emotion && (
              <Label>
                {note.emotion.icon} {note.emotion.name}
              </Label>
            )}
          </Row>
          <Heading>{note.title}</Heading>
          <Card>
            <Text
              selectable
              style={{ color: t.text, fontSize: 17, lineHeight: 27 }}
            >
              {note.content || "Без тексту"}
            </Text>
          </Card>
          <Row>
            {note.tags.map((tag) => (
              <Button
                key={tag.id}
                title={`#${tag.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/collection",
                    params: { tag: tag.id },
                  })
                }
              />
            ))}
          </Row>
          <Label muted>
            Створено: {new Date(note.createdAt).toLocaleString("uk-UA")}
          </Label>
          <Label muted>
            Оновлено: {new Date(note.updatedAt).toLocaleString("uk-UA")}
          </Label>
          <Attachments noteId={note.id} editable={note.status !== "deleted"} />
          <Heading small>Експорт</Heading>
          <Row>
            {(["txt", "md", "pdf", "json"] as const).map((format) => (
              <Button
                key={format}
                title={format.toUpperCase()}
                disabled={busy}
                onPress={() =>
                  void act(async () => {
                    await shareExport(
                      note,
                      await s.attachments.list(note.id),
                      format,
                    );
                  })
                }
              />
            ))}
          </Row>
          <View
            style={{
              gap: 10,
              opacity: busy ? 0.5 : 1,
              pointerEvents: busy ? "none" : "auto",
            }}
          >
            {note.status === "deleted" ? (
              <>
                <Button
                  title="Відновити"
                  onPress={() =>
                    void act(() => s.notes.setStatus(note.id, "active"))
                  }
                />
                <Button
                  title="Видалити назавжди"
                  danger
                  onPress={() =>
                    confirm(
                      "Видалити назавжди?",
                      note.title,
                      () =>
                        void act(() => s.notes.permanentDelete(note.id), true),
                    )
                  }
                />
              </>
            ) : (
              <>
                <Button
                  title="Редагувати"
                  selected
                  onPress={() =>
                    router.push({
                      pathname: "/notes/[id]/edit",
                      params: { id: note.id },
                    })
                  }
                />
                <Row>
                  <Button
                    title={note.isPinned ? "Відкріпити" : "Закріпити"}
                    onPress={() =>
                      void act(() => s.notes.toggle(note.id, "is_pinned"))
                    }
                  />
                  <Button
                    title={
                      note.isFavorite ? "Прибрати з вибраного" : "До вибраного"
                    }
                    onPress={() =>
                      void act(() => s.notes.toggle(note.id, "is_favorite"))
                    }
                  />
                </Row>
                <Button
                  title={
                    note.status === "archived"
                      ? "Повернути з архіву"
                      : "Архівувати"
                  }
                  onPress={() =>
                    void act(() =>
                      s.notes.setStatus(
                        note.id,
                        note.status === "archived" ? "active" : "archived",
                      ),
                    )
                  }
                />
                <Button
                  title="До кошика"
                  danger
                  onPress={() =>
                    confirm(
                      "Перемістити до кошика?",
                      "Цю нотатку можна буде відновити.",
                      () =>
                        void act(
                          () => s.notes.setStatus(note.id, "deleted"),
                          true,
                        ),
                    )
                  }
                />
              </>
            )}
          </View>
        </>
      ) : !state.loading && !state.error ? (
        <EmptyState
          title="Нотатку не знайдено"
          description="Її могли видалити."
        />
      ) : null}
    </Screen>
  );
}
