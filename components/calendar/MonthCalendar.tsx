import { useState } from "react";
import { Text, View } from "react-native";
import { Calendar, CalendarProps, LocaleConfig } from "react-native-calendars";
import { useTheme } from "../../src/theme";
import { localDate } from "../../src/utils/values";
import { Button, Row } from "../common/UI";

LocaleConfig.locales.uk = {
  monthNames: [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
  ],
  monthNamesShort: [
    "Січ",
    "Лют",
    "Бер",
    "Кві",
    "Тра",
    "Чер",
    "Лип",
    "Сер",
    "Вер",
    "Жов",
    "Лис",
    "Гру",
  ],
  dayNames: [
    "Неділя",
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П’ятниця",
    "Субота",
  ],
  dayNamesShort: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  today: "Сьогодні",
};
LocaleConfig.defaultLocale = "uk";

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
  const markedDates: NonNullable<CalendarProps["markedDates"]> = {};
  for (const [day, colors] of Object.entries(markers)) {
    markedDates[day] = {
      dots: [...new Set(colors)]
        .slice(0, 3)
        .map((color) => ({ key: color, color, selectedDotColor: color })),
    };
  }
  if (selected)
    markedDates[selected] = {
      ...markedDates[selected],
      selected: true,
      selectedColor: t.soft,
      selectedTextColor: t.primary,
    };
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
      <Calendar
        key={t.dark ? "dark" : "light"}
        initialDate={localDate(month)}
        firstDay={1}
        minDate="1000-01-01"
        maxDate="9999-12-31"
        hideExtraDays
        enableSwipeMonths
        markingType="multi-dot"
        markedDates={markedDates}
        disableArrowLeft={year === 1000 && month.getMonth() === 0}
        disableArrowRight={year === 9999 && month.getMonth() === 11}
        onDayPress={(day) => onSelect(day.dateString)}
        onMonthChange={(day) =>
          setMonth(new Date(day.year, day.month - 1, 1, 12))
        }
        renderArrow={(direction) => (
          <Text style={{ fontSize: 28, color: t.primary }}>
            {direction === "left" ? "‹" : "›"}
          </Text>
        )}
        theme={{
          calendarBackground: t.background,
          textSectionTitleColor: t.muted,
          dayTextColor: t.text,
          monthTextColor: t.text,
          todayTextColor: t.primary,
          textDisabledColor: t.muted,
          arrowColor: t.primary,
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 13,
        }}
      />
    </View>
  );
}
