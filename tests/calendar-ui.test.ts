import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  Modal: "Modal",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (value: unknown) => value },
  Alert: { alert: jest.fn() },
  Keyboard: { dismiss: jest.fn() },
  useColorScheme: () => "light",
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  SafeAreaProvider: "SafeAreaProvider",
}));
import { MonthCalendar } from "../components/calendar/MonthCalendar";
import { EventDatePicker } from "../components/forms/EventDatePicker";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
function button(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((node) => node.props.accessibilityLabel === label)!;
}
test("calendar opens at selected date and supports leap years and direct year selection", async () => {
  let view!: ReactTestRenderer;
  const onSelect = jest.fn();
  await act(async () => {
    view = create(
      React.createElement(MonthCalendar, {
        selected: "2020-02-29",
        onSelect,
        markers: {},
      }),
    );
  });
  expect(button(view, "2020-02-29")).toBeDefined();
  await act(async () => {
    button(view, "Наступний рік").props.onPress();
  });
  expect(button(view, "2021-02-28")).toBeDefined();
  expect(button(view, "2021-02-29")).toBeUndefined();
  await act(async () => {
    button(view, "Вибрати рік").props.onPress();
  });
  await act(async () => {
    button(view, "2018").props.onPress();
  });
  await act(async () => {
    button(view, "2018-02-14").props.onPress();
  });
  expect(onSelect).toHaveBeenCalledWith("2018-02-14");
  await act(async () => view.unmount());
});
test("event date is chosen without text input, cancel preserves value, confirm and clear update it", async () => {
  let view!: ReactTestRenderer;
  const onChange = jest.fn();
  await act(async () => {
    view = create(
      React.createElement(EventDatePicker, { value: "2020-02-29", onChange }),
    );
  });
  expect(
    view.root.findAllByType("TextInput" as React.ElementType),
  ).toHaveLength(0);
  await act(async () => {
    button(view, "Вибрати дату події").props.onPress();
  });
  await act(async () => {
    button(view, "2020-02-14").props.onPress();
  });
  await act(async () => {
    button(view, "Скасувати").props.onPress();
  });
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => {
    button(view, "Вибрати дату події").props.onPress();
  });
  await act(async () => {
    button(view, "2020-02-20").props.onPress();
  });
  await act(async () => {
    button(view, "Готово").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith("2020-02-20");
  await act(async () => {
    button(view, "Очистити дату").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith(null);
  await act(async () => view.unmount());
});
