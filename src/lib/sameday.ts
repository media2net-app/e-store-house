import "server-only";
import { encodeSamedayForm, parseLocker, validParcel, fitsEasybox, type Parcel, type SamedayLocker } from "./sameday-protocol";
import type { StoreOrder } from "./orders";

const clientHeaders = { "User-Agent": "EStoreHouse/1.0", "X-Platform": "EStoreHouse/1.0", Accept: "application/json" };
const hosts = { live: "https://api.sameday.ro", test: "https://sameday-api.demo.zitec.com" };
export function samedayConfiguration() {
  const mode = process.env.SAMEDAY_MODE;
  const username = process.env.SAMEDAY_API_USERNAME;
  const password = process.env.SAMEDAY_API_PASSWORD;
  const pickupPoint = Number(process.env.SAMEDAY_PICKUP_POINT_ID);
  const contactPerson = Number(process.env.SAMEDAY_CONTACT_PERSON_ID);
  const homeService = Number(process.env.SAMEDAY_HOME_SERVICE_ID);
  const lockerService = Number(process.env.SAMEDAY_LOCKER_SERVICE_ID);
  const authenticated = (mode === "live" || mode === "test") && !!username && !!password;
  const pickupReady = Number.isSafeInteger(pickupPoint) && pickupPoint > 0 && Number.isSafeInteger(contactPerson) && contactPerson > 0;
  return { mode, host: hosts[mode as keyof typeof hosts], username, password, pickupPoint, contactPerson, homeService, lockerService,
    authenticated, homeReady: authenticated && pickupReady && homeService > 0 && Number.isSafeInteger(homeService),
    lockerReady: authenticated && pickupReady && lockerService > 0 && Number.isSafeInteger(lockerService) };
}

let access: { key: string; token: string; until: number } | null = null;
let authentication: Promise<string> | null = null;
async function token(): Promise<string> {
  const config = samedayConfiguration();
  if (!config.authenticated) throw new Error("Lipsesc datele API Sameday sau mediul de lucru.");
  const key = `${config.host}:${config.username}:${config.password}`;
  if (access?.key === key && access.until > Date.now()) return access.token;
  if (authentication) return authentication;
  authentication = (async () => {
    const response = await fetch(`${config.host}/api/authenticate`, { method: "POST", cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(15000), headers: { ...clientHeaders, "X-AUTH-USERNAME": config.username!, "X-AUTH-PASSWORD": config.password!,
        "Content-Type": "application/x-www-form-urlencoded" }, body: "remember_me=1" });
    if (!response.ok) throw new Error(`Autentificarea API Sameday a eșuat (${response.status}).`);
    const result = await response.json() as { token?: string };
    if (!result.token || typeof result.token !== "string") throw new Error("Sameday nu a returnat un token valid.");
    // Short local cache; an expired token is refreshed once for read-only requests.
    access = { key, token: result.token, until: Date.now() + 5 * 60_000 };
    return result.token;
  })();
  try { return await authentication; } finally { authentication = null; }
}

async function api(path: string, body?: Record<string, unknown>, retry = true): Promise<Response> {
  const response = await fetch(`${samedayConfiguration().host}${path}`, {
    method: body ? "POST" : "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    headers: { ...clientHeaders, "X-AUTH-TOKEN": await token(), ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    ...(body ? { body: encodeSamedayForm(body) } : {}),
  });
  if (response.status === 401 && !body && retry) { access = null; return api(path, undefined, false); }
  // Never retry an AWB creation: a timeout or ambiguous response can already have created it.
  if (!response.ok) throw new Error(`Serviciul API Sameday a răspuns cu ${response.status}.`);
  return response;
}

