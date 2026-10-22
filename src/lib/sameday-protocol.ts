export type Parcel = { weight: number; width: number; length: number; height: number };
export type SamedayLocker = { id: number; name: string; address: string; city: string; county: string; postalCode: string };
export type PackingProfile = Parcel & { source: string };

export function validParcel(value: unknown): value is Parcel {
  if (!value || typeof value !== "object") return false;
  const p = value as Parcel;
  return [p.weight, p.width, p.length, p.height].every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)
    && p.weight <= 31.5 && Math.max(p.width, p.length, p.height) <= 200;
}

// Conservative single-box stacking of measured, already packed SKU units.
// No weight or dimensions are inferred from bedding sizes or product photographs.
export function easyboxParcel(lines: { sku?: string; quantity: number }[], profiles: Record<string, PackingProfile>): Parcel | null {
  const parcel = packedParcel(lines, profiles);
  return parcel && fitsEasybox(parcel) ? parcel : null;
}

export function packedParcel(lines: { sku?: string; quantity: number }[], profiles: Record<string, PackingProfile>): Parcel | null {
  if (!lines.length) return null;
  const parcel: Parcel = { weight: 0, width: 0, length: 0, height: 0 };
  for (const line of lines) {
    const profile = line.sku ? profiles[line.sku] : null;
    if (!profile || !profile.source?.trim() || !validParcel(profile) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) return null;
    const edges = [profile.width, profile.length, profile.height].sort((a, b) => a - b);
    parcel.weight += profile.weight * line.quantity;
    parcel.height += edges[0] * line.quantity;
    parcel.width = Math.max(parcel.width, edges[1]);
    parcel.length = Math.max(parcel.length, edges[2]);
  }
  return validParcel(parcel) ? parcel : null;
}

export function fitsEasybox(parcel: Parcel) {
  const edges = [parcel.width, parcel.length, parcel.height].sort((a, b) => a - b);
  // Store limit is intentionally below the largest drawer, leaving clearance.
  return validParcel(parcel) && parcel.weight <= 20 && edges[0] <= 38 && edges[1] <= 43 && edges[2] <= 45;
}

export function encodeSamedayForm(value: Record<string, unknown>) {
  const form = new URLSearchParams();
  function add(key: string, item: unknown) {
    if (item === null || item === undefined) return;
    if (typeof item === "object") Object.entries(item).forEach(([name, nested]) => add(`${key}[${name}]`, nested));
    else form.append(key, String(item));
  }
  Object.entries(value).forEach(([key, item]) => add(key, item));
  return form;
}

export function parseLocker(value: Record<string, unknown>): SamedayLocker | null {
  const id = Number(value.lockerId);
  if (!Number.isSafeInteger(id) || id < 1 || !value.name || !value.address || !value.city || !value.county
    || value.clientVisible === false || value.clientVisible === 0 || value.clientVisible === "0") return null;
  return { id, name: String(value.name), address: String(value.address), city: String(value.city), county: String(value.county), postalCode: String(value.postalCode || "") };
}

export type EasyboxLine = { sku?: string; quantity: number; name: string; category?: string; categoryPath?: string;
  bundleComponents?: { name: string; quantity: number }[] };
const plain = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function easyboxEligibility(lines: EasyboxLine[], profiles: Record<string, PackingProfile>) {
  if (!lines.length) return false;
  let beddingSets = 0;
  let onlyBedding = true;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) return false;
    const category = plain(`${line.category || ""} ${line.categoryPath || ""}`);
    const names = [line.name, ...(line.bundleComponents?.map((item) => item.name) || [])].map(plain);
    if (names.some((name) => /^(?:topper|saltea|saltele)\b/.test(name.trim()))
      || /\btopper(?:e)?\b/.test(category) || /(?:^|\/)saltele(?:-|\/|\b)/.test(category.trim())) return false;
    const bedding = /lenjeri/.test(category);
    const bundleSets = line.bundleComponents?.filter((part) => /lenjeri/.test(plain(part.name))) || [];
    beddingSets += line.quantity * (bundleSets.length ? bundleSets.reduce((sum, part) => sum + part.quantity, 0) : bedding ? 1 : 0);
    if (!bedding || line.bundleComponents?.length) onlyBedding = false;
  }
  if (beddingSets > 3) return false;
  // Merchant-confirmed rule: at most three bedding sets; other small goods require measured package profiles.
  return onlyBedding || !!easyboxParcel(lines, profiles);
}
