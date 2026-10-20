import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
const mockOpen = jest.fn();
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (v: unknown) => v },
  Alert: { alert: jest.fn() },
  Keyboard: { dismiss: jest.fn() },
  Platform: { OS: "android" },
  useColorScheme: () => "light",
  Modal: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? React.createElement("Modal", null, children) : null),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  SafeAreaProvider: "SafeAreaProvider",
}));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: "NativeDatePicker",
  DateTimePickerAndroid: { open: (...args: unknown[]) => mockOpen(...args) },
}));
jest.mock("react-native-calendars", () => ({
  Calendar: "WixCalendar",
  LocaleConfig: { locales: {}, defaultLocale: "" },
}));
import { Platform } from "react-native";
import { LocaleConfig } from "react-native-calendars";
import { MonthCalendar } from "../components/calendar/MonthCalendar";
import { EventDatePicker } from "../components/forms/EventDatePicker";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function button(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((v) => v.props.accessibilityLabel === label)!;
}
async function press(view: ReactTestRenderer, label: string) {
  await act(async () => button(view, label).props.onPress());
}
async function picker(
  onChange = jest.fn(),
  value: string | null = "2020-02-29",
) {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(EventDatePicker, { value, onChange }));
  });
  return { view, onChange };
}
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
});
test("Wix calendar preserves note colors and selected day, with Ukrainian Monday-first weeks", async () => {
  const onSelect = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      React.createElement(MonthCalendar, {
        selected: "2020-02-29",
        onSelect,
        markers: { "2020-02-29": ["#ff0000", "#00ff00"] },
      }),
    );
  });
  const calendar = view.root.findByType("WixCalendar" as React.ElementType);
  expect(calendar.props.firstDay).toBe(1);
  expect(LocaleConfig.defaultLocale).toBe("uk");
  expect(calendar.props.markingType).toBe("multi-dot");
  expect(calendar.props.markedDates["2020-02-29"]).toMatchObject({
    selected: true,
    dots: [{ color: "#ff0000" }, { color: "#00ff00" }],
  });
  await act(async () =>
    calendar.props.onDayPress({ dateString: "2020-02-14" }),
  );
  expect(onSelect).toHaveBeenCalledWith("2020-02-14");
});
test("year navigation updates the Wix month without silently changing the selected note date", async () => {
  const onSelect = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      React.createElement(MonthCalendar, {
        selected: "2020-02-29",
        onSelect,
        markers: {},
      }),
    );
  });
  await press(view, "Наступний рік");
  expect(
    view.root.findByType("WixCalendar" as React.ElementType).props.initialDate,
  ).toBe("2021-02-01");
  expect(onSelect).not.toHaveBeenCalled();
  await press(view, "Вибрати рік");
  await press(view, "2018");
  expect(
    view.root.findByType("WixCalendar" as React.ElementType).props.initialDate,
  ).toBe("2018-02-01");
});
test("Android uses the native date dialog and cancel preserves the value", async () => {
  const { view, onChange } = await picker();
  await press(view, "Вибрати дату події");
  const options = mockOpen.mock.calls[0][0];
  expect(options.mode).toBe("date");
  expect(options.display).toBe("calendar");
  expect(options.value.getFullYear()).toBe(2020);
  expect(options.value.getMonth()).toBe(1);
  expect(options.value.getDate()).toBe(29);
  await act(async () =>
    options.onChange({ type: "dismissed" }, new Date(2020, 1, 20)),
  );
  expect(onChange).not.toHaveBeenCalled();
  await act(async () =>
    options.onChange({ type: "set" }, new Date(2020, 1, 20, 23, 30)),
  );
  expect(onChange).toHaveBeenCalledWith("2020-02-20");
});
test("clear is an accessible icon to the right of the field and clears without opening a dialog", async () => {
  const { view, onChange } = await picker();
  const clear = button(view, "Очистити дату");
  expect(clear).toBeDefined();
  const text = clear
    .findAllByType("Text" as React.ElementType)
    .map((v) => v.props.children);
  expect(text).not.toContain("Очистити дату");
  await press(view, "Очистити дату");
  expect(onChange).toHaveBeenCalledWith(null);
  expect(mockOpen).not.toHaveBeenCalled();
  expect(
    view.root.findAllByType("TextInput" as React.ElementType),
  ).toHaveLength(0);
});
test("iOS supports drafting, canceling and confirming a native date selection", async () => {
  Platform.OS = "ios";
  const { view, onChange } = await picker();
  await press(view, "Вибрати дату події");
  await act(async () =>
    view.root
      .findByType("NativeDatePicker" as React.ElementType)
      .props.onChange({ type: "set" }, new Date(2020, 1, 14)),
  );
  await press(view, "Скасувати");
  expect(onChange).not.toHaveBeenCalled();
  await press(view, "Вибрати дату події");
  await act(async () =>
    view.root
      .findByType("NativeDatePicker" as React.ElementType)
      .props.onChange({ type: "set" }, new Date(2020, 1, 20)),
  );
  await press(view, "Готово");
  expect(onChange).toHaveBeenLastCalledWith("2020-02-20");
  expect(mockOpen).not.toHaveBeenCalled();
});

const mockSearchNotes = jest.fn(async (_filter: unknown) => []);
jest.mock("../src/services/context", () => ({
  useServices: () => ({
    notes: { list: (filter: unknown) => mockSearchNotes(filter) },
    types: { list: async () => [] },
    emotions: { list: async () => [] },
    tags: { list: async () => [] },
  }),
}));
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void) => {
    const R = jest.requireActual<typeof import("react")>("react");
    R.useEffect(cb, [cb]);
  },
}));
jest.mock("../components/notes/NoteCard", () => ({ NoteCard: "NoteCard" }));
import Search from "../app/(tabs)/search";
test("search uses native dates for each date kind and clearing removes the date filter", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Search));
  });
  await press(view, "Вибрати дату пошуку");
  await act(async () =>
    mockOpen.mock.calls
      .at(-1)[0]
      .onChange({ type: "set" }, new Date(2026, 9, 20)),
  );
  expect(mockSearchNotes).toHaveBeenLastCalledWith(
    expect.objectContaining({ day: "2026-10-20" }),
  );
  await press(view, "Дата події");
  expect(mockSearchNotes).toHaveBeenLastCalledWith(
    expect.objectContaining({ eventDay: "2026-10-20" }),
  );
  await press(view, "Очистити дату пошуку");
  expect(mockSearchNotes).toHaveBeenLastCalledWith(
    expect.objectContaining({ eventDay: undefined }),
  );
  expect(
    view.root
      .findAllByType("TextInput" as React.ElementType)
      .some((v) => v.props.placeholder === "РРРР-ММ-ДД"),
  ).toBe(false);
});
