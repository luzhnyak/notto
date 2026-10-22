import type { SQLConnection } from "./connection";
// Foreign-key PRAGMA must run BEFORE BEGIN on EACH connection.
export async function runTransaction(
  connection: SQLConnection,
  task: (tx: SQLConnection) => Promise<void>,
): Promise<void> {
  await connection.execAsync(
    "PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  const fk = await connection.getFirstAsync<{ foreign_keys: number }>(
    "PRAGMA foreign_keys",
  );
  if (fk?.foreign_keys !== 1)
    throw new Error("Не вдалося ввімкнути зовнішні ключі SQLite");
  await connection.execAsync("BEGIN IMMEDIATE");
  try {
    await task(connection);
    await connection.execAsync("COMMIT");
  } catch (e) {
    await connection.execAsync("ROLLBACK");
    throw e;
  }
}
