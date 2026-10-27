import type { BeddingModel, BeddingChoice } from './bedding-finder';

type PackedChoice = [number, number, number, number, number[], number[], Record<string, number[]> | null, number[], number[], number[], number];
type PackedModel = [number, number, number, number, number[], PackedChoice[], boolean];
export type BeddingPayload = { strings: string[]; models: PackedModel[] };

/** Lossless wire representation: repeated labels and image URLs are sent once. */
export function packBeddingModels(models: BeddingModel[]): BeddingPayload {
  const strings: string[] = [], ids = new Map<string, number>();
  const intern = (value: string) => {
    const existing = ids.get(value);
    if (existing !== undefined) return existing;
    const id = strings.length; strings.push(value); ids.set(value, id); return id;
  };
  const list = (values: string[]) => values.map(intern);
  const choice = (c: BeddingChoice): PackedChoice => [c.id, intern(c.name), c.price, intern(c.image), list(c.colors), list(c.mattress), c.mattressHeights ?? null, list(c.flatSheet), list(c.duvet), list(c.pillow), intern(c.sheet)];
  return { strings, models: models.map(m => [m.id, intern(m.name), intern(m.material), intern(m.color), list(m.colors), m.choices.map(choice), m.variable]) };
}
export function unpackBeddingModels(data: BeddingPayload): BeddingModel[] {
  const str = (id: number) => data.strings[id];
  const list = (ids: number[]) => ids.map(str);
  const choice = (c: PackedChoice): BeddingChoice => ({ id: c[0], name: str(c[1]), price: c[2], image: str(c[3]), colors: list(c[4]), mattress: list(c[5]), ...(c[6] === null ? {} : { mattressHeights: c[6] }), flatSheet: list(c[7]), duvet: list(c[8]), pillow: list(c[9]), sheet: str(c[10]) });
  return data.models.map(m => ({ id: m[0], name: str(m[1]), material: str(m[2]), color: str(m[3]), colors: list(m[4]), choices: m[5].map(choice), variable: m[6] }));
}
