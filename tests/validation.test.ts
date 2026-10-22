import {
  normalizeTag,
  validateDate,
  localDate,
  noteDay,
} from "../src/utils/values";
describe("local dates and Unicode tags", () => {
  test("normalizes case, Unicode and spaces", () => {
    expect(normalizeTag("  МОЇ   Ідеї  ")).toBe("мої ідеї");
    expect(normalizeTag("І\u0308жа")).toBe(normalizeTag("Їжа"));
  });
  test("validates leap dates without UTC conversion", () => {
    expect(validateDate("2024-02-29")).toBe("2024-02-29");
    expect(() => validateDate("2025-02-29")).toThrow();
    expect(() => validateDate("2026-13-01")).toThrow();
    expect(() => validateDate("2026-2-1")).toThrow();
  });
  test("uses calendar components of local date", () => {
    expect(localDate(new Date(2026, 9, 19, 23, 59))).toBe("2026-10-19");
    expect(
      noteDay({ eventDate: "2020-01-01", createdAt: "2026-10-19T00:00:00Z" }),
    ).toBe("2020-01-01");
  });
});
