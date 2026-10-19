import { useState } from "react";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { Note } from "../../src/domain/entities";
import { displayDate, localDate, noteDay } from "../../src/utils/values";
import { MonthCalendar } from "../../components/calendar/MonthCalendar";
import { NoteCard } from "../../components/notes/NoteCard";
import {
  EmptyState,
  Heading,
  LoadState,
  Screen,
} from "../../components/common/UI";
export default function Calendar() {
  const [selected, setSelected] = useState(localDate());
  const s = useServices();
  const state = useLoad(async () => {
    const notes: Note[] = [];
    let offset = 0;
    while (true) {
      const page = await s.notes.list({
        limit: 500,
        offset,
        chronological: true,
      });
      notes.push(...page);
      if (page.length < 500) break;
      offset += 500;
    }
    return notes;
  }, [] as Note[]);
  const markers: Record<string, string[]> = {};
  for (const note of state.data) {
    const day = noteDay(note);
    markers[day] = [...new Set([...(markers[day] ?? []), note.type.color])];
  }
  const notes = state.data.filter((n) => noteDay(n) === selected);
  return (
    <Screen>
      <Heading>Дні, які варто пам’ятати</Heading>
      <MonthCalendar
        selected={selected}
        onSelect={setSelected}
        markers={markers}
      />
      <Heading small>{displayDate(selected)}</Heading>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} />
      ))}
      {!notes.length && !state.loading && !state.error && (
        <EmptyState
          title="Вільна сторінка"
          description="Цього дня ще немає нотаток."
        />
      )}
    </Screen>
  );
}