export async function samedayList(path: "/api/client/services" | "/api/client/pickup-points" | "/api/client/lockers") {
  const rows: Record<string, unknown>[] = [];
  for (let page = 1; page <= 200; page++) {
    const result = await (await api(`${path}?page=${page}&countPerPage=500`)).json() as { data?: Record<string, unknown>[]; pages?: number };
    if (!Array.isArray(result.data)) throw new Error("Lista returnată de Sameday nu are formatul așteptat.");
    rows.push(...result.data);
    if (Number(result.pages) > 0 ? page >= Number(result.pages) : result.data.length < 500) return rows;
  }
  throw new Error("Lista Sameday este incompletă. Reîncearcă mai târziu.");
}

let lockersCache: { key: string; until: number; rows: SamedayLocker[] } | null = null;
export async function samedayLockers() {
  const config = samedayConfiguration();
  const key = `${config.mode}:${config.username}`;
  if (lockersCache?.key === key && lockersCache.until > Date.now()) return lockersCache.rows;
  const rows = (await samedayList("/api/client/lockers")).map(parseLocker).filter((row): row is SamedayLocker => !!row);
  lockersCache = { key, rows, until: Date.now() + 10 * 60_000 };
  return rows;
}

export async function samedayLocker(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Alege un easybox valid.");
  const result = await (await api(`/api/client/lockers?lockersList=${id}&page=1&countPerPage=50`)).json() as { data?: Record<string, unknown>[] };
  const locker = result.data?.map(parseLocker).find((row) => row?.id === id);
  if (!locker) throw new Error("Easybox-ul ales nu mai este disponibil. Alege altul.");
  return locker;
}

export function samedayPayload(order: StoreOrder, parcel: Parcel, locker?: SamedayLocker) {
  const config = samedayConfiguration();
  if (!(locker ? config.lockerReady : config.homeReady) || !validParcel(parcel) || (locker && !fitsEasybox(parcel))) throw new Error("Serviciul sau coletul Sameday nu este configurat corect.");
  const c = order.customer;
  return { pickupPoint: config.pickupPoint, contactPerson: config.contactPerson, packageType: 0, packageNumber: 1,
    packageWeight: parcel.weight, service: locker ? config.lockerService : config.homeService,
    awbPayment: 1, cashOnDelivery: 0, insuredValue: 0, thirdPartyPickup: 0, currency: "RON",
    parcels: [parcel], clientInternalReference: `estore-${order.id}`,
    awbRecipient: { name: `${c.firstName} ${c.lastName}`, phoneNumber: c.phone, email: c.email, personType: 0,
      address: locker?.address || c.address, cityString: locker?.city || c.city, countyString: locker?.county || c.county,
      postalCode: locker?.postalCode || c.postalCode },
    ...(locker ? { lockerLastMile: locker.id } : {}),
  };
}

export async function estimateSameday(payload: Record<string, unknown>) {
  const result = await (await api("/api/awb/estimate-cost", payload)).json() as { amount?: number; currency?: string; time?: number };
  if (!Number.isFinite(Number(result.amount)) || Number(result.amount) < 0 || String(result.currency).toUpperCase() !== "RON") throw new Error("Estimarea Sameday nu este validă.");
  return { amount: Number(result.amount), currency: "RON", estimatedTime: result.time };
}

export async function createSamedayAwb(payload: Record<string, unknown>) {
  const result = await (await api("/api/awb", payload)).json() as { awbNumber?: string; awbCost?: number };
  if (typeof result.awbNumber !== "string" || !/^[a-z0-9]{6,40}$/i.test(result.awbNumber)) throw new Error("Sameday nu a confirmat numărul AWB. Verifică eAWB înainte de orice nouă încercare.");
  return { awbNumber: result.awbNumber, costRon: Number.isFinite(Number(result.awbCost)) ? Number(result.awbCost) : null };
}

export async function samedayLabel(awb: string) {
  if (!/^[a-z0-9]{6,40}$/i.test(awb)) throw new Error("AWB invalid.");
  const response = await api(`/api/awb/download/${encodeURIComponent(awb)}/A6`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Eticheta Sameday nu este un PDF valid.");
  return bytes;
}
