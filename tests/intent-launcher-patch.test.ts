import fs from "node:fs";
import path from "node:path";
const { patchSource } = require("../scripts/patch-expo-intent-launcher.cjs");
test("returns the result document URI instead of Intent.toString()", () => {
  const before = "payload.data?.let { putString(ATTR_DATA, it.toString()) }";
  const after =
    "payload.data?.data?.let { putString(ATTR_DATA, it.toString()) }";
  expect(patchSource(before)).toBe(after);
  expect(patchSource(after)).toBe(after);
  expect(() => patchSource("unexpected upstream code")).toThrow();
});
test("installed native source returns a document URI", () => {
  const root = path.dirname(
    require.resolve("expo-intent-launcher/package.json"),
  );
  const source = fs.readFileSync(
    path.join(
      root,
      "android/src/main/java/expo/modules/intentlauncher/IntentLauncherModule.kt",
    ),
    "utf8",
  );
  expect(source).toContain(
    "payload.data?.data?.let { putString(ATTR_DATA, it.toString()) }",
  );
  expect(source).not.toContain(
    "payload.data?.let { putString(ATTR_DATA, it.toString()) }",
  );
});
