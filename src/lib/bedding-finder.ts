import type { Product } from './products';
import { canonicalMaterial } from './catalog-filters';
import { normalizeSearch } from './discovery';

export type BeddingFilters = { material: string; color: string; sheet: string; mattress: string; duvet: string; pillow: string; maxPrice: string };
export const emptyBeddingFilters: BeddingFilters = { material: '', color: '', sheet: '', mattress: '', duvet: '', pillow: '', maxPrice: '' };
export type BeddingChoice = { id: number; name: string; price: number; image: string; mattress: string[]; duvet: string[]; pillow: string[]; sheet: string };
export type BeddingModel = { id: number; name: string; material: string; color: string; choices: BeddingChoice[]; variable: boolean };
const unique = (items: string[]) => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ro', { numeric: true }));
const sizes = (text: string) => unique([...text.matchAll(/(\d{2,3})\s*[x×]\s*(\d{2,3})(?:\s*[x×]\s*\d{1,3})?/gi)].map(m => [Number(m[1]), Number(m[2])].sort((a, b) => a - b).join(' × ') + ' cm'));

/** Only dimensions explicitly attached to a component may be used for matching. */
export function beddingDimensions(text: string) {
  const lines = normalizeSearch(text).replace(/dimensiuni\s+/g, '\n').split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
  const duvet = lines.filter(s => /pilot/.test(s) && !/pern|saltea/.test(s));
  const pillow = lines.filter(s => /pern/.test(s) && !/pilot|saltea|cears/.test(s));
  const mattress = lines.filter(s => /saltea|elastic/.test(s) && !/pilot|pern/.test(s));
  const flat = lines.some(s => /cearsaf/.test(s) && !/pilot|pern|elastic/.test(s) && (sizes(s).length > 0 || /simplu/.test(s)));
  return { duvet: unique(duvet.flatMap(sizes)), pillow: unique(pillow.flatMap(sizes)), mattress: unique(mattress.flatMap(sizes)), sheet: mattress.length ? 'Cu elastic / husă pentru saltea' : flat ? 'Cearșaf simplu' : '' };
}

/** A compact, display-only projection: no supplier copy or catalog prices are modified. */
export function buildBeddingModels(products: Product[]): BeddingModel[] {
  return products.filter(p => p.categoryPath?.startsWith('lenjerii-de-pat') && p.inStock !== false).flatMap(p => {
    const choices = p.variants?.length ? p.variants.filter(v => v.inStock !== false).map(v => ({ id: v.id, name: v.name, price: v.price, image: v.images?.[0] || p.image, ...beddingDimensions(v.contents || '') }))
      : [{ id: p.id, name: 'Setul prezentat', price: p.price, image: p.image, ...beddingDimensions(p.description || '') }];
    if (!choices.length) return [];
    const color = p.features?.find(f => normalizeSearch(f.label) === 'culoare')?.value
      || p.description?.match(/(?:^|\n|\.\s*)Culoare:\s*([^\n.;]+)/i)?.[1]?.trim() || '';
    return [{ id: p.id, name: p.name, material: canonicalMaterial(p.material || ''), color, choices, variable: Boolean(p.variants?.length) }];
  });
}

export function filterBedding(models: BeddingModel[], filters: BeddingFilters): BeddingModel[] {
  const maxPrice = filters.maxPrice.trim() === '' ? null : Number(filters.maxPrice);
  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) return [];
  return models.filter(p => (!filters.material || p.material === filters.material) && (!filters.color || p.color === filters.color)).flatMap(p => {
    const choices = p.choices.filter(v => (!filters.sheet || v.sheet === filters.sheet)
      && (!filters.mattress || v.mattress.includes(filters.mattress))
      && (!filters.duvet || v.duvet.includes(filters.duvet))
      && (!filters.pillow || v.pillow.includes(filters.pillow))
      && (maxPrice === null || v.price <= maxPrice));
    return choices.length ? [{ ...p, choices }] : [];
  });
}

export function beddingOptions(models: BeddingModel[]) {
  const choices = models.flatMap(p => p.choices);
  return { material: unique(models.map(p => p.material)), color: unique(models.map(p => p.color)), sheet: unique(choices.map(v => v.sheet)), mattress: unique(choices.flatMap(v => v.mattress)), duvet: unique(choices.flatMap(v => v.duvet)), pillow: unique(choices.flatMap(v => v.pillow)) };
}
