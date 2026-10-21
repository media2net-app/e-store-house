import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const EU_PLATESC_URL = "https://secure.euplatesc.ro/tdsprocess/tranzactd.php";

export function paymentCallbackUrl(origin: string, preview: boolean, bypassSecret?: string) {
  const url = new URL("/api/euplatesc/callback", origin);
  if (preview) {
    if (!bypassSecret) throw new Error("Preview callback bypass is not configured.");
    url.searchParams.set("x-vercel-protection-bypass", bypassSecret);
  }
  return url.toString();
}

const requestFields = [
  "amount", "curr", "invoice_id", "order_desc", "merch_id", "timestamp", "nonce",
] as const;
const responseFields = [
  "amount", "curr", "invoice_id", "ep_id", "merch_id", "action", "message",
  "approval", "timestamp", "nonce",
] as const;
const optionalResponseFields = [
  "sec_status", "rrn", "mcard", "card_exp", "discount_amount", "payment_channel",
  "card_type", "bin", "rate", "card_holder", "email", "rtype", "cce",
] as const;
const statusFields = ["method", "mid", "invoice_id", "timestamp", "nonce"] as const;

export type PaymentStatus = {
  merchantId: string;
  invoiceId: string;
  paymentId: string;
  action: string;
  amount?: string;
  captured?: string;
  refunded?: string;
};

export type PaymentResponse = Record<(typeof responseFields)[number] | "fp_hash", string>;

function fingerprint(fields: readonly string[], data: Record<string, string>, key: string) {
  if (!/^[a-f\d]{32,}$/i.test(key) || key.length % 2 !== 0) {
    throw new Error("Cheia EuPlătesc lipsește sau are format invalid.");
  }
  const message = fields.map((field) => {
    const value = data[field] ?? "";
    return value.length ? `${Buffer.byteLength(value, "utf8")}${value}` : "-";
  }).join("");
  return createHmac("md5", Buffer.from(key, "hex")).update(message, "utf8").digest("hex").toUpperCase();
}

export function createPaymentFields(input: {
  amount: string;
  invoiceId: string;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  callbackUrl: string;
  returnUrl: string;
  merchantId: string;
  key: string;
}) {
  const signed: Record<string, string> = {
    amount: input.amount,
    curr: "RON",
    invoice_id: input.invoiceId,
    order_desc: input.description.slice(0, 127),
    merch_id: input.merchantId,
    timestamp: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
    nonce: randomBytes(16).toString("hex"),
  };
  return {
    ...signed,
    fp_hash: fingerprint(requestFields, signed, input.key),
    email: input.email,
    fname: input.firstName,
    lname: input.lastName,
    "ExtraData[silenturl]": input.callbackUrl,
    "ExtraData[successurl]": input.returnUrl,
    "ExtraData[failedurl]": input.returnUrl,
    "ExtraData[backtosite]": input.returnUrl,
    "ExtraData[ep_method]": "getclean",
    lang: "ro",
  };
}

export function verifyPaymentResponse(
  data: Record<string, string>, key: string, merchantId: string,
): data is PaymentResponse {
  if (data.merch_id !== merchantId || !/^[a-f\d]{32}$/i.test(data.fp_hash ?? "")) return false;
  const signedFields = [...responseFields, ...optionalResponseFields.filter((field) => field in data)];
  const expected = Buffer.from(fingerprint(signedFields, data, key), "hex");
  const received = Buffer.from(data.fp_hash, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function createStatusQuery(invoiceId: string, merchantId: string, key: string,
  timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
  nonce = randomBytes(16).toString("hex")) {
  const fields = { method: "check_status", mid: merchantId, invoice_id: invoiceId, timestamp, nonce };
  return { ...fields, fp_hash: fingerprint(statusFields, fields, key) };
}

export async function queryPaymentStatus(invoiceId: string, merchantId: string, key: string): Promise<PaymentStatus[]> {
  const response = await fetch("https://manager.euplatesc.ro/v3/?action=ws&v=1.2", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(createStatusQuery(invoiceId, merchantId, key)),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("EuPlătesc status request failed.");
  const raw = await response.text();
  if (raw.length > 65536) throw new Error("EuPlătesc status response is too large.");
  const body = JSON.parse(raw) as { success?: unknown; error?: unknown };
  if (!body.success) throw new Error("EuPlătesc did not return a transaction.");
  const entries = typeof body.success === "string" ? JSON.parse(body.success) as unknown : body.success;
  if (!Array.isArray(entries) || entries.length > 40) throw new Error("Invalid EuPlătesc status response.");
  return entries.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid EuPlătesc transaction.");
    const item = entry as Record<string, unknown>;
    if (item.merch_id !== merchantId || item.invoice_id !== invoiceId
      || typeof item.ep_id !== "string" || !/^[A-F0-9]{40}$/i.test(item.ep_id)
      || typeof item.action !== "string") throw new Error("Mismatched EuPlătesc transaction.");
    return {
      merchantId, invoiceId, paymentId: item.ep_id, action: item.action,
      ...(typeof item.amount === "string" ? { amount: item.amount } : {}),
      ...(typeof item.captured === "string" ? { captured: item.captured } : {}),
      ...(typeof item.refunded === "string" ? { refunded: item.refunded } : {}),
    };
  });
}
