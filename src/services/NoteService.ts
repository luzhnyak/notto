import { NoteRepository } from "../domain/repositories";
import { NoteFilter, NoteInput, NoteStatus } from "../domain/entities";
import { OperationGate } from "./OperationGate";
import { cleanName, validateDate } from "../utils/values";
export class NoteService {
  constructor(
    private repo: NoteRepository,
    private now: () => Date = () => new Date(),
    private gate = new OperationGate(),
    private cleanup?: (id: number) => Promise<void>,
  ) {}
  async list(filter: NoteFilter = {}) {
    const limit = filter.limit ?? 100;
    if (limit <= 500) return this.repo.list(filter);
    const notes = await this.repo.list({ ...filter, limit: 500 });
    while (notes.length < limit) {
      const page = await this.repo.list({
        ...filter,
        limit: Math.min(500, limit - notes.length),
        offset: (filter.offset ?? 0) + notes.length,
      });
      notes.push(...page);
      if (!page.length) break;
    }
    return notes;
  }
  get(id: number) {
    return this.repo.get(id);
  }
  async save(value: NoteInput, id?: number) {
    const title = cleanName(value.title);
    if (!Number.isSafeInteger(value.noteTypeId) || value.noteTypeId < 1)
      throw new Error("Оберіть тип нотатки");
    if (
      value.emotionId !== null &&
      (!Number.isSafeInteger(value.emotionId) || value.emotionId < 1)
    )
      throw new Error("Некоректна емоція");
    if (value.tagIds.some((t) => !Number.isSafeInteger(t) || t < 1))
      throw new Error("Некоректний тег");
    return this.gate.run(() =>
      this.repo.save(
        {
          ...value,
          title,
          eventDate: value.eventDate ? validateDate(value.eventDate) : null,
          tagIds: [...new Set(value.tagIds)],
        },
        this.now().toISOString(),
        id,
      ),
    );
  }
  setStatus(id: number, status: NoteStatus) {
    return this.gate.run(() =>
      this.repo.setStatus(id, status, this.now().toISOString()),
    );
  }
  toggle(id: number, field: "is_favorite" | "is_pinned") {
    return this.gate.run(() =>
      this.repo.toggle(id, field, this.now().toISOString()),
    );
  }
  permanentDelete(id: number) {
    return this.gate.run(async () => {
      const note = await this.repo.get(id);
      if (!note || note.status !== "deleted")
        throw new Error("Остаточно видаляти можна лише нотатки з кошика");
      await this.cleanup?.(id);
      await this.repo.permanentDelete(id);
    });
  }
}
