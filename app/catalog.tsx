import { useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { NoteType, Emotion } from "../src/domain/entities";
import { useServices } from "../src/services/context";
import { useLoad } from "../src/hooks/useLoad";
import { useAppStore } from "../src/store/useAppStore";
import { message } from "../src/utils/values";
import {
  Button,
  Card,
  confirm,
  Heading,
  Input,
  Label,
  LoadState,
  Row,
  Screen,
} from "../components/common/UI";
import { TypeIcon } from "../components/notes/NoteCard";
export default function Catalog() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const types = kind !== "emotions";
  const s = useServices();
  const changed = useAppStore((v) => v.changed);
  const state = useLoad<NoteType[] | Emotion[]>(
    () => (types ? s.types.list() : s.emotions.list()),
    [],
    kind,
  );
  const [edit, setEdit] = useState<number>();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState(types ? "user" : "😊");
  const [removing, setRemoving] = useState<number>();
  const [busy, setBusy] = useState(false);
  async function act(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      changed();
      setEdit(undefined);
      setName("");
      setRemoving(undefined);
    } catch (e) {
      Alert.alert("Довідник", message(e));
    } finally {
      setBusy(false);
    }
  }
  function save() {
    const sortOrder =
      state.data.find((v) => v.id === edit)?.sortOrder ?? state.data.length;
    return types
      ? s.types.save({ name, color, icon, sortOrder }, edit)
      : s.emotions.save({ name, color: color || null, icon, sortOrder }, edit);
  }
  function move(index: number, step: number) {
    const ids = state.data.map((v) => v.id);
    const next = index + step;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void act(() => (types ? s.types.reorder(ids) : s.emotions.reorder(ids)));
  }
  return (
    <Screen>
      <Heading>{types ? "Типи нотаток" : "Емоції"}</Heading>
      <Card>
        <Heading small>{edit ? "Редагувати" : "Створити"}</Heading>
        <Input placeholder="Назва" value={name} onChangeText={setName} />
        <Label>
          {types ? "Колір #RRGGBB" : "Колір #RRGGBB · необов’язково"}
        </Label>
        <Input autoCapitalize="none" value={color} onChangeText={setColor} />
        <Label>
          {types ? "Іконка FontAwesome (user, briefcase, calendar…)" : "Емодзі"}
        </Label>
        <Input value={icon} onChangeText={setIcon} />
        <Row>
          <Button
            title="Зберегти"
            selected
            disabled={busy || !name.trim()}
            onPress={() => void act(save)}
          />
          {edit && (
            <Button
              title="Скасувати"
              onPress={() => {
                setEdit(undefined);
                setName("");
              }}
            />
          )}
        </Row>
      </Card>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {state.data.map((v, i) => (
        <Card key={v.id}>
          <Row>
            {types ? (
              <TypeIcon icon={v.icon} color={v.color ?? "#3B82F6"} />
            ) : (
              <Label>{v.icon}</Label>
            )}
            <Heading small>{v.name}</Heading>
          </Row>
          <Row>
            <Button
              title="Редагувати"
              disabled={busy}
              onPress={() => {
                setEdit(v.id);
                setName(v.name);
                setColor(v.color ?? "");
                setIcon(v.icon);
              }}
            />
            <Button
              title="↑"
              disabled={busy || i === 0}
              onPress={() => move(i, -1)}
            />
            <Button
              title="↓"
              disabled={busy || i === state.data.length - 1}
              onPress={() => move(i, 1)}
            />
            <Button
              title="Видалити"
              danger
              disabled={busy || (types && state.data.length < 2)}
              onPress={() =>
                types
                  ? setRemoving(v.id)
                  : confirm(
                      "Видалити емоцію?",
                      "Нотатки залишаться без цієї емоції.",
                      () => void act(() => s.emotions.remove(v.id)),
                    )
              }
            />
          </Row>
          {types && removing === v.id && (
            <>
              <Label>Перенести всі нотатки до типу:</Label>
              <Row>
                {state.data
                  .filter((target) => target.id !== v.id)
                  .map((target) => (
                    <Button
                      key={target.id}
                      title={target.name}
                      disabled={busy}
                      onPress={() =>
                        confirm(
                          "Перенести нотатки й видалити тип?",
                          `${v.name} → ${target.name}. Також буде перенесено записи з архіву та кошика.`,
                          () => void act(() => s.types.remove(v.id, target.id)),
                        )
                      }
                    />
                  ))}
              </Row>
              <Button
                title="Скасувати"
                onPress={() => setRemoving(undefined)}
              />
            </>
          )}
        </Card>
      ))}
    </Screen>
  );
}
