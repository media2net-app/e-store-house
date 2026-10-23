import { createSupabaseComplaint, createSupabaseOrder, createSupabaseWithdrawal, getSupabaseOrder,
  hasSupabaseStorage, listSupabaseComplaints, listSupabaseOrders, listSupabaseWithdrawals,
  markSupabasePaymentEmailSent, recordSupabasePayment, supabasePaymentEmailSent } from "./supabase-orders";
import type { ShippingCarrier, ShippingMethod } from "./shipping";

export type OrderStatus = "pending_payment" | "payment_failed" | "paid_review" | "pending_cod" | "cancel_requested" | "cancelled";

export type StoreOrder = {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status: OrderStatus;
  testOrder?: boolean;
  paymentMethod?: import("./payment-methods").PaymentMethod;
  checkoutFingerprint?: string;
  cancellation?: { requestedAt: string; completedAt?: string; reason: string; actor: "E-Store Control";
    state: "processing" | "cancelled" | "review_required"; note: string; refundReviewRequired: boolean;
    emailSentAt?: string; paymentReceivedAfterCancellation?: boolean };

  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
    billingName: string;
    billingAddress: string;
    billingCity: string;
    billingCounty: string;
    billingPostalCode: string;
    billingCompany?: string;
    billingCui?: string;
  };
  items: { productId: number; sku?: string; name: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingRateSource?: "fixed" | "sameday" | "free";
  shippingCarrier?: ShippingCarrier;
  shippingMethod?: ShippingMethod;
  shippingLocker?: import("./sameday-protocol").SamedayLocker;
  totalCents: number;
  paymentId?: string;
};

export type WithdrawalRequest = {
  id: string;
  orderId: string;
  name: string;
  email: string;
  products: string;
  address: string;
  receivedAt?: string;
  submittedAt: string;
};

export type ComplaintRequest = {
  id: string;
  orderId: string;
  name: string;
  email: string;
  phone: string;
  issue: string;
  submittedAt: string;
};

function redisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

export function hasRedisStorage() {
  const { url, token } = redisCredentials();
  return !!url && /^https:\/\//.test(url) && !!token;
}

