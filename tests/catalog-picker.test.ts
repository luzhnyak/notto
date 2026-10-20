import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
jest.mock("react-native", () => ({
  View: "View",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "android" },
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (value: unknown) => value },
  Alert: { alert: jest.fn() },
  Keyboard: { dismiss: jest.fn() },
  useColorScheme: () => "light",
  Modal: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? React.createElement("Modal", null, children) : null),
  FlatList: ({
    data,
    renderItem,
  }: {
    data: { id: number; label: string }[];
    renderItem: (value: {
      item: { id: number; label: string };
    }) => React.ReactNode;
  }) =>
    React.createElement(
      "FlatList",
      null,
      ...data.map((item) =>
        React.createElement(
          React.Fragment,
          { key: item.id },
          renderItem({ item }),
        ),
      ),
    ),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  SafeAreaProvider: "SafeAreaProvider",
}));
import { SelectField, TagPicker } from "../components/forms/CatalogPicker";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const options = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  label: `Тег ${i + 1}`,
}));
function pressable(view: ReactTestRenderer, label: string) {
  return view.root
    .findAllByType("Pressable" as React.ElementType)
    .find((v) => v.props.accessibilityLabel === label)!;
}
test("single selector searches, selects one item, closes and can clear optional value", async () => {
  let view!: ReactTestRenderer;
  const onChange = jest.fn();
  await act(async () => {
    view = create(
      React.createElement(SelectField, {
        label: "Тип",
        value: 1,
        onChange,
        placeholder: "Усі",
        clearLabel: "Усі",
        options: [
          { id: 1, label: "Особисте" },
          { id: 2, label: "Робота" },
        ],
      }),
    );
  });
  expect(pressable(view, "Робота")).toBeUndefined();
  await act(async () => {
    pressable(view, "Тип").props.onPress();
  });
  await act(async () => {
    view.root
      .findByType("TextInput" as React.ElementType)
      .props.onChangeText("РОБО");
  });
  expect(pressable(view, "Особисте")).toBeUndefined();
  await act(async () => {
    pressable(view, "Робота").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith(2);
  expect(pressable(view, "Робота")).toBeUndefined();
  await act(async () => {
    pressable(view, "Тип").props.onPress();
  });
  await act(async () => {
    pressable(view, "Усі").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith(null);
  await act(async () => view.unmount());
});
test("twenty selected tags take one field when collapsed", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      React.createElement(TagPicker, {
        options,
        value: options.map((v) => v.id),
        onChange: jest.fn(),
      }),
    );
  });
  expect(
    view.root.findAllByType("Pressable" as React.ElementType),
  ).toHaveLength(1);
  expect(JSON.stringify(view.toJSON())).toContain("ще 18");
  await act(async () => view.unmount());
});
test("multiple tags stay draft until confirm; cancel preserves existing selection", async () => {
  let view!: ReactTestRenderer;
  const onChange = jest.fn();
  await act(async () => {
    view = create(
      React.createElement(TagPicker, { options, value: [1], onChange }),
    );
  });
  await act(async () => {
    pressable(view, "Теги").props.onPress();
  });
  await act(async () => {
    pressable(view, "Тег 2").props.onPress();
  });
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => {
    pressable(view, "Скасувати").props.onPress();
  });
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => {
    pressable(view, "Теги").props.onPress();
  });
  expect(pressable(view, "Тег 2").props.accessibilityState.checked).toBe(false);
  await act(async () => {
    pressable(view, "Тег 2").props.onPress();
  });
  await act(async () => {
    pressable(view, "Готово").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  await act(async () => {
    pressable(view, "Теги").props.onPress();
  });
  await act(async () => {
    pressable(view, "Зняти всі").props.onPress();
  });
  await act(async () => {
    pressable(view, "Готово").props.onPress();
  });
  expect(onChange).toHaveBeenLastCalledWith([]);
  await act(async () => view.unmount());
});
