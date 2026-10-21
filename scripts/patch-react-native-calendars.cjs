// Agenda's ReservationList compares props object identity before setState.
// React 19/Fabric can replace that object during the component's own update,
// causing componentDidUpdate -> setState recursion with unchanged prop values.
const fs = require("node:fs");
const path = require("node:path");
const before = "prevProps !== this.props";
const after =
  "Object.keys({ ...prevProps, ...this.props }).some(key => !Object.is(prevProps[key], this.props[key]))";
function patchSource(source) {
  source = source.replace(/\r\n/g, "\n");
  if (source.includes(after)) return source;
  if (!source.includes(before))
    throw new Error(
      "react-native-calendars ReservationList changed; review Notto Agenda patch",
    );
  return source.replace(before, after);
}
if (require.main === module) {
  const root = path.dirname(
    require.resolve("react-native-calendars/package.json"),
  );
  const version = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ).version;
  if (version !== "1.1314.0")
    throw new Error(
      `Review Notto Agenda patch before using react-native-calendars ${version}`,
    );
  const file = path.join(root, "src/agenda/reservation-list/index.js");
  fs.writeFileSync(file, patchSource(fs.readFileSync(file, "utf8")));
  console.log("Notto: Agenda ReservationList update-loop patch applied");
}
module.exports = { patchSource };
