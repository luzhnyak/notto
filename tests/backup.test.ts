import { createHash } from "node:crypto";
import { strToU8, unzipSync, zipSync } from "fflate";
import { BackupPort, BackupService } from "../src/services/BackupService";
import { OperationGate } from "../src/services/OperationGate";
function setup() {
  let restored: Record<string, Uint8Array> | undefined;
  const port: BackupPort = {
    snapshot: async () => ({
      "notto.db": new Uint8Array([1, 2]),
      "attachments/a.jpg": new Uint8Array([3, 4]),
    }),
    hash: async (b) => createHash("sha256").update(b).digest("hex"),
    restore: async (f) => {
      restored = f;
    },
  };
  return {
    service: new BackupService(port, new OperationGate()),
    restored: () => restored,
  };
}
test("backup roundtrips DB and attachment bytes", async () => {
  const { service, restored } = setup();
  const bytes = await service.create();
  await service.restore(bytes);
  expect(restored()?.["attachments/a.jpg"]).toEqual(new Uint8Array([3, 4]));
});
test("corrupt package is rejected before restore", async () => {
  const { service, restored } = setup();
  const files = unzipSync(await service.create());
  files["notto.db"] = new Uint8Array([9]);
  await expect(service.restore(zipSync(files))).rejects.toThrow("пошкоджено");
  expect(restored()).toBeUndefined();
});
test("unknown format, missing file and path traversal are rejected", async () => {
  const { service, restored } = setup();
  await expect(
    service.restore(
      zipSync({
        "manifest.json": strToU8("{}"),
        "notto.db": new Uint8Array([1]),
      }),
    ),
  ).rejects.toThrow();
  await expect(
    service.restore(zipSync({ "../outside": strToU8("x") })),
  ).rejects.toThrow();
  expect(restored()).toBeUndefined();
});

test("creation includes manifest and archive overhead in its size limit", async () => {
  const port: BackupPort = {
    snapshot: async () => ({ "notto.db": new Uint8Array([1]) }),
    hash: async (b) => createHash("sha256").update(b).digest("hex"),
    restore: async () => {},
  };
  const service = new BackupService(port, new OperationGate(), 100);
  await expect(service.create()).rejects.toThrow("ліміт");
});
