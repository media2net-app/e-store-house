import "server-only";

// Dedicated read-only integration. No store admin or courier credentials leave the store.
export async function isStoreControl(request: Request) {
  try {
    const publicKey = process.env.STORE_CONTROL_PUBLIC_KEY;
    const timestamp = request.headers.get("x-estore-timestamp") || "";
    const nonce = request.headers.get("x-estore-nonce") || "";
    const signature = request.headers.get("x-estore-signature") || "";
    if (!publicKey || request.method !== "GET" || !/^\d{13}$/.test(timestamp)
        || Math.abs(Date.now() - Number(timestamp)) > 60_000
        || !/^[a-f0-9-]{36}$/.test(nonce) || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return false;
    const url = new URL(request.url);
    const key = await crypto.subtle.importKey("spki", Buffer.from(publicKey, "base64"), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, Buffer.from(signature, "base64"),
      new TextEncoder().encode(`GET\n${url.pathname}${url.search}\n${timestamp}\n${nonce}`));
  } catch { return false; }
}
