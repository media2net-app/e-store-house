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
  const expected = Buffer.from(fingerprint(responseFields, data, key), "hex");
  const received = Buffer.from(data.fp_hash, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
