import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Notto",
  slug: "notto",
  ios: {
    ...config.ios,
    ...(process.env.NOTTO_IOS_BUNDLE_ID
      ? { bundleIdentifier: process.env.NOTTO_IOS_BUNDLE_ID }
      : {}),
  },
  android: {
    ...config.android,
    ...(process.env.NOTTO_ANDROID_PACKAGE
      ? { package: process.env.NOTTO_ANDROID_PACKAGE }
      : {}),
  },
  plugins: [
    ...(config.plugins ?? []),
    ...(process.env.NOTTO_GOOGLE_IOS_URL_SCHEME
      ? ([
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: process.env.NOTTO_GOOGLE_IOS_URL_SCHEME },
          ],
        ] as [string, Record<string, string>][])
      : []),
  ],
});
