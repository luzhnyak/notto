import { readFileSync } from "node:fs";
const { patchSource } = require("../scripts/patch-expo-file-system.cjs") as {
  patchSource: (source: string) => string;
};
test("SAF patch removes provider authority restriction and is idempotent", () => {
  const original =
    'get() = scheme == "content" && host?.startsWith("com.android.externalstorage") ?: false';
  const patched = patchSource(original);
  expect(patched).toBe(
    'get() = scheme == "content" && DocumentsContract.isTreeUri(this)',
  );
  expect(patchSource(patched)).toBe(patched);
  expect(() => patchSource("changed native source")).toThrow("source changed");
});
test("installed Android SAF accepts granted tree URIs without a provider allowlist", () => {
  const root = require
    .resolve("expo-file-system/package.json")
    .replace(/package.json$/, "");
  const source = readFileSync(
    root +
      "android/src/main/java/expo/modules/filesystem/legacy/FileSystemLegacyModule.kt",
    "utf8",
  );
  expect(source).toContain(
    'get() = scheme == "content" && DocumentsContract.isTreeUri(this)',
  );
  expect(source).not.toContain(
    'host?.startsWith("com.android.externalstorage")',
  );
  // Permission checks remain in place before creating and writing documents.
  expect(source).toContain("ensurePermission(uri, Permission.WRITE)");
});
