import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
export default function TabLayout() {
  const t = useTheme();
  return (
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
