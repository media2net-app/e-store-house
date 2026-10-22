import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
export function isStoreAdmin(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  return !!configured && !!supplied && timingSafeEqual(createHash("sha256").update(configured).digest(), createHash("sha256").update(supplied).digest());
}
