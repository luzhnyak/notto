import { BackupPanel } from "../../components/common/BackupPanel";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAppStore, ThemeMode } from "../../src/store/useAppStore";
import { useServices } from "../../src/services/context";
import { message } from "../../src/utils/values";
import {
  Button,
  Card,
  Heading,
  Label,
  Row,
  Screen,
} from "../../components/common/UI";
export default function Settings() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const services = useServices();
  async function changeTheme(value: ThemeMode) {
    try {
      await services.settings.set("theme", value);
      setTheme(value);
    } catch (e) {
      Alert.alert("Налаштування", message(e));
    }
  }
  return (
    <Screen>
      <Heading>Ваш простір</Heading>
      <Card>
        <Heading small>Оформлення</Heading>
        <Row>
          {(
            [
              ["system", "Системна"],
              ["light", "Світла"],
              ["dark", "Темна"],
            ] as const
          ).map(([mode, title]) => (
            <Button
              key={mode}
              title={title}
              selected={theme === mode}
              onPress={() => void changeTheme(mode)}
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Heading small>Упорядкування</Heading>
        <Button
          title="Типи нотаток"
          onPress={() =>
            router.push({ pathname: "/catalog", params: { kind: "types" } })
          }
        />
        <Button
          title="Емоції"
          onPress={() =>
            router.push({ pathname: "/catalog", params: { kind: "emotions" } })
          }
        />
        <Button
          title="Вибране"
          onPress={() =>
            router.push({
              pathname: "/collection",
              params: { status: "favorite" },
            })
          }
        />
        <Button
          title="Архів"
          onPress={() =>
            router.push({
              pathname: "/collection",
              params: { status: "archived" },
            })
          }
        />
        <Button
          title="Кошик"
          onPress={() =>
            router.push({
              pathname: "/collection",
              params: { status: "deleted" },
            })
          }
        />
      </Card>
      <BackupPanel />
      <Card>
        <Heading small>Notto</Heading>
        <Label muted>
          Ваші записи зберігаються на цьому пристрої. Підключення до інтернету
          не потрібне.
        </Label>
      </Card>
    </Screen>
  );
}
