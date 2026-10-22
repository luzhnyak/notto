import { createHash } from "node:crypto";
import type { SQLiteDatabase } from "expo-sqlite";
import { NativeAttachmentFiles } from "../src/infrastructure/filesystem/AttachmentFiles";

jest.mock("expo-sqlite", () => ({}));
jest.mock("expo-file-system", () => ({}));
jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  // Android's CryptoModule.digest accepts TypedArray, not ArrayBuffer.
  digest: async (_algorithm: string, data: Uint8Array) => {
    if (!(data instanceof Uint8Array))
      throw new TypeError(
        "Cannot convert '[object ArrayBuffer]' to kotlin type",
      );
    const result = createHash("sha256").update(data).digest();
    return Uint8Array.from(result).buffer;
  },
}));
import { NativeBackupPort } from "../src/infrastructure/filesystem/NativeBackupPort";

const port = new NativeBackupPort(
  {} as SQLiteDatabase,
  {} as NativeAttachmentFiles,
);

test.each([
  ["empty", new Uint8Array()],
  ["binary", new Uint8Array([0, 128, 255, 1])],
  ["subarray", new Uint8Array([99, 0, 128, 255, 1, 88]).subarray(1, 5)],
])(
  "native backup hashes %s bytes using Android-compatible input",
  async (_, bytes) => {
    await expect(port.hash(bytes)).resolves.toBe(
      createHash("sha256").update(bytes).digest("hex"),
    );
  },
);
