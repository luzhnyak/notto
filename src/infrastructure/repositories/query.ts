import { NoteFilter } from "../../domain/entities";
export function buildQuery(
  filter: NoteFilter,
  fts: boolean,
): { sql: string; params: (string | number)[] } {
  const where = ["n.status=?"];
  const params: (string | number)[] = [filter.status ?? "active"];
  for (const [key, column] of [
    ["noteTypeId", "note_type_id"],
    ["emotionId", "emotion_id"],
  ] as const)
    if (filter[key] !== undefined) {
      where.push(`n.${column}=?`);
      params.push(filter[key]);
    }
  if (filter.favorite) where.push("n.is_favorite=1");
  if (filter.pinned) where.push("n.is_pinned=1");
  for (const id of [...new Set(filter.tagIds ?? [])]) {
    where.push(
      "EXISTS(SELECT 1 FROM note_tags nt WHERE nt.note_id=n.id AND nt.tag_id=?)",
    );
    params.push(id);
  }
  const day = "COALESCE(n.event_date, date(n.created_at,'localtime'))";
  for (const [value, column] of [
    [filter.day, day],
    [filter.createdDay, "date(n.created_at,'localtime')"],
    [filter.eventDay, "n.event_date"],
  ] as const)
    if (value) {
      where.push(`${column}=?`);
      params.push(value);
    }
  const terms = filter.query?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (terms.length && fts) {
    where.push("n.id IN (SELECT rowid FROM notes_fts WHERE notes_fts MATCH ?)");
    params.push(
      terms.map((t) => '"' + t.replace(/"/g, '""') + '"*').join(" AND "),
    );
  } else
    for (const term of terms) {
      where.push(
        "(n.search_title LIKE ? ESCAPE '\\' OR n.search_content LIKE ? ESCAPE '\\')",
      );
      const pattern =
        "%" +
        term
          .normalize("NFC")
          .toLocaleLowerCase("uk-UA")
          .replace(/[\\%_]/g, "\\$&") +
        "%";
      params.push(pattern, pattern);
    }
  const order = filter.chronological
    ? `${day} DESC,n.created_at DESC,n.id DESC`
    : `n.is_pinned DESC,${filter.sort === "title" ? "n.title COLLATE NOCASE ASC" : filter.sort === "updated" ? "n.updated_at DESC" : `${day} DESC,n.created_at DESC`},n.id DESC`;
  params.push(
    Math.max(1, Math.min(filter.limit ?? 100, 500)),
    Math.max(0, filter.offset ?? 0),
  );
  return {
    sql: `SELECT n.* FROM notes n WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`,
    params,
  };
}
