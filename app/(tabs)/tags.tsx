import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { useAppStore } from "../../src/store/useAppStore";
import { Tag } from "../../src/domain/entities";
import { message } from "../../src/utils/values";
import {
  Button,
  Card,
  confirm,
  Heading,
  Input,
  LoadState,
  Row,
  Screen,
} from "../../components/common/UI";
export default function Tags() {
  const s = useServices();
  const changed = useAppStore((v) => v.changed);
  const state = useLoad(() => s.tags.list(), [] as Tag[]);
  const [name, setName] = useState("");
  const [id, setId] = useState<number>();
  const [busy, setBusy] = useState(false);
  async function act(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      changed();
      setId(undefined);
      setName("");
    } catch (e) {
      Alert.alert("Теги", message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading>Теми ваших записів</Heading>
      <Input placeholder="Назва тегу" value={name} onChangeText={setName} />
      <Row>
        <Button
          title={id ? "Зберегти зміни" : "Створити тег"}
          selected
          disabled={busy || !name.trim()}
          onPress={() => void act(() => s.tags.save(name, id))}
        />
        {id && (
          <Button
            title="Скасувати"
            onPress={() => {
              setId(undefined);
              setName("");
            }}
          />
        )}
      </Row>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {state.data.map((tag) => (
        <Card key={tag.id}>
          <Button
            title={`#${tag.name}`}
            onPress={() =>
              router.push({ pathname: "/collection", params: { tag: tag.id } })
            }
          />
          <Row>
            <Button
              title="Перейменувати"
              onPress={() => {
                setId(tag.id);
                setName(tag.name);
              }}
            />
            <Button
              title="Видалити"
              danger
              disabled={busy}
              onPress={() =>
                confirm(
                  "Видалити тег?",
                  "Нотатки залишаться, зв’язки з тегом буде прибрано.",
                  () => void act(() => s.tags.remove(tag.id)),
                )
              }
            />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
