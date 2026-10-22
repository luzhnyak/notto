export function cleanName(value: string): string {
  const name = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Назва не може бути порожньою");
  return name;
}
export function normalizeTag(value: string): string {
  return cleanName(value).toLocaleLowerCase("uk-UA");
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validateDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Дата має формат РРРР-ММ-ДД");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  if (year < 1 || localDate(date) !== value) throw new Error("Некоректна дата");
  return value;
}
export function noteDay(note: {
  eventDate: string | null;
  createdAt: string;
}): string {
  return note.eventDate ?? localDate(new Date(note.createdAt));
}
export function displayDate(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}
export function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не вдалося виконати дію. Спробуйте ще раз.";
}
