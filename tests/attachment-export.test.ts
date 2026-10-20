const mockBytes = jest.fn(async () => new Uint8Array([0, 255]));
const mockWrite = jest.fn();
const mockPick = jest.fn(
  async (): Promise<{ resultCode: number; data?: string }> => ({
    resultCode: -1,
    data: "content://com.android.providers.downloads.documents/document/123",
  }),
);
const mockShare = jest.fn(async () => {});
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("expo-file-system", () => ({
  File: class {
    constructor(public uri: string) {}
    bytes() {
      return mockBytes();
    }
    write(bytes: Uint8Array) {
      mockWrite(this.uri, bytes);
    }
  },
}));
jest.mock("expo-intent-launcher", () => ({
  ResultCode: { Success: -1, Canceled: 0 },
  startActivityAsync: (...args: unknown[]) => mockPick(...(args as [])),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: async () => true,
  shareAsync: (...args: unknown[]) => mockShare(...(args as [])),
}));
import {
  saveAttachment,
  shareAttachment,
} from "../src/infrastructure/filesystem/AttachmentExport";
beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());
test("saves original binary bytes to the individual Downloads document selected with Save As", async () => {
  expect(
    await saveAttachment("file:///photo.png", "photo.png", "image/png"),
  ).toBe(true);
  expect(mockPick).toHaveBeenCalledWith(
    "android.intent.action.CREATE_DOCUMENT",
    {
      category: "android.intent.category.OPENABLE",
      type: "image/png",
      extra: { "android.intent.extra.TITLE": "photo.png" },
    },
  );
  expect(mockWrite).toHaveBeenCalledWith(
    "content://com.android.providers.downloads.documents/document/123",
    new Uint8Array([0, 255]),
  );
});
test("canceling Save As writes nothing", async () => {
  mockPick.mockResolvedValueOnce({ resultCode: 0 });
  expect(
    await saveAttachment("file:///photo.png", "photo.png", "image/png"),
  ).toBe(false);
  expect(mockWrite).not.toHaveBeenCalled();
});
test("does not report success without a returned document URI", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockPick.mockResolvedValueOnce({ resultCode: -1 });
  await expect(
    saveAttachment("file:///a.pdf", "a.pdf", "application/pdf"),
  ).rejects.toThrow("SAVE_CREATE_FILE");
  expect(mockWrite).not.toHaveBeenCalled();
});
test("reports write failures without claiming success", async () => {
  mockWrite.mockImplementationOnce(() => {
    throw new Error("provider write failed");
  });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(
      saveAttachment("file:///a.pdf", "a.pdf", "application/pdf"),
    ).rejects.toThrow(/SAVE_WRITE_FILE.*provider write failed/s);
  } finally {
    log.mockRestore();
  }
});
test("shares images with their MIME type", async () => {
  await shareAttachment("file:///photo.png", "image/png");
  expect(mockShare).toHaveBeenCalledWith("file:///photo.png", {
    mimeType: "image/png",
  });
});
