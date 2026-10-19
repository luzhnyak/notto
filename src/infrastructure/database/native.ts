import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import type { Database } from "./connection";
import { runTransaction } from "./transactions";
export function nativeDatabase(db: SQLiteDatabase): Database {
  return {
    getAllAsync: db.getAllAsync.bind(db),
    getFirstAsync: db.getFirstAsync.bind(db),
    runAsync: db.runAsync.bind(db),
    execAsync: db.execAsync.bind(db),
    async transaction(task) {
      const slash = db.databasePath.lastIndexOf("/");
      const name = db.databasePath.slice(slash + 1);
      const directory = db.databasePath.slice(0, slash);
      const connection = await openDatabaseAsync(
        name,
        { ...db.options, useNewConnection: true },
        directory,
      );
      try {
        await runTransaction(connection, task);
      } finally {
        await connection.closeAsync();
      }
    },
  };
}
