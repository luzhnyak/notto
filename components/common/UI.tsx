import { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useTheme } from "../../src/theme";
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const t = useTheme();
  return scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screen, { flex: 1, backgroundColor: t.background }]}>
      {children}
    </View>
  );
}
export function Heading({
  children,
  small = false,
}: {
  children: ReactNode;
  small?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.text,
        fontSize: small ? 19 : 30,
        fontWeight: "700",
        marginVertical: 8,
      }}
    >
      {children}
    </Text>
  );
}
export function Label({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      style={{ color: muted ? t.muted : t.text, fontSize: 15, lineHeight: 23 }}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  selected = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: selected ? t.primary : t.surface,
          borderColor: danger ? t.danger : t.border,
          opacity: disabled ? 0.45 : pressed ? 0.65 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: selected
            ? t.dark
              ? "#15171C"
              : "#fff"
            : danger
              ? t.danger
              : t.text,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[
        styles.input,
        { color: t.text, backgroundColor: t.surface, borderColor: t.border },
        props.style,
      ]}
    />
  );
}
export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={{ paddingVertical: 36, gap: 8, alignItems: "center" }}>
      <Heading small>{title}</Heading>
      <Label muted>{description}</Label>
    </View>
  );
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  const t = useTheme();
  return error ? (
    <Card>
      <Text accessibilityRole="alert" style={{ color: t.danger }}>
        {error}
      </Text>
      <Button title="Спробувати ще" onPress={retry} />
    </Card>
  ) : loading ? (
    <ActivityIndicator size="large" color={t.primary} />
  ) : null;
}
export function confirm(
  title: string,
  description: string,
  onConfirm: () => void,
  danger = true,
) {
  Alert.alert(title, description, [
    { text: "Скасувати", style: "cancel" },
    {
      text: "Підтвердити",
      style: danger ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
const styles = StyleSheet.create({
  screen: { padding: 20, gap: 14, paddingBottom: 40 },
  card: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
  },
});
