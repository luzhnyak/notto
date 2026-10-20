import { useRef, useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import { NoteActionsMenu } from "../../components/notes/NoteActionsMenu";
import { router, Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
export default function TabLayout() {
  const t = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  function navigate(status: "favorite" | "archived" | "deleted") {
    if (pendingNavigation.current) return;
    const open = () =>
      router.push({ pathname: "/collection", params: { status } });
    if (Platform.OS === "ios") pendingNavigation.current = open;
    setMenuVisible(false);
    if (Platform.OS !== "ios") open();
  }
  return (
    <>
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          tabBarActiveTintColor: t.primary,
          tabBarStyle: {
            backgroundColor: t.surface,
            borderTopColor: t.border,
            height: 60,
            paddingTop: 7,
            paddingBottom: 6,
          },
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.text,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Меню розділів"
              onPress={() => setMenuVisible(true)}
              style={{
                minWidth: 48,
                minHeight: 48,
                marginRight: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.text, fontSize: 28 }}>⋮</Text>
            </Pressable>
          ),
        }}
      >
        {(
          [
            ["index", "Нотатки", "sticky-note-o"],
            ["search", "Пошук", "search"],
            ["calendar", "Календар", "calendar"],
            ["tags", "Теги", "tags"],
            ["settings", "Налаштування", "sliders"],
          ] as const
        ).map(([name, title, icon]) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarLabelStyle: { fontSize: 10 },
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name={icon} color={color} size={size} />
              ),
            }}
          />
        ))}
      </Tabs>
      <NoteActionsMenu
        visible={menuVisible}
        title="Розділи нотаток"
        onClose={() => setMenuVisible(false)}
        onDismiss={() => {
          const open = pendingNavigation.current;
          pendingNavigation.current = null;
          open?.();
        }}
        actions={[
          {
            id: "favorite",
            label: "Вибране",
            onPress: () => navigate("favorite"),
          },
          {
            id: "archived",
            label: "Архів",
            onPress: () => navigate("archived"),
          },
          { id: "deleted", label: "Кошик", onPress: () => navigate("deleted") },
        ]}
      />
    </>
  );
}
