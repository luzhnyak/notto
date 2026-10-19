import { useState } from "react";
import { FlatList, View, Text } from "react-native";
import { router } from "expo-router";
import { useServices } from "../../src/services/context";
import { Note, NoteFilter } from "../../src/domain/entities";
import { useLoad } from "../../src/hooks/useLoad";
import { NoteCard } from "./NoteCard";
import {
  Button,
  EmptyState,
  Heading,
  Input,
  LoadState,
  Row,
} from "../common/UI";
import { useTheme } from "../../src/theme";
import { displayDate, noteDay } from "../../src/utils/values";
export function NotesList({
  filter = {},
  search = true,
  title = "Мої нотатки",
  create = true,
}: {
  filter?: NoteFilter;
  search?: boolean;
  title?: string;
  create?: boolean;
}) {
  const services = useServices();
  const t = useTheme();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Усі");
  const [timeline, setTimeline] = useState(false);
  const [limit, setLimit] = useState(50);
  const finalFilter = {
    ...filter,
    ...(search
      ? { query, favorite: tab === "Вибрані", pinned: tab === "Закріплені" }
      : {}),
    chronological: timeline,
    limit,
  };
  const state = useLoad(
    () => services.notes.list(finalFilter),
    [] as Note[],
    JSON.stringify(finalFilter),
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <FlatList
        data={state.data}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <Heading>{title}</Heading>
            {search && (
              <>
                <Input
                  accessibilityLabel="Пошук нотаток"
                  placeholder="Знайти в думках…"
                  value={query}
                  onChangeText={(v) => {
                    setQuery(v);
                    setLimit(50);
                  }}
                />
                <Row>
                  {["Усі", "Закріплені", "Вибрані"].map((v) => (
                    <Button
                      key={v}
                      title={v}
                      selected={tab === v}
                      onPress={() => {
                        setTab(v);
                        setLimit(50);
                      }}
                    />
                  ))}
                </Row>
              </>
            )}
            <Row>
              <Button
                title={timeline ? "Стрічка за датами" : "Список"}
                selected={timeline}
                onPress={() => setTimeline((v) => !v)}
              />
            </Row>
            <LoadState
              loading={state.loading}
              error={state.error}
              retry={state.reload}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ gap: 10 }}>
            {timeline &&
              (index === 0 ||
                noteDay(state.data[index - 1]).slice(0, 4) !==
                  noteDay(item).slice(0, 4)) && (
                <Text
                  style={{
                    color: t.text,
                    fontSize: 26,
                    fontWeight: "700",
                    marginTop: 14,
                  }}
                >
                  {noteDay(item).slice(0, 4)}
                </Text>
              )}
            {timeline &&
              (index === 0 ||
                noteDay(state.data[index - 1]).slice(0, 7) !==
                  noteDay(item).slice(0, 7)) && (
                <Text
                  style={{ color: t.primary, fontSize: 18, fontWeight: "600" }}
                >
                  {new Date(noteDay(item) + "T12:00:00").toLocaleDateString(
                    "uk-UA",
                    { month: "long" },
                  )}
                </Text>
              )}
            {timeline &&
              (index === 0 ||
                noteDay(state.data[index - 1]) !== noteDay(item)) && (
                <Text
                  style={{ color: t.muted, fontWeight: "700", marginTop: 8 }}
                >
                  {displayDate(noteDay(item))}
                </Text>
              )}
            <NoteCard note={item} />
          </View>
        )}
        ListEmptyComponent={
          !state.loading && !state.error ? (
            <EmptyState
              title="Тут починається ваша історія"
              description="Додайте запис або змініть фільтри."
            />
          ) : null
        }
        ListFooterComponent={
          state.data.length === limit ? (
            <Button
              title="Показати ще"
              onPress={() => setLimit((v) => v + 50)}
            />
          ) : null
        }
      />
      {create && (
        <View style={{ position: "absolute", bottom: 20, right: 20 }}>
          <Button
            title="＋ Нова нотатка"
            selected
            onPress={() => router.push("/notes/add")}
          />
        </View>
      )}
    </View>
  );
}
