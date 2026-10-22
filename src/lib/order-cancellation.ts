import "server-only";
import { randomUUID } from "node:crypto";
import { getOrder, orderStorageCommand as redis, orderStoragePrefix, type StoreOrder } from "./orders";
import { hasSupabaseStorage } from "./supabase-orders";
import { getShipment } from "./shipment-store";
import { cancelSamedayAwb, samedayAwbStatus } from "./sameday";
import { sendCancellationConfirmation, sendCancelledPaymentNotice } from "./order-email";
const orderKey = (id: string) => `${orderStoragePrefix()}:order:${id}`;
const shipmentKey = (id: string) => `${orderStoragePrefix()}:sameday-shipment:${id}`;
export const CANCEL_BEGIN_LUA = `local raw = redis.call('GET', KEYS[1])
if not raw then return {'missing'} end
local o = cjson.decode(raw)
if o.testOrder then return {'test'} end
local shipment = redis.call('GET', KEYS[2])
if o.cancellation then return {'existing', raw, shipment or ''} end
if o.status ~= 'pending_cod' and o.status ~= 'pending_payment' and o.status ~= 'payment_failed' and o.status ~= 'paid_review' then return {'invalid'} end
local c = cjson.decode(ARGV[1])
c.refundReviewRequired = o.status == 'paid_review' and o.paymentMethod ~= 'cod'
if shipment then
  o.status = 'cancel_requested'
else
  o.status = 'cancelled'
  c.state = 'cancelled'
  c.completedAt = c.requestedAt
  c.note = 'Comandă anulată înainte de emiterea AWB-ului.'
end
o.cancellation = c
local saved = cjson.encode(o)
redis.call('SET', KEYS[1], saved, 'KEEPTTL')
return {'started', saved, shipment or ''}`;
export const CANCEL_FINISH_LUA = `local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local o = cjson.decode(raw)
if not o.cancellation then return 0 end
if o.status == 'cancelled' then return 1 end
o.cancellation.state = ARGV[1]
o.cancellation.note = ARGV[2]
if ARGV[1] == 'cancelled' then
  o.status = 'cancelled'
  o.cancellation.completedAt = ARGV[3]
  local rawShipment = redis.call('GET', KEYS[2])
  if rawShipment then
    local s = cjson.decode(rawShipment)
    s.state = 'cancelled'
    redis.call('SET', KEYS[2], cjson.encode(s))
  end
end
redis.call('SET', KEYS[1], cjson.encode(o), 'KEEPTTL')
return 1`;
async function finish(id: string, state: "cancelled" | "review_required", note: string) {
  if (await redis(["EVAL", CANCEL_FINISH_LUA, "2", orderKey(id), shipmentKey(id), state, note, new Date().toISOString()]) !== 1) throw new Error("Anularea nu a putut fi salvată. Reîncarcă lista.");
}
const markEmail = `local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local o = cjson.decode(raw)
if o.cancellation then o.cancellation.emailSentAt = ARGV[1] end
redis.call('SET', KEYS[1], cjson.encode(o), 'KEEPTTL')
return 1`;
async function emailOnce(id: string, kind: "cancel" | "late-payment", send: () => Promise<void>) {
  const marker = `${orderStoragePrefix()}:${kind}-email:${id}`;
  if (await redis(["GET", marker]) === "sent") return true;
  const lock = `${marker}:lock`, owner = randomUUID();
  if (await redis(["SET", lock, owner, "NX", "EX", "120"]) !== "OK") return false;
  try {
    if (await redis(["GET", marker]) === "sent") return true;
    await send();
    await redis(["SET", marker, "sent"]);
    return true;
  } catch { return false; }
  finally { await redis(["EVAL", "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", "1", lock, owner]).catch(() => {}); }
}
export async function notifyCancelledPayment(order: StoreOrder) {
  if (hasSupabaseStorage()) return false;
  return emailOnce(order.id, "late-payment", () => sendCancelledPaymentNotice(order));
}
export async function cancelOrder(id: string, reason: string, action: "cancel" | "check" | "notify") {
  if (hasSupabaseStorage()) throw new Error("Anularea necesită stocarea Redis configurată a magazinului.");
  let order: StoreOrder;
  if (action === "cancel") {
    const cancellation: StoreOrder["cancellation"] = { requestedAt: new Date().toISOString(), reason, actor: "E-Store Control", state: "processing", note: "Se verifică anularea transportului.", refundReviewRequired: false };
    const result = await redis(["EVAL", CANCEL_BEGIN_LUA, "2", orderKey(id), shipmentKey(id), JSON.stringify(cancellation)]);
    if (!Array.isArray(result) || !["started", "existing"].includes(String(result[0]))) throw new Error("Comanda nu poate fi anulată sau nu există.");
    order = JSON.parse(String(result[1])) as StoreOrder;
    if (order.status !== "cancelled" && result[0] === "started") {
      const shipment = await getShipment(id);
      if (shipment?.state === "created" && shipment.awbNumber && shipment.mode === "live") {
        try {
          const status = await samedayAwbStatus(shipment.awbNumber);
          if (status.cancelled) await finish(id, "cancelled", "Anularea AWB-ului este confirmată în Sameday.");
          else if (status.delivered) await finish(id, "review_required", "Coletul figurează livrat. Rezolvă returul și eventuala rambursare; comanda nu este marcată anulată.");
          else {
            // Only the winner of the durable cancellation claim can issue DELETE.
            await cancelSamedayAwb(shipment.awbNumber);
            await finish(id, "cancelled", "Sameday a acceptat anularea AWB-ului.");
          }
        } catch {
          await finish(id, "review_required", "Anularea AWB nu a fost confirmată. Verifică în Sameday și folosește «Verifică anularea». Nu expedia coletul.");
        }
      } else if (shipment?.state === "cancelled") await finish(id, "cancelled", "AWB-ul era deja anulat.");
      else await finish(id, "review_required", "Există o emitere AWB neconfirmată. Verifică referința comenzii în Sameday; nu expedia coletul.");
    }
  } else {
    const current = await getOrder(id);
    if (!current?.cancellation || current.testOrder) throw new Error("Comanda nu are o anulare înregistrată.");
    order = current;
    if (action === "check" && current.status === "cancel_requested") {
      const shipment = await getShipment(id);
      if (shipment?.awbNumber && shipment.mode === "live") {
        try {
          const status = await samedayAwbStatus(shipment.awbNumber);
          if (status.cancelled) await finish(id, "cancelled", "Anularea AWB-ului a fost verificată în Sameday.");
          else await finish(id, "review_required", status.delivered ? "Coletul figurează livrat. Returul și rambursarea necesită verificare separată." : "Sameday nu confirmă încă anularea. Rezolvă anularea direct în eAWB, apoi verifică din nou aici.");
        } catch { await finish(id, "review_required", "Statusul Sameday nu poate fi citit momentan. Reîncearcă verificarea."); }
      }
    }
  }
  const fresh = await getOrder(id);
  if (!fresh) throw new Error("Comanda nu poate fi recitită.");
  let notificationPending = false;
  if (fresh.status === "cancelled" && !fresh.cancellation?.emailSentAt) {
    const sent = await emailOnce(id, "cancel", () => sendCancellationConfirmation(fresh));
    if (sent) await redis(["EVAL", markEmail, "1", orderKey(id), new Date().toISOString()]);
    else notificationPending = true;
  }
  const final = await getOrder(id);
  return { orderId: id, status: final?.status, cancellation: final?.cancellation, notificationPending };
}
