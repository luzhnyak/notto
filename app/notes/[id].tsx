import {
  NoteActionsMenu,
  NoteMenuAction,
} from "../../components/notes/NoteActionsMenu";
import { Attachments } from "../../components/notes/Attachments";
import { shareExport } from "../../src/infrastructure/filesystem/NativeExport";
import { useRef, useState } from "react";
import { Alert, Text, Pressable, Platform } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
  const [menu, setMenu] = useState<"actions" | "export" | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);
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
  function closeAndRun(action: () => void) {
    if (pendingAction.current) return;
    if (Platform.OS === "ios") pendingAction.current = action;
    setMenu(null);
    if (Platform.OS !== "ios") action();
  }
  const actions: NoteMenuAction[] = !note
    ? []
    : note.status === "deleted"
      ? [
          {
            id: "restore",
            label: "Відновити",
            onPress: () =>
              closeAndRun(
                () => void act(() => s.notes.setStatus(note.id, "active")),
              ),
          },
          { id: "export", label: "Експорт", onPress: () => setMenu("export") },
          {
            id: "delete",
            label: "Видалити назавжди",
            danger: true,
            onPress: () =>
              closeAndRun(() =>
                confirm(
                  "Видалити назавжди?",
                  note.title,
                  () => void act(() => s.notes.permanentDelete(note.id), true),
                ),
              ),
          },
        ]
      : [
          {
            id: "edit",
            label: "Редагувати",
            onPress: () =>
              closeAndRun(() =>
                router.push({
                  pathname: "/notes/[id]/edit",
                  params: { id: note.id },
                }),
              ),
          },
          {
            id: "archive",
            label:
              note.status === "archived" ? "Повернути з архіву" : "Архівувати",
            onPress: () =>
              closeAndRun(
                () =>
                  void act(() =>
                    s.notes.setStatus(
                      note.id,
                      note.status === "archived" ? "active" : "archived",
                    ),
                  ),
              ),
          },
          {
            id: "pin",
            label: note.isPinned ? "Відкріпити" : "Закріпити",
            onPress: () =>
              closeAndRun(
                () => void act(() => s.notes.toggle(note.id, "is_pinned")),
              ),
          },
          {
            id: "favorite",
            label: note.isFavorite ? "Прибрати з вибраного" : "До вибраного",
            onPress: () =>
              closeAndRun(
                () => void act(() => s.notes.toggle(note.id, "is_favorite")),
              ),
          },
          { id: "export", label: "Експорт", onPress: () => setMenu("export") },
          {
            id: "trash",
            label: "До кошика",
            danger: true,
            onPress: () =>
              closeAndRun(() =>
                confirm(
                  "Перемістити до кошика?",
                  "Цю нотатку можна буде відновити.",
                  () =>
                    void act(() => s.notes.setStatus(note.id, "deleted"), true),
                ),
              ),
          },
        ];
  const exportActions: NoteMenuAction[] = note
    ? [
        {
          id: "back",
          label: "‹ Назад до дій",
          onPress: () => setMenu("actions"),
        },
        ...(["txt", "md", "pdf", "json"] as const).map((format) => ({
          id: format,
          label: format === "md" ? "Markdown" : format.toUpperCase(),
          onPress: () =>
            closeAndRun(
              () =>
                void act(async () => {
                  await shareExport(
                    note,
                    await s.attachments.list(note.id),
                    format,
                  );
                }),
            ),
        })),
      ]
    : [];
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            note ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Дії нотатки"
                accessibilityState={{ expanded: menu !== null, disabled: busy }}
                disabled={busy}
                hitSlop={6}
                onPress={() => setMenu("actions")}
                style={({ pressed }) => ({
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: busy ? 0.4 : pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ fontSize: 28, color: t.text }}>⋮</Text>
              </Pressable>
            ) : null,
        }}
      />
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
            <Attachments
              noteId={note.id}
              editable={note.status !== "deleted"}
            />
          </>
        ) : !state.loading && !state.error ? (
          <EmptyState
            title="Нотатку не знайдено"
            description="Її могли видалити."
          />
        ) : null}
      </Screen>
      <NoteActionsMenu
        onDismiss={() => {
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        }}
        visible={menu !== null && !!note && !busy}
        onClose={() => setMenu(null)}
        title={menu === "export" ? "Експорт нотатки" : "Дії нотатки"}
        actions={menu === "export" ? exportActions : actions}
      />
    </>
  );
}
