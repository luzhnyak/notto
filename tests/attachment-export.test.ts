const mockRead = jest.fn(async () => "AP8=");
const mockWrite = jest.fn(async () => {});
const mockPermission = jest.fn(async () => ({
  granted: true,
  directoryUri: "content://folder",
}));
const mockCreate = jest.fn(async () => "content://folder/photo.png");
const mockShare = jest.fn(async () => {});
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("expo-file-system/legacy", () => ({
  EncodingType: { Base64: "base64" },
  readAsStringAsync: (...args: unknown[]) => mockRead(...(args as [])),
  writeAsStringAsync: (...args: unknown[]) => mockWrite(...(args as [])),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: () => mockPermission(),
    createFileAsync: (...args: unknown[]) => mockCreate(...(args as [])),
  },
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
test("saves binary image to selected Android folder", async () => {
  expect(
    await saveAttachment("file:///photo.png", "photo.png", "image/png"),
  ).toBe(true);
  expect(mockCreate).toHaveBeenCalledWith(
    "content://folder",
    "photo.png",
    "image/png",
  );
  expect(mockWrite).toHaveBeenCalledWith("content://folder/photo.png", "AP8=", {
    encoding: "base64",
  });
});
test("canceling directory selection writes nothing", async () => {
  mockPermission.mockResolvedValueOnce({ granted: false, directoryUri: "" });
  expect(
    await saveAttachment("file:///photo.png", "photo.png", "image/png"),
  ).toBe(false);
  expect(mockRead).not.toHaveBeenCalled();
  expect(mockCreate).not.toHaveBeenCalled();
});
test("shares images with their MIME type", async () => {
  await shareAttachment("file:///photo.png", "image/png");
  expect(mockShare).toHaveBeenCalledWith("file:///photo.png", {
    mimeType: "image/png",
  });
});

test("reports file creation stage when Android rejects the selected location", async () => {
  mockCreate.mockRejectedValueOnce(new Error("Location isn't writable"));
  const logged = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(
      saveAttachment("file:///photo.png", "photo.png", "image/png"),
    ).rejects.toThrow("SAVE_CREATE_FILE");
    expect(mockWrite).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalled();
  } finally {
    logged.mockRestore();
  }
});

test("reports write stage and preserves the original native error", async () => {
  mockWrite.mockRejectedValueOnce(new Error("Location isn't writable"));
  const logged = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(
      saveAttachment("file:///photo.png", "photo.png", "image/png"),
    ).rejects.toThrow(/SAVE_WRITE_FILE.*Location isn't writable/s);
  } finally {
    logged.mockRestore();
  }
});
