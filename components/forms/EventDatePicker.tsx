import { useState } from "react";
import { Keyboard, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MonthCalendar } from "../calendar/MonthCalendar";
import { Button, Heading, Label, Row } from "../common/UI";
import { displayDate, localDate } from "../../src/utils/values";
import { useTheme } from "../../src/theme";

export function EventDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState("");
  function open() {
    Keyboard.dismiss();
    setDraft(value ?? localDate());
    setVisible(true);
  }
  return (
    <View style={{ gap: 8 }}>
      <Button
        title={value ? `▦ ${displayDate(value)}` : "▦ Вибрати дату"}
        accessibilityLabel="Вибрати дату події"
        onPress={open}
      />
      {value && <Button title="Очистити дату" onPress={() => onChange(null)} />}
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                gap: 16,
                paddingBottom: 32,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <Heading small>Дата події</Heading>
              <Label>Оберіть день у календарі</Label>
              {visible && (
                <MonthCalendar
                  key={value ?? "empty"}
                  selected={draft}
                  onSelect={setDraft}
                  markers={{}}
                />
              )}
              <Text
                style={{ color: t.text, fontSize: 18, textAlign: "center" }}
              >
                {draft ? displayDate(draft) : ""}
              </Text>
              <Row>
                <Button title="Скасувати" onPress={() => setVisible(false)} />
                <Button
                  title="Готово"
                  selected
                  onPress={() => {
                    onChange(draft);
                    setVisible(false);
                  }}
                />
              </Row>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}
