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
  const [month, setMonth] = useState(() => {
    const initial = selected ? new Date(`${selected}T12:00:00`) : new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1, 12);
  });
  const [choosingYear, setChoosingYear] = useState(false);
  const [yearStart, setYearStart] = useState(
    () => Math.floor(month.getFullYear() / 12) * 12,
  );
  const year = month.getFullYear();
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  function showYear(value: number) {
    if (value < 1000 || value > 9999) return;
    setMonth((m) => new Date(value, m.getMonth(), 1, 12));
  }
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Button
          title="«"
          accessibilityLabel="Попередній рік"
          disabled={year <= 1000}
          onPress={() => showYear(year - 1)}
        />
        <Button
          title={String(year)}
          accessibilityLabel="Вибрати рік"
          selected={choosingYear}
          onPress={() => {
            setYearStart(Math.floor(year / 12) * 12);
            setChoosingYear((v) => !v);
          }}
        />
        <Button
          title="»"
          accessibilityLabel="Наступний рік"
          disabled={year >= 9999}
          onPress={() => showYear(year + 1)}
        />
      </View>
      {choosingYear ? (
        <View style={{ gap: 12 }}>
          <Row>
            <Button
              title="‹ 12 років"
              disabled={yearStart <= 1000}
              onPress={() => setYearStart((v) => Math.max(1000, v - 12))}
            />
            <Button
              title="12 років ›"
              disabled={yearStart + 12 > 9999}
              onPress={() => setYearStart((v) => v + 12)}
            />
          </Row>
          <Row>
            {Array.from({ length: 12 }, (_, i) => yearStart + i)
              .filter((y) => y >= 1000 && y <= 9999)
              .map((y) => (
                <Button
                  key={y}
                  title={String(y)}
                  selected={year === y}
                  onPress={() => {
                    showYear(y);
                    setChoosingYear(false);
                  }}
                />
              ))}
          </Row>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button
          title="‹"
          accessibilityLabel="Попередній місяць"
          disabled={year === 1000 && month.getMonth() === 0}
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
          {month.toLocaleDateString("uk-UA", { month: "long" })}
        </Text>
        <Button
          title="›"
          accessibilityLabel="Наступний місяць"
          disabled={year === 9999 && month.getMonth() === 11}
          onPress={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1, 12))
          }
        />
      </View>
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
          const date = localDate(new Date(year, month.getMonth(), day, 12));
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
