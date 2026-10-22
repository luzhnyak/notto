// Backport https://github.com/software-mansion/react-native-screens/pull/4498
// SDK 54 uses 4.16.0. A detached header must not query a removed stack fragment.
const fs = require("node:fs");
const path = require("node:path");
const root = path.dirname(require.resolve("react-native-screens/package.json"));
const version = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
).version;
if (version !== "4.16.0") {
  throw new Error(
    `Review the Notto Android header patch before using react-native-screens ${version}`,
  );
}
const file = path.join(
  root,
  "android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfig.kt",
);
const source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const before =
  "        val stack = screenStack\n        val isTop = stack == null || stack.topScreen == parent";
const after =
  "        val stack = screenStack ?: return\n        val isTop = stack.topScreen == parent";
if (source.includes(after)) {
  console.log("Notto: Android detached-header patch already applied");
} else if (source.includes(before)) {
  fs.writeFileSync(file, source.replace(before, after));
  console.log("Notto: applied Android detached-header patch");
} else {
  throw new Error(
    "react-native-screens header source changed; inspect the Notto Android patch",
  );
}
