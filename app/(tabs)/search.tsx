import { SelectField, TagPicker } from "../../components/forms/CatalogPicker";
import { useState } from "react";
import { Note, NoteFilter } from "../../src/domain/entities";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import {
  Button,
  EmptyState,
  Heading,
  Input,
  Label,
  LoadState,
  Row,
  Screen,
} from "../../components/common/UI";
import { NoteCard } from "../../components/notes/NoteCard";
import { validateDate } from "../../src/utils/values";
export default function Search() {
  const s = useServices();
  const [filter, setFilter] = useState<NoteFilter>({});
  const [limit, setLimit] = useState(50);
  const f = { ...filter, limit };
  const catalogs = useLoad(
    async () => ({
      types: await s.types.list(),
      tags: await s.tags.list(),
      emotions: await s.emotions.list(),
    }),
    { types: [], tags: [], emotions: [] } as {
      types: Note["type"][];
      tags: Note["tags"];
      emotions: NonNullable<Note["emotion"]>[];
    },
  );
  const [date, setDate] = useState("");
  const [dateKind, setDateKind] = useState<"day" | "createdDay" | "eventDay">(
    "day",
  );
  let invalidDate = false;
  try {
    if (date) validateDate(date);
  } catch {
    invalidDate = true;
  }
  const final = {
    ...f,
    [dateKind]: invalidDate ? undefined : date || undefined,
  };
  const results = useLoad(
    () => (invalidDate ? Promise.resolve([]) : s.notes.list(final)),
    [] as Note[],
    JSON.stringify({ ...final, invalidDate }),
  );
  function patch(value: Partial<NoteFilter>) {
    setFilter((v) => ({ ...v, ...value }));
    setLimit(50);
  }
  return (
    <Screen>
      <Heading>Знайти важливе</Heading>
      <Input
        placeholder="Заголовок або текст"
        value={filter.query ?? ""}
        onChangeText={(query) => patch({ query })}
      />
      <Label>Тип</Label>
      <SelectField
        label="Тип нотатки"
        placeholder="Усі типи"
        clearLabel="Усі типи"
        options={catalogs.data.types.map((v) => ({
          id: v.id,
          label: v.name,
          color: v.color,
        }))}
        value={filter.noteTypeId ?? null}
        onChange={(id) => patch({ noteTypeId: id ?? undefined })}
      />
      <Label>Теги · збіг усіх обраних</Label>
      <TagPicker
        options={catalogs.data.tags.map((v) => ({ id: v.id, label: v.name }))}
        value={filter.tagIds ?? []}
        onChange={(ids) => patch({ tagIds: ids })}
      />
      <Label>Емоція</Label>
      <SelectField
        label="Емоція"
        placeholder="Усі емоції"
        clearLabel="Усі емоції"
        options={catalogs.data.emotions.map((v) => ({
          id: v.id,
          label: `${v.icon} ${v.name}`,
        }))}
        value={filter.emotionId ?? null}
        onChange={(id) => patch({ emotionId: id ?? undefined })}
      />
      <Label>Дата</Label>
      <Row>
        {(
          [
            ["day", "Подія або створення"],
            ["eventDay", "Дата події"],
            ["createdDay", "Дата створення"],
          ] as const
        ).map(([key, title]) => (
          <Button
            key={key}
            title={title}
            selected={dateKind === key}
            onPress={() => setDateKind(key)}
          />
        ))}
      </Row>
      <Input placeholder="РРРР-ММ-ДД" value={date} onChangeText={setDate} />
      {invalidDate && <Label>Вкажіть коректну дату РРРР-ММ-ДД</Label>}
      <Label>Стан</Label>
      <Row>
        {(
          [
            ["active", "Активні"],
            ["archived", "Архів"],
            ["deleted", "Кошик"],
          ] as const
        ).map(([status, title]) => (
          <Button
            key={status}
            title={title}
            selected={(filter.status ?? "active") === status}
            onPress={() => patch({ status })}
          />
        ))}
      </Row>
      <Label>Сортування</Label>
      <Row>
        {(
          [
            ["date", "За датою"],
            ["title", "За назвою"],
            ["updated", "За змінами"],
          ] as const
        ).map(([sort, title]) => (
          <Button
            key={sort}
            title={title}
            selected={(filter.sort ?? "date") === sort}
            onPress={() => patch({ sort })}
          />
        ))}
      </Row>
      <Button
        title="Очистити фільтри"
        onPress={() => {
          setFilter({});
          setDate("");
          setLimit(50);
        }}
      />
      <LoadState
        loading={catalogs.loading || results.loading}
        error={catalogs.error || results.error}
        retry={() => {
          catalogs.reload();
          results.reload();
        }}
      />
      {results.data.map((n) => (
        <NoteCard key={n.id} note={n} />
      ))}
      {!results.loading && !results.error && !results.data.length && (
        <EmptyState
          title="Нічого не знайдено"
          description="Змініть запит або фільтри."
        />
      )}
      {results.data.length === limit && (
        <Button title="Показати ще" onPress={() => setLimit((v) => v + 50)} />
      )}
    </Screen>
  );
}
