import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import {
  Agenda,
  AgendaEntry,
  AgendaSchedule,
  CalendarProps,
} from "react-native-calendars";
import { Note } from "../../src/domain/entities";
import { localDate, noteDay } from "../../src/utils/values";
import { useTheme } from "../../src/theme";
import { EmptyState, Label } from "../common/UI";
import { NoteCard } from "../notes/NoteCard";
import { CalendarYearPicker } from "./CalendarYearPicker";
import "./locale";

type NoteEntry = AgendaEntry & { note: Note };

// Agenda treats an absent date as not loaded. Materialize known empty days in
// each visited month and its neighbours, including the 31-day forward list.
function buildSchedule(notes: Note[], months: string[]): AgendaSchedule {
  const items: Record<string, NoteEntry[]> = {};
  for (const month of new Set(months)) {
    const first = new Date(`${month}-01T12:00:00`);
    for (let offset = -1; offset <= 1; offset++) {
      const day = new Date(
        first.getFullYear(),
        first.getMonth() + offset,
        1,
        12,
      );
      if (day.getFullYear() < 1000 || day.getFullYear() > 9999) continue;
      const targetMonth = day.getMonth();
      while (day.getMonth() === targetMonth) {
        items[localDate(day)] ??= [];
        day.setDate(day.getDate() + 1);
      }
    }
  }
  for (const note of notes) {
    const day = noteDay(note);
    (items[day] ??= []).push({ name: note.title, day, height: 120, note });
  }
  return items;
}

export function NoteAgenda({
  notes,
  selected,
  onSelect,
}: {
  notes: Note[];
  selected: string;
  onSelect: (day: string) => void;
}) {
  const t = useTheme();
  const [anchor, setAnchor] = useState(selected);
  const [months, setMonths] = useState<string[]>([selected.slice(0, 7)]);
  const selectedMonth = selected.slice(0, 7);
  const items = useMemo(
    () => buildSchedule(notes, [...months, selectedMonth]),
    [notes, months, selectedMonth],
  );
  const markedDates = useMemo(() => {
    const colors: Record<string, Set<string>> = {};
    for (const note of notes)
      (colors[noteDay(note)] ??= new Set()).add(note.type.color);
    const marks: NonNullable<CalendarProps["markedDates"]> = {};
    for (const [day, values] of Object.entries(colors)) {
      marks[day] = {
        dots: [...values]
          .slice(0, 3)
          .map((color) => ({ key: color, color, selectedDotColor: color })),
      };
    }
    return marks;
  }, [notes]);
  const rememberMonth = useCallback(
    ({ dateString }: { dateString: string }) => {
      const month = dateString.slice(0, 7);
      setMonths((previous) =>
        previous.includes(month) ? previous : [...previous, month],
      );
    },
    [],
  );
  function selectDay(day: { dateString: string }) {
    rememberMonth(day);
    onSelect(day.dateString);
  }
  function selectYear(year: number) {
    const current = new Date(`${selected}T12:00:00`);
    const day = Math.min(
      current.getDate(),
      new Date(year, current.getMonth() + 1, 0).getDate(),
    );
    const target = localDate(new Date(year, current.getMonth(), day, 12));
    // CalendarList's scroll window is anchored at mount. Remount only for an
    // explicit year jump, never on normal day selection or agenda scrolling.
    setAnchor(target);
    setMonths([target.slice(0, 7)]);
    onSelect(target);
  }
  return (
    <View style={{ flex: 1, gap: 12 }}>
      <CalendarYearPicker
        year={Number(selected.slice(0, 4))}
        onChange={selectYear}
      />
      <Agenda
        key={`${anchor}-${t.dark ? "dark" : "light"}`}
        style={{ flex: 1, marginHorizontal: -12 }}
        selected={selected}
        items={items}
        firstDay={1}
        pastScrollRange={24}
        futureScrollRange={24}
        minDate="1000-01-01"
        maxDate="9999-12-31"
        showClosingKnob
        // Agenda translates an overflow-hidden CalendarList. Android clipping
        // can detach its months, leaving only the separate weekday header.
        removeClippedSubviews={false}
        markingType="multi-dot"
        markedDates={markedDates}
        loadItemsForMonth={rememberMonth}
        onDayPress={selectDay}
        onDayChange={selectDay}
        rowHasChanged={(previous, next) => previous !== next}
        renderItem={(entry) => (
          <View style={{ marginTop: 10, marginRight: 8, marginBottom: 4 }}>
            <NoteCard note={(entry as NoteEntry).note} />
          </View>
        )}
        renderEmptyDate={() => (
          <View
            style={{ minHeight: 56, justifyContent: "center", marginRight: 8 }}
          >
            <Label muted>Немає нотаток</Label>
          </View>
        )}
        renderEmptyData={() => (
          <EmptyState
            title="Вільна сторінка"
            description="Цього дня ще немає нотаток."
          />
        )}
        theme={{
          backgroundColor: t.background,
          calendarBackground: t.background,
          textSectionTitleColor: t.muted,
          dayTextColor: t.text,
          monthTextColor: t.text,
          todayTextColor: t.primary,
          selectedDayBackgroundColor: t.soft,
          selectedDayTextColor: t.primary,
          textDisabledColor: t.muted,
          arrowColor: t.primary,
          agendaDayTextColor: t.muted,
          agendaDayNumColor: t.text,
          agendaTodayColor: t.primary,
          agendaKnobColor: t.primary,
        }}
      />
    </View>
  );
}
