import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Note } from "../src/domain/entities";
let mockNotes: Note[];
let mockLoading = false;
let mockError = "";
const mockReload = jest.fn();
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (v: unknown) => v },
  useColorScheme: () => "light",
}));
jest.mock("react-native-calendars", () => ({
  Agenda: "WixAgenda",
  Calendar: "WixCalendar",
  LocaleConfig: { locales: {}, defaultLocale: "" },
}));
jest.mock("../src/services/context", () => ({ useServices: () => ({}) }));
jest.mock("../src/hooks/useLoad", () => ({
  useLoad: () => ({
    data: mockNotes,
    loading: mockLoading,
    error: mockError,
    reload: mockReload,
  }),
}));
jest.mock("../components/notes/NoteCard", () => ({
  NoteCard: (props: unknown) =>
    React.createElement("NoteCard", props as object),
}));
import Calendar from "../app/(tabs)/calendar";
import { useAppStore } from "../src/store/useAppStore";
import { palettes } from "../src/theme";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function note(
  id: number,
  eventDate: string | null,
  createdAt = "2024-02-28T12:00:00Z",
): Note {
  return {
    id,
    title: `Запис ${id}`,
    content: "Текст",
    eventDate,
    createdAt,
    updatedAt: createdAt,
    noteTypeId: 1,
    emotionId: null,
    status: "active",
    isFavorite: false,
    isPinned: false,
    deletedAt: null,
    tags: [],
    emotion: null,
    type: {
      id: 1,
      name: "Подія",
      color: "#ff0000",
      icon: "bookmark",
      sortOrder: 0,
    },
  };
}
async function mount() {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Calendar));
  });
  return view;
}
function agenda(view: ReactTestRenderer) {
  return view.root.findByType("WixAgenda" as React.ElementType);
}
function button(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((v) => v.props.accessibilityLabel === label)!;
}
async function select(view: ReactTestRenderer, dateString: string) {
  await act(async () => agenda(view).props.onDayPress({ dateString }));
}
beforeEach(() => {
  jest.clearAllMocks();
  mockLoading = false;
  mockError = "";
  mockNotes = [note(1, "2024-02-29"), note(2, "2024-02-29"), note(3, null)];
});
test("Agenda owns scrolling and groups all notes by event date or local creation date", async () => {
  const view = await mount();
  await select(view, "2024-02-29");
  const props = agenda(view).props;
  expect(
    view.root.findAllByType("ScrollView" as React.ElementType),
  ).toHaveLength(0);
  expect(
    props.items["2024-02-29"].map((v: { note: Note }) => v.note.id),
  ).toEqual([1, 2]);
  expect(props.items["2024-02-28"][0].note.id).toBe(3);
  expect(props.items["2024-03-01"]).toEqual([]);
  // Android must retain months while Agenda translates its clipped header.
  expect(props.removeClippedSubviews).toBe(false);
  // Agenda forwards style to its inner CalendarList, whose native wrapper has
  // no flex. Forwarding flex: 1 collapses that list to zero height.
  expect(props.style).toBeUndefined();
  expect(props.firstDay).toBe(1);
  expect(props.markingType).toBe("multi-dot");
  expect(props.markedDates["2024-02-29"].dots).toHaveLength(1);
  let card!: ReactTestRenderer;
  await act(async () => {
    card = create(props.renderItem(props.items["2024-02-29"][1]));
  });
  expect(
    card.root.findByType("NoteCard" as React.ElementType).props.note.id,
  ).toBe(2);
});
test("scrolling the agenda updates the selected day and year jumps clamp leap days", async () => {
  const view = await mount();
  await select(view, "2024-02-29");
  await act(async () => button(view, "Наступний рік").props.onPress());
  expect(agenda(view).props.selected).toBe("2025-02-28");
  await act(async () =>
    agenda(view).props.onDayChange({ dateString: "2025-03-03" }),
  );
  expect(agenda(view).props.selected).toBe("2025-03-03");
  await act(async () => button(view, "Вибрати рік").props.onPress());
  await act(async () => button(view, "2018").props.onPress());
  expect(agenda(view).props.selected).toBe("2018-03-03");
  expect(agenda(view).props.items["2018-03-03"]).toEqual([]);
});
test("an empty day is loaded as an empty list and removed notes disappear after reload", async () => {
  const view = await mount();
  await select(view, "2024-02-29");
  mockNotes = [];
  await act(async () => view.update(React.createElement(Calendar)));
  expect(agenda(view).props.items["2024-02-29"]).toEqual([]);
  expect(agenda(view).props.markedDates["2024-02-29"]).toBeUndefined();
  const empty = agenda(view).props.renderEmptyDate();
  expect(empty).toBeTruthy();
});
test("visible months are remembered so scrolling does not turn known empty dates into unloaded dates", async () => {
  const view = await mount();
  await act(async () =>
    agenda(view).props.loadItemsForMonth({ dateString: "2020-02-01" }),
  );
  await select(view, "2026-10-21");
  expect(agenda(view).props.items["2020-02-29"]).toEqual([]);
});
test("loading and errors use the existing status UI instead of an empty Agenda spinner", async () => {
  mockLoading = true;
  const view = await mount();
  expect(
    view.root.findAllByType("WixAgenda" as React.ElementType),
  ).toHaveLength(0);
  mockLoading = false;
  mockError = "Не вдалося завантажити";
  await act(async () => view.update(React.createElement(Calendar)));
  expect(
    view.root.findAllByType("WixAgenda" as React.ElementType),
  ).toHaveLength(0);
  await act(async () => button(view, "Спробувати ще").props.onPress());
  expect(mockReload).toHaveBeenCalled();
});

test("day scrolling retains render callbacks, theme and note row identity", async () => {
  const view = await mount();
  await select(view, "2024-02-28");
  const before = agenda(view).props;
  await select(view, "2024-02-29");
  const after = agenda(view).props;
  for (const key of [
    "theme",
    "renderItem",
    "renderEmptyDate",
    "renderEmptyData",
    "rowHasChanged",
    "onDayPress",
    "onDayChange",
  ]) {
    expect(after[key]).toBe(before[key]);
  }
  expect(after.items).toBe(before.items);
  const entry = after.items["2024-02-29"][0];
  await act(async () =>
    agenda(view).props.loadItemsForMonth({ dateString: "2024-05-01" }),
  );
  const rebuilt = agenda(view).props;
  expect(rebuilt.rowHasChanged(entry, rebuilt.items["2024-02-29"][0])).toBe(
    false,
  );
  expect(
    rebuilt.rowHasChanged(entry, {
      ...entry,
      note: { ...entry.note, title: "Оновлено" },
    }),
  ).toBe(true);
});

test("switching themes updates the reservations background as well as calendar and day colors", async () => {
  const view = await mount();
  try {
    for (const mode of ["dark", "light"] as const) {
      await act(async () => useAppStore.getState().setTheme(mode));
      const theme = agenda(view).props.theme;
      expect(theme.calendarBackground).toBe(palettes[mode].background);
      expect(theme.reservationsBackgroundColor).toBe(palettes[mode].background);
      expect(theme.agendaDayNumColor).toBe(palettes[mode].text);
      expect(theme.agendaDayTextColor).toBe(palettes[mode].muted);
    }
  } finally {
    await act(async () => {
      view.unmount();
      useAppStore.getState().setTheme("system");
    });
  }
});
