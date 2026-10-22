import { hasSupabaseStorage } from "./supabase-orders";
import { orderStorageCommand, orderStoragePrefix, type WithdrawalRequest, type ComplaintRequest } from "./orders";
import { sendWithdrawalReceipt, sendComplaintReceipt } from "./order-email";
export type RequestKind = "withdrawal" | "complaint";
const marker = (kind: RequestKind, id: string) => `${orderStoragePrefix()}:${kind}-email:${id}`;
export async function requestNotification(kind: RequestKind, request: WithdrawalRequest | ComplaintRequest) {
  if (!hasSupabaseStorage() && await orderStorageCommand(["GET", marker(kind, request.id)]) === "1") return;
  if (kind === "withdrawal") await sendWithdrawalReceipt(request as WithdrawalRequest);
  else await sendComplaintReceipt(request as ComplaintRequest);
  if (!hasSupabaseStorage()) await orderStorageCommand(["SET", marker(kind, request.id), "1", "EX", String(7 * 365 * 86400)]);
}
