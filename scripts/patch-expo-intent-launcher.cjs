// SDK 54 returns Intent.toString() instead of the activity result's data URI.
// CREATE_DOCUMENT needs the actual URI to write the user-selected document.
const fs = require("node:fs");
const path = require("node:path");
const before = "payload.data?.let { putString(ATTR_DATA, it.toString()) }";
const after = "payload.data?.data?.let { putString(ATTR_DATA, it.toString()) }";
function patchSource(source) {
  source = source.replace(/\r\n/g, "\n");
  if (source.includes(after)) return source;
  if (!source.includes(before))
    throw new Error(
      "expo-intent-launcher result source changed; review the Notto URI patch",
    );
  return source.replace(before, after);
}
if (require.main === module) {
  const root = path.dirname(
    require.resolve("expo-intent-launcher/package.json"),
  );
  const version = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ).version;
  if (version !== "13.0.8")
    throw new Error(
      `Review Notto intent URI patch before using expo-intent-launcher ${version}`,
    );
  const file = path.join(
    root,
    "android/src/main/java/expo/modules/intentlauncher/IntentLauncherModule.kt",
  );
  fs.writeFileSync(file, patchSource(fs.readFileSync(file, "utf8")));
  console.log("Notto: Android activity result URI patch applied");
}
module.exports = { patchSource };
