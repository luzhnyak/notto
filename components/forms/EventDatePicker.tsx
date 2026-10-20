import { useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Row } from "../common/UI";
import { displayDate, localDate, message } from "../../src/utils/values";
import { useTheme } from "../../src/theme";

export function EventDatePicker({
  value,
  onChange,
  label = "Вибрати дату події",
  clearLabel = "Очистити дату",
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  clearLabel?: string;
}) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(new Date());
  function open() {
    Keyboard.dismiss();
    // Date-only values are local calendar dates, never UTC timestamps.
    const initial = value ? new Date(`${value}T12:00:00`) : new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode: "date",
        display: "calendar",
        firstDayOfWeek: 1,
        positiveButton: { label: "Готово" },
        negativeButton: { label: "Скасувати" },
        onChange: (event, date) => {
          if (event.type === "set" && date) onChange(localDate(date));
        },
        onError: (error) => Alert.alert("Вибір дати", message(error)),
      });
      return;
    }
    setDraft(initial);
    setVisible(true);
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Button
          title={value ? `▦ ${displayDate(value)}` : "▦ Вибрати дату"}
          accessibilityLabel={label}
          onPress={open}
        />
      </View>
      {value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          onPress={() => onChange(null)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            backgroundColor: t.button,
            borderWidth: 1,
            borderColor: t.buttonBorder,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text style={{ fontSize: 26, color: t.muted }}>×</Text>
        </Pressable>
      )}
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              <Heading small>Вибір дати</Heading>
              {visible && (
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="inline"
                  locale="uk-UA"
                  themeVariant={t.dark ? "dark" : "light"}
                  accentColor={t.primary}
                  onChange={(event, date) => {
                    if (event.type === "set" && date) setDraft(date);
                  }}
                />
              )}
              <Row>
                <Button title="Скасувати" onPress={() => setVisible(false)} />
                <Button
                  title="Готово"
                  selected
                  onPress={() => {
                    onChange(localDate(draft));
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
