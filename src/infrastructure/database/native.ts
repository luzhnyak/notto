import type { SQLiteDatabase } from "expo-sqlite";
import type { Database, SQLConnection } from "./connection";
import { runTransaction } from "./transactions";

const connections = new WeakMap<SQLiteDatabase, Database>();

export function nativeDatabase(db: SQLiteDatabase): Database {
  const existing = connections.get(db);
  if (existing) return existing;

  // Keep the native connection alive. Closing a connection after an FTS write
  // can fail in SDK 54 even when all application statements were finalized.
  // Queue reads as well as writes so outside work cannot enter a transaction.
  let tail: Promise<unknown> = Promise.resolve();
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  }
  function queued<T extends (...args: never[]) => Promise<unknown>>(
    method: T,
  ): T {
    return ((...args: Parameters<T>) => enqueue(() => method(...args))) as T;
  }
  const connection: Database = {
    getAllAsync: queued(db.getAllAsync.bind(db)),
    getFirstAsync: queued(db.getFirstAsync.bind(db)),
    runAsync: queued(db.runAsync.bind(db)),
    execAsync: queued(db.execAsync.bind(db)),
    transaction(task: (tx: SQLConnection) => Promise<void>) {
      // The callback uses the raw connection while it owns the queue slot.
      return enqueue(() => runTransaction(db, task));
    },
  };
  connections.set(db, connection);
  return connection;
}
