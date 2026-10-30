import "server-only";
import type { StoreOrder } from "./orders";
import { validParcel, type Parcel } from "./sameday-protocol";

const base = "https://api.fancourier.ro";
const ascii = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function fanConfiguration() {
  const username = process.env.FAN_API_USERNAME?.trim();
  const password = process.env.FAN_API_PASSWORD;
  const clientId = process.env.FAN_CLIENT_ID?.trim();
  const bank = process.env.FAN_BANK?.trim();
  const bankAccount = process.env.FAN_BANK_ACCOUNT?.replace(/\s/g, "").toUpperCase();
  return {
    username, password, clientId, bank, bankAccount,
    ready: !!username && !!password && !!clientId && /^\d+$/.test(clientId),
    awbEnabled: process.env.FAN_AWB_ENABLED === "true",
  };
}

let access: { key: string; value: string; until: number } | null = null;
let authentication: Promise<string> | null = null;

async function token(): Promise<string> {
  const config = fanConfiguration();
  if (!config.username || !config.password) throw new Error("Autentificarea API FAN nu este configurată.");
  const key = `${config.username}:${config.password}:${config.clientId}`;
  if (access?.key === key && access.until > Date.now()) return access.value;
  if (authentication) return authentication;
  authentication = (async () => {
    const response = await fetch(`${base}/login`, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000),
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ username: config.username!, password: config.password! }),
    });
    if (!response.ok) throw new Error(`Autentificarea FAN a eșuat (${response.status}).`);
    const result = await response.json() as { status?: string; data?: { token?: string } };
    if (result.status !== "success" || !result.data?.token) throw new Error("FAN nu a returnat un token valid.");
    access = { key, value: result.data.token, until: Date.now() + 23 * 60 * 60_000 };
    return result.data.token;
  })();
  try { return await authentication; } finally { authentication = null; }
}

export async function fanAccountBranches() {
  const result = await (await api("/reports/branches", "GET")).json() as {
    status?: string;
    data?: { id?: number; name?: string; bank?: string; bankAccount?: string; address?: { county?: string; locality?: string } }[];
  };
  if (result.status !== "success" || !Array.isArray(result.data)) throw new Error("FAN nu a returnat sucursalele contului.");
  return result.data.filter((branch) => Number.isSafeInteger(branch.id) && Number(branch.id) > 0).map((branch) => ({
    id: Number(branch.id), name: String(branch.name || ""), bank: String(branch.bank || ""),
    accountLast4: String(branch.bankAccount || "").slice(-4),
    county: String(branch.address?.county || ""), locality: String(branch.address?.locality || ""),
  }));
}

