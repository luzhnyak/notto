import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";

export interface NoteMenuAction {
  id: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}
export function NoteActionsMenu({
  visible,
  onClose,
  onDismiss,
  actions,
  title = "Дії нотатки",
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  actions: NoteMenuAction[];
  title?: string;
}) {
  const t = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрити меню"
            onPress={onClose}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#00000040",
            }}
          />
          <SafeAreaView pointerEvents="box-none" style={{ flex: 1 }}>
            <View
              pointerEvents="box-none"
              style={{
                flex: 1,
                padding: 12,
                paddingTop: 56,
                alignItems: "flex-end",
              }}
            >
              <View
                accessibilityViewIsModal
                style={{
                  width: 300,
                  maxWidth: "100%",
                  maxHeight: "100%",
                  backgroundColor: t.surface,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 18,
                  overflow: "hidden",
                  elevation: 10,
                }}
              >
                <Text
                  accessibilityRole="header"
                  style={{
                    color: t.muted,
                    fontSize: 13,
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                  }}
                >
                  {title}
                </Text>
                <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                  {actions.map((action) => (
                    <Pressable
                      key={action.id}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      onPress={action.onPress}
                      style={({ pressed }) => ({
                        minHeight: 48,
                        paddingHorizontal: 18,
                        paddingVertical: 14,
                        backgroundColor: pressed ? t.button : "transparent",
                      })}
                    >
                      <Text
                        style={{
                          color: action.danger ? t.danger : t.text,
                          fontSize: 16,
                        }}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
