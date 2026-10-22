import type { SQLiteDatabase } from "expo-sqlite";
import { nativeDatabase } from "../src/infrastructure/database/native";
function setup() {
  const events: string[] = [];
  const raw = {
    databasePath: "/data/notto.db",
    options: {},
    execAsync: async (sql: string) => {
      events.push(sql);
    },
    getFirstAsync: async () => ({ foreign_keys: 1 }),
    getAllAsync: async () => [],
    runAsync: async () => ({ changes: 1, lastInsertRowId: 1 }),
    closeAsync: async () => {
      throw new Error("unable to close due to unfinalized statements");
    },
  } as unknown as SQLiteDatabase;
  return { raw, events };
}
test("transactions reuse the live connection without opening or closing a connection", async () => {
  const { raw, events } = setup();
  await nativeDatabase(raw).transaction(async (tx) => {
    await tx.runAsync("INSERT");
  });
  expect(events).toContain("COMMIT");
});
test("outside queries wait until transaction finishes", async () => {
  const { raw, events } = setup();
  const db = nativeDatabase(raw);
  let resume!: () => void;
  const hold = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const transaction = db.transaction(async (tx) => {
    await hold;
    await tx.execAsync("INSIDE");
  });
  const outside = db.execAsync("OUTSIDE");
  await Promise.resolve();
  await Promise.resolve();
  resume();
  await Promise.all([transaction, outside]);
  expect(events.indexOf("OUTSIDE")).toBeGreaterThan(events.indexOf("COMMIT"));
});
test("multiple wrappers for the same connection share one queue", () => {
  const { raw } = setup();
  expect(nativeDatabase(raw)).toBe(nativeDatabase(raw));
});
