// Serialize mutations and snapshots so a backup cannot race a file/database update.
export class OperationGate {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(action: () => Promise<T>): Promise<T> {
    const result = this.tail.then(action, action);
    this.tail = result.catch(() => undefined);
    return result;
  }
}
