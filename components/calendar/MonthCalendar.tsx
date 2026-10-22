import { useState } from "react";
import { Text, View } from "react-native";
import { Calendar, CalendarProps } from "react-native-calendars";
import { useTheme } from "../../src/theme";
import { localDate } from "../../src/utils/values";
import { CalendarYearPicker } from "./CalendarYearPicker";
import "./locale";

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
      <CalendarYearPicker year={year} onChange={showYear} />
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
