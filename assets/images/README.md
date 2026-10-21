# Notto brand assets

Generated with the built-in imagegen tool for Notto. The notebook and folded N
use the app's violet palette (#5D5AE8 / #ABA7FF). PNG exports are resized and
padded for their target platforms; keep the foreground transparent.

- `brand-source.png`: transparent source artwork.
- `icon.png`: 1024 × 1024 opaque icon for iOS and legacy Android launchers.
- `android-icon-foreground.png`: 1024 × 1024 transparent adaptive foreground;
  padded to keep the notebook within the central safe region.
- `android-icon-monochrome.png`: transparent white N for Android themed icons,
  rasterized from the simple source `android-icon-monochrome.svg`.
- `splash-icon.png`: 512 × 512 transparent splash mark, shared by light/dark mode.
- `favicon.png`: 64 × 64 web favicon.

`app.json` defines the adaptive background and the splash background for each
system theme. Expo generates the platform-specific launcher sizes during prebuild.
The splash follows the device theme before the app's saved preference is loaded.

Generation prompts: a clean violet notebook with a white folded N and small
bookmark on transparency; the same notebook on an opaque #F6F5F1 icon background;
No wordmark. The final monochrome N is a deterministic SVG mask so its
transparent edges remain clean at every launcher size.

After updating, run `npm ci`, `npx expo prebuild --platform android`, then
`npm run android` or build a release APK. Do not use `--clean` if the native
project contains manual changes you want to retain. EAS generates native projects
from this configuration when the native folders are not included in the upload.
Check the final splash in a preview/release build, since development builds may
show Expo's development launcher instead.
