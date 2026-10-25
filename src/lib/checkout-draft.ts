export const CHECKOUT_DRAFT_KEY = 'estore-checkout-draft-v1';
export const CHECKOUT_DRAFT_TTL = 2 * 60 * 60 * 1000;
export type CheckoutDraft = { customer: Record<string, string>; billing: Record<string, string>; separateBilling: boolean };
export const emptyCheckoutDraft: CheckoutDraft = { customer: {}, billing: {}, separateBilling: false };
const customerKeys = ['firstName', 'lastName', 'email', 'phone', 'address', 'county', 'city', 'postalCode'];
const billingKeys = ['billingName', 'billingAddress', 'billingCounty', 'billingCity', 'billingPostalCode', 'billingCompany', 'billingCui'];
function fields(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object') return {};
  const input = value as Record<string, unknown>;
  return Object.fromEntries(keys.filter(key => typeof input[key] === 'string').map(key => [key, (input[key] as string).slice(0, 200)]));
}
export function readCheckoutDraft(raw: string | null, now = Date.now()): CheckoutDraft {
  try {
    const data = JSON.parse(raw || 'null');
    if (!data || typeof data.savedAt !== 'number' || data.savedAt > now || now - data.savedAt > CHECKOUT_DRAFT_TTL) return emptyCheckoutDraft;
    return { customer: fields(data.customer, customerKeys), billing: fields(data.billing, billingKeys), separateBilling: data.separateBilling === true };
  } catch { return emptyCheckoutDraft; }
}
export function serializeCheckoutDraft(draft: CheckoutDraft, now = Date.now()) {
  return JSON.stringify({ customer: fields(draft.customer, customerKeys), billing: fields(draft.billing, billingKeys), separateBilling: draft.separateBilling, savedAt: now });
}
export function clearCheckoutDraft() {
  try { sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); } catch { /* Checkout also works without browser storage. */ }
}
