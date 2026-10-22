import { Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { Note } from "../../src/domain/entities";
import { displayDate, noteDay } from "../../src/utils/values";
import { useTheme } from "../../src/theme";
export function TypeIcon({ icon, color }: { icon: string; color: string }) {
  const name = Object.hasOwn(FontAwesome.glyphMap, icon)
    ? (icon as keyof typeof FontAwesome.glyphMap)
    : "bookmark";
  return <FontAwesome name={name} color={color} size={17} />;
}
export function NoteCard({ note }: { note: Note }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={note.title}
      onPress={() =>
        router.push({ pathname: "/notes/[id]", params: { id: note.id } })
      }
      style={({ pressed }) => ({
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 20,
        padding: 18,
        gap: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TypeIcon icon={note.type.icon} color={note.type.color} />
        <Text style={{ color: note.type.color, fontWeight: "600", flex: 1 }}>
          {note.type.name}
        </Text>
        <Text>
          {note.isPinned ? "📌 " : ""}
          {note.isFavorite ? "★ " : ""}
          {note.emotion?.icon}
        </Text>
      </View>
      <Text
        numberOfLines={2}
        style={{ color: t.text, fontSize: 19, fontWeight: "700" }}
      >
        {note.title}
      </Text>
      {!!note.content && (
        <Text
          numberOfLines={3}
          style={{ color: t.muted, fontSize: 15, lineHeight: 22 }}
        >
          {note.content}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Text style={{ color: t.muted, fontSize: 12 }}>
          {displayDate(noteDay(note))}
        </Text>
        {note.tags.slice(0, 4).map((tag) => (
          <Text key={tag.id} style={{ color: t.primary, fontSize: 12 }}>
            #{tag.name}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}