function config() {
  const { url, token } = redisCredentials();
  if (!url || !token || !/^https:\/\//.test(url)) throw new Error("Stocarea comenzilor nu este configurată.");
  return { url, token };
}

async function redis(command: unknown[]) {
  const { url, token } = config();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Stocarea comenzilor este indisponibilă.");
  const result = await response.json() as { result?: unknown; error?: string };
  if (result.error) throw new Error("Stocarea comenzilor a respins operația.");
  return result.result;
}

export const orderStoragePrefix = () => process.env.VERCEL_ENV === "production" ? "estore:production" : "estore";
const key = (id: string) => `${orderStoragePrefix()}:order:${id}`;
const retentionSeconds = 7 * 365 * 24 * 60 * 60;

export async function createOrder(order: StoreOrder) {
  if (hasSupabaseStorage()) return createSupabaseOrder(order);
  const script = `if redis.call('EXISTS', KEYS[1]) == 1 then return false end
local order = cjson.decode(ARGV[1])
local sequence = redis.call('INCR', KEYS[3])
order.orderNumber = ARGV[5] .. string.format('%04d', sequence)
local payload = cjson.encode(order)
redis.call('SET', KEYS[1], payload, 'EX', ARGV[4])
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[3])
return payload`;
  const result = await redis(["EVAL", script, "3", key(order.id), `${orderStoragePrefix()}:orders`,
    `${orderStoragePrefix()}:order-sequence${order.testOrder ? ":test" : ""}`,
    JSON.stringify(order), Date.parse(order.createdAt), order.id, retentionSeconds, order.testOrder ? "TEST-" : ""]);
  if (typeof result !== "string") throw new Error("Numărul comenzii este deja folosit.");
  order.orderNumber = (JSON.parse(result) as StoreOrder).orderNumber;
}

export async function getOrder(id: string): Promise<StoreOrder | null> {
  if (hasSupabaseStorage()) return getSupabaseOrder(id);
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const value = await redis(["GET", key(id)]);
  return typeof value === "string" ? JSON.parse(value) as StoreOrder : null;
}

export async function recordPayment(id: string, action: "0" | "failed", paymentId: string) {
  if (hasSupabaseStorage()) return recordSupabasePayment(id, action, paymentId);
  // Atomic update: a later failed or duplicate notification cannot undo an approved payment.
  const script = `local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local order = cjson.decode(raw)
if order.paymentMethod == 'cod' or order.status == 'pending_cod' then return 0 end
if order.status == 'cancelled' or order.status == 'cancel_requested' then
  if ARGV[1] == '0' and order.paymentId ~= ARGV[2] then
    order.paymentId = ARGV[2]
    if order.cancellation then
      order.cancellation.refundReviewRequired = true
      order.cancellation.paymentReceivedAfterCancellation = true
    end
    redis.call('SET', KEYS[1], cjson.encode(order), 'KEEPTTL')
  end
  return 1
end
if order.status == 'paid_review' then return 1 end
if ARGV[1] == '0' then
  order.status = 'paid_review'
  order.paymentId = ARGV[2]
elseif order.status == 'pending_payment' then
  order.status = 'payment_failed'
end
redis.call('SET', KEYS[1], cjson.encode(order), 'KEEPTTL')
return 1`;
  return await redis(["EVAL", script, "1", key(id), action, paymentId]) === 1;
}

export async function listOrders(): Promise<StoreOrder[]> {
  if (hasSupabaseStorage()) return listSupabaseOrders();
  const ids = await redis(["ZREVRANGE", `${orderStoragePrefix()}:orders`, "0", "49"]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await redis(["MGET", ...ids.map((id) => key(String(id)))]);
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string")
    .map((value) => JSON.parse(value) as StoreOrder) : [];
}

export async function paymentEmailSent(id: string) {
  if (hasSupabaseStorage()) return supabasePaymentEmailSent(id);
  return await redis(["GET", `${orderStoragePrefix()}:payment-email:${id}`]) === "1";
}

export async function markPaymentEmailSent(id: string) {
  if (hasSupabaseStorage()) return markSupabasePaymentEmailSent(id);
  await redis(["SET", `${orderStoragePrefix()}:payment-email:${id}`, "1"]);
}

export async function createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalRequest> {
  if (hasSupabaseStorage()) return createSupabaseWithdrawal(request);
  const withdrawalKey = `${orderStoragePrefix()}:withdrawal:${request.id}`;
  const script = `local existing = redis.call('GET', KEYS[1])
if existing then return existing end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[3])
return ARGV[1]`;
  const result = await redis(["EVAL", script, "2", withdrawalKey, `${orderStoragePrefix()}:withdrawals`, JSON.stringify(request), Date.parse(request.submittedAt), request.id, retentionSeconds]);
  if (typeof result !== "string") throw new Error("Cererea nu a putut fi înregistrată.");
  return JSON.parse(result) as WithdrawalRequest;
}

export async function listWithdrawals(): Promise<WithdrawalRequest[]> {
  if (hasSupabaseStorage()) return listSupabaseWithdrawals();
  const ids = await redis(["ZREVRANGE", `${orderStoragePrefix()}:withdrawals`, "0", "49"]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await redis(["MGET", ...ids.map((id) => `${orderStoragePrefix()}:withdrawal:${id}`)]);
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string")
    .map((value) => JSON.parse(value) as WithdrawalRequest) : [];
}

export async function createComplaint(request: ComplaintRequest): Promise<ComplaintRequest> {
  if (hasSupabaseStorage()) return createSupabaseComplaint(request);
  const script = `local existing = redis.call('GET', KEYS[1])
if existing then return existing end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[3])
return ARGV[1]`;
  const result = await redis(["EVAL", script, "2", `${orderStoragePrefix()}:complaint:${request.id}`, `${orderStoragePrefix()}:complaints`,
    JSON.stringify(request), Date.parse(request.submittedAt), request.id, retentionSeconds]);
  if (typeof result !== "string") throw new Error("Reclamația nu a putut fi înregistrată.");
  return JSON.parse(result) as ComplaintRequest;
}

export async function listComplaints(): Promise<ComplaintRequest[]> {
  if (hasSupabaseStorage()) return listSupabaseComplaints();
  const ids = await redis(["ZREVRANGE", `${orderStoragePrefix()}:complaints`, "0", "49"]);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const values = await redis(["MGET", ...ids.map((id) => `${orderStoragePrefix()}:complaint:${id}`)]);
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string")
    .map((value) => JSON.parse(value) as ComplaintRequest) : [];
}

// Shared durable storage for courier idempotency records; server-side only.
export const orderStorageCommand = redis;
