import { escapeHtml } from "../src/services/ExportService";
test("PDF escapes user content instead of executing markup", () => {
  expect(escapeHtml('<script>"рибка" & вода</script>')).toBe(
    "&lt;script&gt;&quot;рибка&quot; &amp; вода&lt;/script&gt;",
  );
});
