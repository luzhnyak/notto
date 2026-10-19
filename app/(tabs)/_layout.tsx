import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";
export default function TabLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: 60 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.text,
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
  );
}