async function api(path: string, method: "GET" | "POST", body?: unknown) {
  const response = await fetch(base + path, {
    method, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${await token()}`, Accept: method === "GET" && path.startsWith("/awb/label") ? "application/pdf" : "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  // Creation is never retried: an ambiguous response may already have generated an AWB.
  if (!response.ok) throw new Error(`API FAN a răspuns cu ${response.status}.`);
  return response;
}

export function fanPayload(order: StoreOrder, parcel: Parcel) {
  if (!fitsFanStandard(parcel) || order.shippingCarrier !== "fan" || (order.shippingMethod || "home") !== "home") throw new Error("Comandă sau colet FAN invalid.");
  const config = fanConfiguration();
  if (!config.ready) throw new Error("Contul API FAN nu este configurat.");
  const cod = order.paymentMethod === "cod";
  if (cod && (!config.bank || !/^RO[A-Z0-9]{22}$/.test(config.bankAccount || "") || order.totalCents > 1_000_000)) throw new Error("Rambursul FAN necesită banca și IBAN-ul contractului; limita este 10.000 lei.");
  const customer = order.customer;
  const name = `${customer.firstName} ${customer.lastName}`.trim();
  const phone = customer.phone.replace(/\D/g, "");
  if (!/^\d{9,15}$/.test(phone)) throw new Error("Telefonul destinatarului nu este valid pentru FAN.");
  return {
    clientId: Number(config.clientId),
    shipments: [{
      info: {
        service: cod ? "Cont Colector" : "Standard",
        bank: cod ? config.bank : "",
        bankAccount: cod ? config.bankAccount : "",
        packages: { parcel: 1, envelope: 0 },
        weight: parcel.weight,
        cod: cod ? order.totalCents / 100 : 0,
        declaredValue: 0,
        payment: "expeditor",
        observation: `estore-${order.id}`,
        content: `Comanda ${order.id}`,
        dimensions: { length: parcel.length, width: parcel.width, height: parcel.height },
      },
      recipient: {
        name: name.slice(0, 50), contactPerson: name.slice(0, 50),
        phone, email: customer.email,
        address: { county: ascii(customer.county), locality: ascii(customer.city), street: customer.address, zipCode: customer.postalCode },
      },
    }],
  };
}

export function fitsFanStandard(parcel: Parcel) {
  if (!validParcel(parcel) || parcel.weight > 30) return false;
  const [short, middle, long] = [parcel.width, parcel.length, parcel.height].sort((a, b) => a - b);
  return short <= 30 && middle <= 50 && long <= 60;
}

export async function estimateFan(order: StoreOrder, parcel: Parcel) {
  const payload = fanPayload(order, parcel);
  const shipment = payload.shipments[0];
  const rate = await fanInternalTariff({ clientId: String(payload.clientId), service: shipment.info.service,
    county: shipment.recipient.address.county, locality: shipment.recipient.address.locality, parcel });
  return { amount: rate.total, currency: "RON" };
}

export async function fanInternalTariff(input: { clientId: string; service: string; county: string; locality: string; parcel: Parcel }) {
  if (!/^\d+$/.test(input.clientId) || !["Standard", "Cont Colector"].includes(input.service)
    || !fitsFanStandard(input.parcel) || !input.county || !input.locality) throw new Error("Date de tarif FAN invalide.");
  const p = new URLSearchParams({ clientId: input.clientId, "info[service]": input.service,
    "info[payment]": "expeditor", "info[weight]": String(input.parcel.weight),
    "info[packages][parcel]": "1", "info[packages][envelope]": "0",
    "info[dimensions][length]": String(input.parcel.length), "info[dimensions][width]": String(input.parcel.width), "info[dimensions][height]": String(input.parcel.height),
    "recipient[county]": ascii(input.county), "recipient[locality]": ascii(input.locality) });
  const result = await (await api(`/reports/awb/internal-tariff?${p}`, "GET")).json() as {
    status?: string; data?: { extraKmCost?: number; weightCost?: number; insuranceCost?: number; optionsCost?: number; fuelCost?: number; costNoVAT?: number; vat?: number; total?: number };
  };
  const data = result.data;
  if (result.status !== "success" || !data || [data.extraKmCost, data.weightCost, data.insuranceCost,
    data.optionsCost, data.fuelCost, data.costNoVAT, data.vat, data.total].some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    throw new Error("FAN nu a returnat un tarif valid.");
  }
  return { extraKmCost: data.extraKmCost!, weightCost: data.weightCost!, insuranceCost: data.insuranceCost!,
    optionsCost: data.optionsCost!, fuelCost: data.fuelCost!, costNoVAT: data.costNoVAT!, vat: data.vat!, total: data.total! };
}

export async function createFanAwb(order: StoreOrder, parcel: Parcel) {
  const result = await (await api("/intern-awb", "POST", fanPayload(order, parcel))).json() as {
    response?: { awbNumber?: string | number; tariff?: number; vat?: number; errors?: unknown }[];
  };
  const row = result.response?.[0];
  const awbNumber = String(row?.awbNumber || "");
  if (!/^\d{6,40}$/.test(awbNumber) || row?.errors) throw new Error("FAN nu a confirmat numărul AWB. Verifică SelfAWB înainte de a relua emiterea.");
  const cost = Number(row?.tariff) + Number(row?.vat);
  return { awbNumber, costRon: Number.isFinite(cost) ? cost : null };
}

export async function fanLabel(awbNumber: string) {
  if (!/^\d{6,40}$/.test(awbNumber)) throw new Error("AWB FAN invalid.");
  const p = new URLSearchParams({ clientId: fanConfiguration().clientId || "", "awbs[]": awbNumber, pdf: "1" });
  const response = await api(`/awb/label?${p}`, "GET");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Eticheta FAN nu este un PDF valid.");
  return bytes;
}
