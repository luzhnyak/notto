import type { SQLiteDatabase } from "expo-sqlite";
import { ftsSchema, migrations } from "./schema";
export type SQLConnection = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync" | "execAsync"
>;
export interface Database extends SQLConnection {
  transaction(task: (tx: SQLConnection) => Promise<void>): Promise<void>;
}
export async function initialize(db: Database): Promise<boolean> {
  await db.execAsync("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const version = row?.user_version ?? 0;
  if (version > migrations.length)
    throw new Error("Базу створено новішою версією Notto. Оновіть застосунок.");
  for (let i = version; i < migrations.length; i++) {
    await db.transaction(async (tx) => {
      await tx.execAsync(migrations[i]);
      await tx.execAsync(`PRAGMA user_version=${i + 1}`);
    });
  }
  const hasFts = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE name='notes_fts'",
  );
  try {
    await db.transaction(async (tx) => {
      await tx.execAsync(ftsSchema);
      if (!hasFts)
        await tx.execAsync(
          "INSERT INTO notes_fts(notes_fts) VALUES('rebuild')",
        );
    });
    return true;
  } catch (error) {
    // Only missing FTS is optional; disk/schema/permission failures must remain visible.
    if (error instanceof Error && /no such module.*fts5/i.test(error.message))
      return false;
    throw error;
  }
}
