import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../src/theme";
import { localDate } from "../../src/utils/values";
import { Button, Row } from "../common/UI";
export function MonthCalendar({
  selected,
  onSelect,
  markers,
}: {
  selected: string;
  onSelect: (date: string) => void;
  markers: Record<string, string[]>;
}) {
  const t = useTheme();
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12),
  );
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  return (
    <View style={{ gap: 14 }}>
      <Row>
        <Button
          title="‹"
          onPress={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1, 12))
          }
        />
        <Text
          style={{
            color: t.text,
            fontSize: 18,
            fontWeight: "600",
            flex: 1,
            textAlign: "center",
          }}
        >
          {month.toLocaleDateString("uk-UA", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <Button
          title="›"
          onPress={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1, 12))
          }
        />
      </Row>
      <View style={{ flexDirection: "row" }}>
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((day) => (
          <Text
            key={day}
            style={{ width: "14.285%", textAlign: "center", color: t.muted }}
          >
            {day}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: count }, (_, i) => {
          const day = i - offset + 1;
          if (day < 1 || day > days)
            return <View key={i} style={{ width: "14.285%", height: 54 }} />;
          const date = localDate(
            new Date(month.getFullYear(), month.getMonth(), day, 12),
          );
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={date}
              accessibilityState={{ selected: date === selected }}
              onPress={() => onSelect(date)}
              style={{
                width: "14.285%",
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderRadius: 14,
                backgroundColor: date === selected ? t.soft : "transparent",
              }}
            >
              <Text
                style={{
                  color: date === selected ? t.primary : t.text,
                  fontWeight: date === localDate() ? "800" : "400",
                }}
              >
                {day}
              </Text>
              <View style={{ flexDirection: "row", gap: 3, height: 5 }}>
                {(markers[date] ?? []).slice(0, 3).map((color) => (
                  <View
                    key={color}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: color,
                    }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
