import { useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";
import { Button, Heading, Input, Label, Row } from "../common/UI";

export interface PickerOption {
  id: number;
  label: string;
  color?: string;
}

function CatalogPicker({
  label,
  options,
  selectedIds,
  onChange,
  multiple = false,
  placeholder,
  clearLabel,
}: {
  label: string;
  options: PickerOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
  placeholder: string;
  clearLabel?: string;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<number[]>([]);
  const chosen = options.filter((option) => selectedIds.includes(option.id));
  const summary = chosen.length
    ? multiple
      ? chosen
          .slice(0, 2)
          .map((v) => v.label)
          .join(", ") + (chosen.length > 2 ? ` · ще ${chosen.length - 2}` : "")
      : chosen[0].label
    : placeholder;
  const filtered = options.filter((v) =>
    v.label
      .normalize("NFC")
      .toLocaleLowerCase("uk-UA")
      .includes(query.trim().normalize("NFC").toLocaleLowerCase("uk-UA")),
  );
  function show() {
    Keyboard.dismiss();
    setQuery("");
    setDraft([...selectedIds]);
    setOpen(true);
  }
  function select(id: number) {
    if (multiple)
      setDraft((values) =>
        values.includes(id) ? values.filter((v) => v !== id) : [...values, id],
      );
    else {
      onChange([id]);
      setOpen(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={show}
        style={({ pressed }) => ({
          minHeight: 48,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: t.buttonBorder,
          backgroundColor: t.button,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: t.text, fontSize: 16 }}
        >
          {summary}
        </Text>
        {multiple && chosen.length > 0 && (
          <Text style={{ color: t.primary, fontWeight: "700" }}>
            {chosen.length}
          </Text>
        )}
        <Text style={{ color: t.muted }}>▾</Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={{ padding: 20, gap: 12 }}>
                <Heading small>{label}</Heading>
                <Input
                  accessibilityLabel={`Пошук: ${label}`}
                  placeholder="Пошук у списку…"
                  value={query}
                  onChangeText={setQuery}
                />
                {multiple ? (
                  <Row>
                    <Label>Вибрано: {draft.length}</Label>
                    <Button title="Зняти всі" onPress={() => setDraft([])} />
                  </Row>
                ) : clearLabel ? (
                  <Button
                    title={clearLabel}
                    selected={!selectedIds.length}
                    onPress={() => {
                      onChange([]);
                      setOpen(false);
                    }}
                  />
                ) : null}
              </View>
              <FlatList
                data={filtered}
                keyExtractor={(v) => String(v.id)}
                extraData={multiple ? draft : selectedIds}
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 20,
                  gap: 6,
                }}
                ListEmptyComponent={
                  <Label muted>
                    {options.length ? "Нічого не знайдено" : "Список порожній"}
                  </Label>
                }
                renderItem={({ item }) => {
                  const selected = (multiple ? draft : selectedIds).includes(
                    item.id,
                  );
                  return (
                    <Pressable
                      accessibilityRole={multiple ? "checkbox" : "radio"}
                      accessibilityLabel={item.label}
                      accessibilityState={{ checked: selected }}
                      onPress={() => select(item.id)}
                      style={{
                        minHeight: 48,
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: selected ? t.soft : t.surface,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {item.color && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: item.color,
                          }}
                        />
                      )}
                      <Text style={{ flex: 1, color: t.text, fontSize: 16 }}>
                        {item.label}
                      </Text>
                      <Text style={{ color: t.primary, fontWeight: "700" }}>
                        {selected ? "✓" : multiple ? "○" : ""}
                      </Text>
                    </Pressable>
                  );
                }}
              />
              <View style={{ padding: 20, gap: 12 }}>
                <Row>
                  <Button
                    title={multiple ? "Скасувати" : "Закрити"}
                    onPress={() => setOpen(false)}
                  />
                  {multiple && (
                    <Button
                      title="Готово"
                      selected
                      onPress={() => {
                        onChange(draft);
                        setOpen(false);
                      }}
                    />
                  )}
                </Row>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

export function SelectField({
  value,
  onChange,
  ...props
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  options: PickerOption[];
  placeholder: string;
  clearLabel?: string;
}) {
  return (
    <CatalogPicker
      {...props}
      selectedIds={value === null ? [] : [value]}
      onChange={(ids) => onChange(ids[0] ?? null)}
    />
  );
}
export function TagPicker(props: {
  value: number[];
  onChange: (ids: number[]) => void;
  options: PickerOption[];
}) {
  return (
    <CatalogPicker
      label="Теги"
      placeholder="Вибрати теги"
      options={props.options}
      selectedIds={props.value}
      onChange={props.onChange}
      multiple
    />
  );
}
