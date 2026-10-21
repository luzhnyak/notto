import { useState } from "react";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { Note } from "../../src/domain/entities";
import { localDate } from "../../src/utils/values";
import { NoteAgenda } from "../../components/calendar/NoteAgenda";
import { Heading, LoadState, Screen } from "../../components/common/UI";
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
  return (
    <Screen scroll={false}>
      <Heading small>Дні, які варто пам’ятати</Heading>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {!state.loading && !state.error && (
        <NoteAgenda
          notes={state.data}
          selected={selected}
          onSelect={setSelected}
        />
      )}
    </Screen>
  );
}
