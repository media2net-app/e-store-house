import "server-only";
import type { ComplaintRequest, StoreOrder, WithdrawalRequest } from "./orders";

type OrderRow = { payload: StoreOrder; status: StoreOrder["status"]; payment_id: string | null; payment_email_sent: boolean };
type RequestRow = { payload: WithdrawalRequest | ComplaintRequest };

export function hasSupabaseStorage() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function query<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !/^https:\/\/[^/]+\/$/.test(`${base.replace(/\/$/, "")}/`) || !key) {
    throw new Error("Baza de date nu este configurată.");
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json",
      Prefer: "return=representation", ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Stocarea comenzilor a răspuns cu ${response.status}.`);
  return await response.json() as T;
}

const orderPath = "estore_orders";
const requestPath = "estore_requests";
const orderIdFilter = (id: string) => `${orderPath}?id=eq.${encodeURIComponent(id)}&select=payload,status,payment_id,payment_email_sent`;

function hydrate(row: OrderRow): StoreOrder {
  return { ...row.payload, status: row.status, ...(row.payment_id ? { paymentId: row.payment_id } : {}) };
}

export async function createSupabaseOrder(order: StoreOrder) {
  const rows = await query<OrderRow[]>(orderPath, { method: "POST", body: JSON.stringify({
    id: order.id, created_at: order.createdAt, status: order.status, payload: order,
  }) });
  if (rows.length !== 1) throw new Error("Comanda nu a putut fi salvată.");
}

export async function getSupabaseOrder(id: string): Promise<StoreOrder | null> {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const rows = await query<OrderRow[]>(orderIdFilter(id));
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function recordSupabasePayment(id: string, action: "0" | "failed", paymentId: string) {
  const status = action === "0" ? "paid_review" : "payment_failed";
  const filter = action === "0" ? "status=neq.paid_review" : "status=eq.pending_payment";
  const rows = await query<OrderRow[]>(`${orderPath}?id=eq.${encodeURIComponent(id)}&${filter}&select=payload,status,payment_id,payment_email_sent`, {
    method: "PATCH", body: JSON.stringify({ status, ...(action === "0" ? { payment_id: paymentId } : {}) }),
  });
  if (rows.length) return true;
  const existing = await getSupabaseOrder(id);
  return action === "0" ? existing?.status === "paid_review"
    : existing?.status === "paid_review" || existing?.status === "payment_failed";
}

export async function listSupabaseOrders(): Promise<StoreOrder[]> {
  const rows = await query<OrderRow[]>(`${orderPath}?select=payload,status,payment_id,payment_email_sent&order=created_at.desc&limit=50`);
  return rows.map(hydrate);
}

export async function supabasePaymentEmailSent(id: string) {
  const rows = await query<OrderRow[]>(`${orderPath}?id=eq.${encodeURIComponent(id)}&select=payment_email_sent`);
  return rows[0]?.payment_email_sent === true;
}

export async function markSupabasePaymentEmailSent(id: string) {
  const rows = await query<OrderRow[]>(`${orderPath}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH", body: JSON.stringify({ payment_email_sent: true }),
  });
  if (rows.length !== 1) throw new Error("Starea notificării nu a putut fi salvată.");
}

async function createRequest<T extends WithdrawalRequest | ComplaintRequest>(kind: "withdrawal" | "complaint", request: T): Promise<T> {
  try {
    const rows = await query<RequestRow[]>(requestPath, { method: "POST", body: JSON.stringify({
      id: request.id, kind, submitted_at: request.submittedAt, payload: request,
    }) });
    if (rows.length !== 1) throw new Error("Cererea nu a putut fi salvată.");
    return rows[0].payload as T;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) throw error;
    const rows = await query<RequestRow[]>(`${requestPath}?id=eq.${encodeURIComponent(request.id)}&kind=eq.${kind}&select=payload`);
    if (!rows[0]) throw error;
    return rows[0].payload as T;
  }
}

async function listRequests<T>(kind: "withdrawal" | "complaint"): Promise<T[]> {
  const rows = await query<RequestRow[]>(`${requestPath}?kind=eq.${kind}&select=payload&order=submitted_at.desc&limit=50`);
  return rows.map((row) => row.payload as T);
}

export const createSupabaseWithdrawal = (request: WithdrawalRequest) => createRequest("withdrawal", request);
export const createSupabaseComplaint = (request: ComplaintRequest) => createRequest("complaint", request);
export const listSupabaseWithdrawals = () => listRequests<WithdrawalRequest>("withdrawal");
export const listSupabaseComplaints = () => listRequests<ComplaintRequest>("complaint");

export const supabaseQuery = query;
