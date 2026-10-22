import "server-only";
import { orderStorageCommand, orderStoragePrefix } from "./orders";
import { hasSupabaseStorage, supabaseQuery } from "./supabase-orders";
export type ShipmentRecord = { orderId: string; state: "creating" | "created" | "unknown" | "cancelled"; createdAt: string;
  awbNumber?: string; costRon?: number | null; mode: "live" | "test" };
const key = (id: string) => `${orderStoragePrefix()}:sameday-shipment:${id}`;
const path = (id: string) => `estore_shipments?order_id=eq.${id}`;

export async function getShipment(id: string): Promise<ShipmentRecord | null> {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  if (hasSupabaseStorage()) {
    const rows = await supabaseQuery<{ payload: ShipmentRecord }[]>(`${path(id)}&select=payload`);
    return rows[0]?.payload || null;
  }
  const raw = await orderStorageCommand(["GET", key(id)]);
  return typeof raw === "string" ? JSON.parse(raw) as ShipmentRecord : null;
}
export async function claimShipment(record: ShipmentRecord) {
  if (!/^[a-f0-9]{24}$/.test(record.orderId)) throw new Error("Comandă invalidă.");
  if (hasSupabaseStorage()) {
    try {
      await supabaseQuery("estore_shipments", { method: "POST", body: JSON.stringify({ order_id: record.orderId, payload: record }) });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) return false;
      throw error;
    }
  }
  const script = `local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local o = cjson.decode(raw)
if o.cancellation or (o.status ~= 'pending_cod' and o.status ~= 'paid_review') then return 0 end
if redis.call('SET', KEYS[2], ARGV[1], 'NX') then return 1 end
return 0`;
  return await orderStorageCommand(["EVAL", script, "2", `${orderStoragePrefix()}:order:${record.orderId}`, key(record.orderId), JSON.stringify(record)]) === 1;
}
export async function saveShipment(record: ShipmentRecord) {
  if (hasSupabaseStorage()) {
    const rows = await supabaseQuery<unknown[]>(path(record.orderId), { method: "PATCH", body: JSON.stringify({ payload: record }) });
    if (rows.length !== 1) throw new Error("AWB-ul nu a putut fi salvat.");
    return;
  }
  if (await orderStorageCommand(["SET", key(record.orderId), JSON.stringify(record), "XX"]) !== "OK") throw new Error("AWB-ul nu a putut fi salvat.");
}
