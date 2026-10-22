import {
  NoteTypeRepository,
  EmotionRepository,
  TagRepository,
} from "../domain/repositories";
import { NoteType, Emotion } from "../domain/entities";
import { cleanName, normalizeTag } from "../utils/values";
function validateColor(color: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color))
    throw new Error("Колір має формат #RRGGBB");
  return color;
}
export class NoteTypeService {
  constructor(private repo: NoteTypeRepository) {}
  list() {
    return this.repo.list();
  }
  save(v: Omit<NoteType, "id">, id?: number) {
    return this.repo.save(
      {
        ...v,
        name: cleanName(v.name),
        color: validateColor(v.color),
        icon: cleanName(v.icon),
      },
      id,
    );
  }
  async remove(id: number, replacement: number) {
    if (id === replacement)
      throw new Error("Для перенесення оберіть інший тип");
    return this.repo.remove(id, replacement);
  }
  reorder(ids: number[]) {
    return this.repo.reorder(ids);
  }
}
export class EmotionService {
  constructor(private repo: EmotionRepository) {}
  list() {
    return this.repo.list();
  }
  save(v: Omit<Emotion, "id">, id?: number) {
    return this.repo.save(
      {
        ...v,
        name: cleanName(v.name),
        icon: cleanName(v.icon),
        color: v.color ? validateColor(v.color) : null,
      },
      id,
    );
  }
  remove(id: number) {
    return this.repo.remove(id);
  }
  reorder(ids: number[]) {
    return this.repo.reorder(ids);
  }
}
export class TagService {
  constructor(private repo: TagRepository) {}
  list() {
    return this.repo.list();
  }
  save(name: string, id?: number) {
    return this.repo.save(cleanName(name), normalizeTag(name), id);
  }
  remove(id: number) {
    return this.repo.remove(id);
  }
}
