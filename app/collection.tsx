import { useLocalSearchParams } from "expo-router";
import { NotesList } from "../components/notes/NotesList";
export default function Collection() {
  const { status, tag } = useLocalSearchParams<{
    status?: string;
    tag?: string;
  }>();
  return (
    <NotesList
      title={
        status === "deleted"
          ? "Кошик"
          : status === "archived"
            ? "Архів"
            : tag
              ? "Записи з тегом"
              : "Вибране"
      }
      filter={{
        status:
          status === "deleted"
            ? "deleted"
            : status === "archived"
              ? "archived"
              : "active",
        tagIds: tag ? [Number(tag)] : undefined,
        favorite: status === "favorite",
      }}
      search={false}
      create={false}
    />
  );
}
