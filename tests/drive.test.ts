jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: () => {},
    hasPlayServices: async () => true,
    signIn: async () => ({ type: "success" }),
    addScopes: async () => ({ type: "success" }),
    signInSilently: async () => ({ type: "success" }),
    getTokens: async () => ({ accessToken: "test-only-token" }),
    signOut: async () => {},
  },
}));
import { GoogleDriveService } from "../src/services/GoogleDriveService";
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
});
test("missing OAuth config is explained without network calls", async () => {
  await expect(new GoogleDriveService().connect()).rejects.toThrow("OAuth");
});
test("Drive HTTP errors are surfaced", async () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-only";
  global.fetch = async () => new Response("{}", { status: 403 });
  await expect(new GoogleDriveService().latest()).rejects.toThrow("403");
});
test("empty appDataFolder returns no backup", async () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-only";
  global.fetch = async () => new Response('{"files":[]}', { status: 200 });
  expect(await new GoogleDriveService().latest()).toBeNull();
});
