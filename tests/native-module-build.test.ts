import { execFileSync } from "node:child_process";
import path from "node:path";
test("Expo Android autolinking forces the patched modules to compile from source", () => {
  const cli = path.join(
    path.dirname(require.resolve("expo-modules-autolinking/package.json")),
    "bin/expo-modules-autolinking",
  );
  const resolved = JSON.parse(
    execFileSync(
      process.execPath,
      [cli, "resolve", "--platform", "android", "--json"],
      { encoding: "utf8" },
    ),
  );
  const forced = resolved.configuration?.buildFromSource ?? [];
  for (const name of ["expo-file-system", "expo-intent-launcher"]) {
    expect(
      forced.some((pattern: string) =>
        new RegExp(`^(?:${pattern})$`).test(name),
      ),
    ).toBe(true);
  }
}, 30000);
