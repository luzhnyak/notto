import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
import { router } from "expo-router";
import { useServices } from "../../src/services/context";
import { useLoad } from "../../src/hooks/useLoad";
import { useAppStore } from "../../src/store/useAppStore";
import { Tag } from "../../src/domain/entities";
import { message } from "../../src/utils/values";
import {
  Button,
  confirm,
  Heading,
  Input,
  LoadState,
  Row,
  Screen,
} from "../../components/common/UI";
export default function Tags() {
  const t = useTheme();
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
        <View
          key={tag.id}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Нотатки з тегом ${tag.name}`}
            onPress={() =>
              router.push({ pathname: "/collection", params: { tag: tag.id } })
            }
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: t.primary, fontSize: 16 }}>#{tag.name}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Перейменувати тег ${tag.name}`}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => {
              setId(tag.id);
              setName(tag.name);
            }}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.45 : pressed ? 0.6 : 1,
            })}
          >
            <FontAwesome name="pencil" size={20} color={t.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Видалити тег ${tag.name}`}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() =>
              confirm(
                "Видалити тег?",
                "Нотатки залишаться, зв’язки з тегом буде прибрано.",
                () => void act(() => s.tags.remove(tag.id)),
              )
            }
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.45 : pressed ? 0.6 : 1,
            })}
          >
            <FontAwesome name="trash-o" size={20} color={t.danger} />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}
