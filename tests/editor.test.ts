import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { useAppStore } from "../src/store/useAppStore";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "1" }),
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(callback, [callback]);
  },
}));
jest.mock("../src/services/context", () => ({
  useServices: () => ({
    notes: {
      get: async () => ({ id: 1, title: "Persisted title", status: "active" }),
    },
  }),
}));
jest.mock("../components/common/UI", () => ({
  Screen: ({ children }: { children: React.ReactNode }) =>
    React.createElement("screen", null, children),
  LoadState: () => React.createElement("loading"),
  EmptyState: () => React.createElement("empty"),
}));
jest.mock("../components/forms/NoteForm", () => ({
  NoteForm: ({ note }: { note: { title: string } }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const [value, setValue] = React.useState(note.title);
    return React.createElement("editor", { value, onChange: setValue });
  },
}));
import Edit from "../app/notes/[id]/edit";
test("catalog refresh does not unmount editor or discard unsaved text", async () => {
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(React.createElement(Edit));
  });
  const editor = () => view!.root.findByType("editor" as React.ElementType);
  await act(async () => {
    editor().props.onChange("Unsaved new title");
  });
  await act(async () => {
    useAppStore.getState().changed();
  });
  expect(editor().props.value).toBe("Unsaved new title");
  await act(async () => {
    view!.unmount();
  });
});
