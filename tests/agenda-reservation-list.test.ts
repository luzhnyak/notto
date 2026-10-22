import fs from "node:fs";
import path from "node:path";
import React from "react";
type XDate = { getTime(): number; toString(format?: string): string };
const XDate: new (date: string) => XDate = require("xdate");

type Entry = { name: string; day: string; height: number };
type Props = {
  items: Record<string, Entry[]>;
  selectedDay: XDate;
  topDay: XDate;
  showOnlySelectedDayItems?: boolean;
};
type Instance = {
  props: Props;
  state: { reservations: { reservation?: Entry; date?: XDate }[] };
  setState: (
    next: { reservations: { reservation?: Entry; date?: XDate }[] },
    callback?: () => void,
  ) => void;
  componentDidMount: () => void;
  componentDidUpdate: (previous: Props) => void;
};

// Exercise the installed library's actual lifecycle and reservation-building
// code. Stub only native rendering and styles, not updateReservations/setState.
function reservationList(): new (props: Props) => Instance {
  const root = path.dirname(
    require.resolve("react-native-calendars/package.json"),
  );
  const source = fs.readFileSync(
    path.join(root, "src/agenda/reservation-list/index.js"),
    "utf8",
  );
  const babel = require("@babel/core");
  const code = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    presets: [require.resolve("@babel/preset-react")],
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  }).code;
  const stubReservation = Object.assign(() => null, { propTypes: {} });
  const dependencies: Record<string, unknown> = {
    react: React,
    "react-native": {
      View: "View",
      FlatList: "FlatList",
      ActivityIndicator: "ActivityIndicator",
    },
    "lodash/isFunction": (v: unknown) => typeof v === "function",
    "prop-types": require("prop-types"),
    xdate: XDate,
    "../../componentUpdater": {
      extractReservationProps: (props: unknown) => props,
    },
    "../../dateutils": {
      sameDate: (a: XDate, b: XDate) => a?.getTime() === b?.getTime(),
    },
    "../../interface": {
      toMarkingFormat: (date: XDate) => date.toString("yyyy-MM-dd"),
    },
    "./style": () => ({}),
    "./reservation": stubReservation,
  };
  const module = { exports: {} as { default: new (props: Props) => Instance } };
  new Function("require", "module", "exports", code)(
    (name: string) => {
      if (!(name in dependencies))
        throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    module,
    module.exports,
  );
  return module.exports.default;
}
function fixture() {
  const props: Props = {
    items: {
      "2026-10-21": [{ name: "Нотатка", day: "2026-10-21", height: 120 }],
      "2026-10-22": [],
    },
    selectedDay: new XDate("2026-10-21"),
    topDay: new XDate("2026-10-21"),
  };
  const List = reservationList();
  const list = new List(props);
  let updates = 0;
  list.setState = (next, callback) => {
    if (++updates > 8) throw new Error("Maximum update depth exceeded");
    list.state = { ...list.state, ...next };
    // Reproduce Fabric/React 19 delivering a new props object with unchanged
    // field values after the component's own state update.
    list.componentDidUpdate({ ...list.props });
    callback?.();
  };
  return {
    list,
    get updates() {
      return updates;
    },
  };
}
test("mount settles after one state update even when React clones the props object", () => {
  const f = fixture();
  expect(() => f.list.componentDidMount()).not.toThrow();
  expect(f.updates).toBe(1);
  expect(f.list.state.reservations[0].reservation?.name).toBe("Нотатка");
});
test("changed note items refresh reservations once and then settle", () => {
  const f = fixture();
  const previous = f.list.props;
  f.list.props = {
    ...previous,
    items: {
      ...previous.items,
      "2026-10-21": [
        { name: "Змінена нотатка", day: "2026-10-21", height: 120 },
      ],
    },
  };
  expect(() => f.list.componentDidUpdate(previous)).not.toThrow();
  expect(f.updates).toBe(1);
  expect(f.list.state.reservations[0].reservation?.name).toBe(
    "Змінена нотатка",
  );
});
test("changing the selected/top day still clears and rebuilds the list without recursion", () => {
  const f = fixture();
  const previous = f.list.props;
  f.list.props = {
    ...previous,
    selectedDay: new XDate("2026-10-22"),
    topDay: new XDate("2026-10-22"),
  };
  expect(() => f.list.componentDidUpdate(previous)).not.toThrow();
  expect(f.updates).toBe(2);
  expect(f.list.state.reservations[0].date?.toString("yyyy-MM-dd")).toBe(
    "2026-10-22",
  );
});

test("removing the last note keeps the known empty day in the refreshed list", () => {
  const f = fixture();
  const previous = f.list.props;
  f.list.props = {
    ...previous,
    items: { ...previous.items, "2026-10-21": [] },
  };
  expect(() => f.list.componentDidUpdate(previous)).not.toThrow();
  expect(f.updates).toBe(1);
  expect(f.list.state.reservations[0].reservation).toBeUndefined();
  expect(f.list.state.reservations[0].date?.toString("yyyy-MM-dd")).toBe(
    "2026-10-21",
  );
});
test("changing selected-day-only mode still rebuilds reservations", () => {
  const f = fixture();
  const previous = f.list.props;
  f.list.props = { ...previous, showOnlySelectedDayItems: true };
  expect(() => f.list.componentDidUpdate(previous)).not.toThrow();
  expect(f.updates).toBe(1);
  expect(f.list.state.reservations).toHaveLength(1);
});
test("the install patch is idempotent and rejects unexpected upstream source", () => {
  const {
    patchSource,
  } = require("../scripts/patch-react-native-calendars.cjs");
  const original =
    "if (this.props.topDay && prevProps.topDay && prevProps !== this.props) {";
  const patched = patchSource(original);
  expect(patched).not.toContain("prevProps !== this.props");
  expect(patchSource(patched)).toBe(patched);
  expect(() => patchSource("unexpected code")).toThrow();
});
