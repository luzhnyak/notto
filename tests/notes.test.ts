import { NoteService } from "../src/services/NoteService";
import { NoteRepository } from "../src/domain/repositories";
import { NoteInput } from "../src/domain/entities";
const input: NoteInput = {
  title: "  День на річці  ",
  content: "",
  noteTypeId: 1,
  emotionId: null,
  eventDate: "2024-02-29",
  tagIds: [],
};
function setup() {
  let saved: NoteInput | undefined;
  const repo: NoteRepository = {
    list: async () => [],
    get: async () => null,
    save: async (v) => {
      saved = v;
      return 9;
    },
    setStatus: async () => {},
    toggle: async () => {},
    permanentDelete: async () => {},
  };
  return {
    service: new NoteService(repo, () => new Date("2026-10-19T10:00:00Z")),
    saved: () => saved,
  };
}
test("save trims title and allows empty content", async () => {
  const { service, saved } = setup();
  expect(await service.save(input)).toBe(9);
  expect(saved()?.title).toBe("День на річці");
});
test("blank title is rejected before persistence", async () => {
  const { service, saved } = setup();
  await expect(service.save({ ...input, title: " " })).rejects.toThrow();
  expect(saved()).toBeUndefined();
});
test("invalid event date is rejected", async () => {
  await expect(
    setup().service.save({ ...input, eventDate: "2025-02-29" }),
  ).rejects.toThrow();
});
test("invalid type is rejected", async () => {
  await expect(
    setup().service.save({ ...input, noteTypeId: 0 }),
  ).rejects.toThrow();
});
test("duplicate tags are collapsed", async () => {
  const { service, saved } = setup();
  await service.save({ ...input, tagIds: [2, 2, 3] });
  expect(saved()?.tagIds).toEqual([2, 3]);
});
