import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Note } from "../src/domain/entities";
const mockToggle = jest.fn<Promise<void>, unknown[]>(async () => {});
const mockStatus = jest.fn<Promise<void>, unknown[]>(async () => {});
const mockShare = jest.fn<Promise<void>, unknown[]>(async () => {});
let mockNote: Note;
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (v: unknown) => v },
  Alert: { alert: jest.fn() },
  Platform: { OS: "android" },
  useColorScheme: () => "light",
  Modal: ({
    visible,
    children,
    onDismiss,
  }: {
    visible: boolean;
    onDismiss?: () => void;
    children: React.ReactNode;
  }) =>
    visible ? React.createElement("Modal", { onDismiss }, children) : null,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  SafeAreaProvider: "SafeAreaProvider",
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: "1" }),
  useFocusEffect: (callback: () => void) => {
    const R = jest.requireActual<typeof import("react")>("react");
    R.useEffect(callback, [callback]);
  },
  Stack: {
    Screen: ({
      options,
    }: {
      options: { headerRight: () => React.ReactNode };
    }) => React.createElement("Header", null, options.headerRight()),
  },
}));
jest.mock("../src/services/context", () => ({
  useServices: () => ({
    notes: {
      get: async () => mockNote,
      toggle: (...args: unknown[]) => mockToggle(...args),
      setStatus: (...args: unknown[]) => mockStatus(...args),
      permanentDelete: async () => {},
    },
    attachments: { list: async () => [] },
  }),
}));
jest.mock("../src/infrastructure/filesystem/NativeExport", () => ({
  shareExport: (...args: unknown[]) => mockShare(...args),
}));
jest.mock("../components/notes/Attachments", () => ({
  Attachments: () => React.createElement("Attachments"),
}));
import Details from "../app/notes/[id]";
import { Alert, Platform } from "react-native";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function button(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((v) => v.props.accessibilityLabel === label)!;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockNote = {
    id: 1,
    title: "Запис",
    content: "Текст",
    noteTypeId: 1,
    emotionId: null,
    eventDate: null,
    status: "active",
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-10-20T10:00:00Z",
    updatedAt: "2026-10-20T10:00:00Z",
    deletedAt: null,
    tags: [],
    emotion: null,
    type: {
      id: 1,
      name: "Особисте",
      color: "#3B82F6",
      icon: "user",
      sortOrder: 0,
    },
  };
});
test("actions open from header and pin is invoked from menu", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Details));
  });
  expect(button(view, "Редагувати")).toBeUndefined();
  await act(async () => button(view, "Дії нотатки").props.onPress());
  expect(button(view, "Редагувати")).toBeDefined();
  await act(async () => button(view, "Закріпити").props.onPress());
  expect(mockToggle.mock.calls[0]).toEqual([1, "is_pinned"]);
  expect(button(view, "Редагувати")).toBeUndefined();
  await act(async () => view.unmount());
});
test("export format selection invokes export and dismisses menu", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Details));
  });
  await act(async () => button(view, "Дії нотатки").props.onPress());
  await act(async () => button(view, "Експорт").props.onPress());
  await act(async () => button(view, "PDF").props.onPress());
  expect(mockShare.mock.calls[0]).toEqual([mockNote, [], "pdf"]);
  expect(button(view, "PDF")).toBeUndefined();
  await act(async () => view.unmount());
});
test("trash keeps restore and confirmed deletion, without editing actions", async () => {
  mockNote = {
    ...mockNote,
    status: "deleted",
    deletedAt: "2026-10-20T11:00:00Z",
  };
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Details));
  });
  await act(async () => button(view, "Дії нотатки").props.onPress());
  expect(button(view, "Редагувати")).toBeUndefined();
  expect(button(view, "Відновити")).toBeDefined();
  await act(async () => button(view, "Видалити назавжди").props.onPress());
  expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe("Видалити назавжди?");
  await act(async () => view.unmount());
});

test("iOS export waits until the action modal has finished dismissing", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  let view!: ReactTestRenderer;
  try {
    await act(async () => {
      view = create(React.createElement(Details));
    });
    await act(async () => button(view, "Дії нотатки").props.onPress());
    await act(async () => button(view, "Експорт").props.onPress());
    const dismissed = view.root.findByType("Modal" as React.ElementType).props
      .onDismiss;
    await act(async () => button(view, "PDF").props.onPress());
    expect(mockShare).not.toHaveBeenCalled();
    await act(async () => dismissed());
    expect(mockShare.mock.calls[0]).toEqual([mockNote, [], "pdf"]);
    await act(async () => view.unmount());
  } finally {
    jest.restoreAllMocks();
  }
});
