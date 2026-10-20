// SDK 54 legacy SAF rejects Downloads and other providers by authority despite
// a user-granted tree URI. Recognize Android tree URIs instead; the existing
// DocumentFile.canWrite() and ContentResolver checks still enforce permissions.
const fs = require("node:fs");
const path = require("node:path");
const before =
  'get() = scheme == "content" && host?.startsWith("com.android.externalstorage") ?: false';
const after =
  'get() = scheme == "content" && DocumentsContract.isTreeUri(this)';
function patchSource(source) {
  source = source.replace(/\r\n/g, "\n");
  if (source.includes(after)) return source;
  if (!source.includes(before))
    throw new Error(
      "expo-file-system SAF source changed; inspect the Notto Android patch",
    );
  return source.replace(before, after);
}
// CREATE_DOCUMENT has already created the destination. Some providers report
// missing/unknown metadata for a writable URI. Open its stream directly rather
// than trying File.create(), which explicitly rejects every content URI.
function patchModernSource(source) {
  source = source.replace(/\r\n/g, "\n");
  const before = "if (!exists) {\n      create()\n    }";
  const after = "if (!uri.isContentUri && !exists) {\n      create()\n    }";
  if (source.split(after).length - 1 === 3) return source;
  if (source.split(before).length - 1 !== 3)
    throw new Error(
      "expo-file-system write source changed; review Notto content URI patch",
    );
  return source.split(before).join(after);
}
if (require.main === module) {
  const root = path.dirname(require.resolve("expo-file-system/package.json"));
  const version = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ).version;
  if (version !== "19.0.24")
    throw new Error(
      `Review Notto SAF patch before using expo-file-system ${version}`,
    );
  const file = path.join(
    root,
    "android/src/main/java/expo/modules/filesystem/legacy/FileSystemLegacyModule.kt",
  );
  fs.writeFileSync(file, patchSource(fs.readFileSync(file, "utf8")));
  const modernFile = path.join(
    root,
    "android/src/main/java/expo/modules/filesystem/FileSystemFile.kt",
  );
  fs.writeFileSync(
    modernFile,
    patchModernSource(fs.readFileSync(modernFile, "utf8")),
  );
  console.log(
    "Notto: Android document-provider SAF and direct content URI write patches applied",
  );
}
module.exports = { patchSource, patchModernSource };
