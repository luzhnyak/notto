import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Attachment } from "../src/domain/entities";
const mockShare = jest.fn(async () => {});
const mockSave = jest.fn(async () => true);
const mockRemove = jest.fn(async (_a: Attachment) => {});
const mockRename = jest.fn(async (_id: number, _title: string) => {});
const mockChanged = jest.fn();
let mockAttachments: Attachment[];
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  Image: "Image",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (v: unknown) => v },
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn() },
  Platform: { OS: "android" },
  useColorScheme: () => "light",
  Modal: ({
    visible,
    children,
    onDismiss,
  }: {
    visible: boolean;
    children: React.ReactNode;
    onDismiss?: () => void;
  }) =>
    visible ? React.createElement("Modal", { onDismiss }, children) : null,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: "SafeAreaProvider",
  SafeAreaView: "SafeAreaView",
}));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("../src/infrastructure/filesystem/AttachmentExport", () => ({
  shareAttachment: (...args: unknown[]) => mockShare(...(args as [])),
  saveAttachment: (...args: unknown[]) => mockSave(...(args as [])),
}));
jest.mock("../src/services/context", () => ({
  useServices: () => ({
    attachments: {
      uri: async (p: string) => `file:///${p}`,
      remove: (a: Attachment) => mockRemove(a),
      rename: (id: number, title: string) => mockRename(id, title),
    },
  }),
}));
jest.mock("../src/hooks/useLoad", () => ({
  useLoad: (_loader: unknown, initial: unknown) => ({
    data: Array.isArray(initial) ? mockAttachments : "file:///thumbnail.jpg",
    loading: false,
    error: "",
    reload: jest.fn(),
  }),
}));
jest.mock("../src/store/useAppStore", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({ changed: mockChanged, theme: "light" }),
}));
import { Attachments } from "../components/notes/Attachments";
import { Alert, Platform } from "react-native";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function button(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((v) => v.props.accessibilityLabel === label);
}
async function mount(editable = true) {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Attachments, { noteId: 1, editable }));
  });
  return view;
}
async function press(view: ReactTestRenderer, label: string) {
  await act(async () => button(view, label)!.props.onPress());
}
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  mockAttachments = [
    {
      id: 1,
      noteId: 1,
      type: "image",
      title: "Фото",
      path: "attachments/a.jpg",
      url: null,
      mimeType: "image/jpeg",
      fileSize: 3,
      createdAt: "",
    },
    {
      id: 2,
      noteId: 1,
      type: "document",
      title: "Документ",
      path: "attachments/b.pdf",
      url: null,
      mimeType: "application/pdf",
      fileSize: 5,
      createdAt: "",
    },
    {
      id: 3,
      noteId: 1,
      type: "url",
      title: "Сайт",
      path: null,
      url: "https://example.com",
      mimeType: null,
      fileSize: null,
      createdAt: "",
    },
  ];
});
test("file actions are hidden until its menu opens and Save targets the selected attachment", async () => {
  const view = await mount();
  expect(button(view, "Зберегти")).toBeUndefined();
  expect(button(view, "Прибрати")).toBeUndefined();
  await press(view, "Дії вкладення: Документ");
  for (const label of ["Зберегти", "Надіслати", "Назва", "Прибрати"])
    expect(button(view, label)).toBeDefined();
  await press(view, "Зберегти");
  expect(mockSave).toHaveBeenCalledWith(
    "file:///attachments/b.pdf",
    "Документ.pdf",
    "application/pdf",
  );
  expect(button(view, "Зберегти")).toBeUndefined();
});
test("renaming from the menu edits the selected attachment", async () => {
  const view = await mount();
  await press(view, "Дії вкладення: Фото");
  await press(view, "Назва");
  const input = view.root
    .findAllByType("TextInput" as React.ElementType)
    .find((v) => v.props.placeholder === "Назва вкладення / посилання")!;
  expect(input.props.value).toBe("Фото");
  await act(async () => input.props.onChangeText("Нова назва"));
  await press(view, "Зберегти назву");
  expect(mockRename).toHaveBeenCalledWith(1, "Нова назва");
});
test("removal still requires confirmation and targets the selected attachment", async () => {
  const view = await mount();
  await press(view, "Дії вкладення: Документ");
  await press(view, "Прибрати");
  expect(mockRemove).not.toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2];
  await act(async () =>
    buttons.find((v: { text: string }) => v.text === "Підтвердити").onPress(),
  );
  expect(mockRemove).toHaveBeenCalledWith(mockAttachments[1]);
});
test("read-only files keep save/share while links have no action menu", async () => {
  const view = await mount(false);
  expect(button(view, "Дії вкладення: Сайт")).toBeUndefined();
  await press(view, "Дії вкладення: Фото");
  expect(button(view, "Зберегти")).toBeDefined();
  expect(button(view, "Надіслати")).toBeDefined();
  expect(button(view, "Назва")).toBeUndefined();
  expect(button(view, "Прибрати")).toBeUndefined();
});
test("iOS waits for the action menu to dismiss before opening system sharing", async () => {
  Platform.OS = "ios";
  const view = await mount();
  await press(view, "Дії вкладення: Фото");
  const dismiss = view.root.findByType("Modal" as React.ElementType).props
    .onDismiss;
  await press(view, "Надіслати");
  expect(mockShare).not.toHaveBeenCalled();
  await act(async () => dismiss());
  expect(mockShare).toHaveBeenCalledWith(
    "file:///attachments/a.jpg",
    "image/jpeg",
  );
});
