import type { ComplaintRequest, StoreOrder, WithdrawalRequest } from "./orders";
import { store } from "./store-info";
import { formatLeiCents } from "./money";
import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { shippingCarrierLabels } from "./shipping";

// Store-specific non-secret overrides preserve legacy project mail configuration.
function smtpConfiguration() {
  return {
    host: process.env.STORE_SMTP_HOST || process.env.SMTP_HOST,
    port: Number(process.env.STORE_SMTP_PORT || process.env.SMTP_PORT),
    secure: (process.env.STORE_SMTP_SECURE || process.env.SMTP_SECURE) === "true",
    user: process.env.STORE_SMTP_USER || process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.STORE_SMTP_FROM || process.env.SMTP_FROM,
  };
}

function smtpReady(config: ReturnType<typeof smtpConfiguration>) {
  return !!config.host && Number.isInteger(config.port) && config.port > 0 && config.port <= 65535
    && !!config.user && !!config.pass && !!config.from;
}

export function hasTransactionalEmail() {
  return smtpReady(smtpConfiguration()) || !!process.env.RESEND_API_KEY && !!process.env.STORE_MAIL_FROM;
}

export async function verifySmtpConnection() {
  const config = smtpConfiguration();
  if (!smtpReady(config)) throw new Error("SMTP nu este configurat.");
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure, requireTLS: !config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  try {
    await transport.verify();
  } finally {
    transport.close();
  }
}

export async function sendPreviewEmailTest() {
  const id = randomUUID();
  await send(
    "orders@estorehouse.ro",
    `TEST integrare email E-Store House — ${id}`,
    `Acesta este un test al emailurilor din Preview. Nu există comandă, plată sau livrare.\n\nID test: ${id}`,
    `preview-email-test-${id}`,
  );
}

function merchantInbox() {
  return process.env.STORE_ORDER_NOTIFICATION_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || "orders@estorehouse.ro";
}

async function send(to: string, subject: string, body: string, idempotencyKey: string) {
  const config = smtpConfiguration();
  if (smtpReady(config)) {
    const transport = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure, requireTLS: !config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    try {
      await transport.sendMail({ from: config.from, to, subject, text: body,
        headers: { "X-Estore-Message": idempotencyKey } });
    } finally {
      transport.close();
    }
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.STORE_MAIL_FROM;
  if (!apiKey || !from) throw new Error("E-mailul tranzacțional nu este configurat.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], subject, text: body }),
  });
  if (!response.ok) throw new Error("E-mailul de confirmare nu a putut fi trimis.");
}

export async function sendPaymentConfirmation(order: StoreOrder) {
  const testLabel = order.testOrder ? "TEST INTEGRARE — NU EXPEDIAȚI\n\n" : "";
  const lines = order.items.map((item) =>
    `${item.quantity} × ${item.name}: ${formatLeiCents(item.quantity * item.unitPriceCents)} lei`,
  ).join("\n");
  const total = formatLeiCents(order.totalCents);
  const carrier = order.shippingCarrier ? `${shippingCarrierLabels[order.shippingCarrier]}${order.shippingMethod === "easybox" ? " easybox" : " — domiciliu"}` : "de confirmat";
  const lockerDetails = order.shippingLocker ? `\nEasybox: ${order.shippingLocker.name} (ID ${order.shippingLocker.id}), ${order.shippingLocker.address}, ${order.shippingLocker.city}, ${order.shippingLocker.county}` : "";
  const base = process.env.STORE_PUBLIC_URL;
  const customerText = `${testLabel}Bună ziua, ${order.customer.firstName},\n\nPlata pentru comanda ${order.id} a fost confirmată.\n\n${lines}\nCurier ales: ${carrier}${lockerDetails}\nTransport: ${formatLeiCents(order.shippingCents)} lei\nTotal: ${total} lei\n${store.taxNotice ?? ""}\nTermen estimat de livrare: ${store.deliveryEstimate ?? "de comunicat"}\n\nVom verifica tranzacția în EuPlătesc înainte de expediere. Vă vom contacta dacă sunt necesare clarificări.\n\nLivrare și retur: ${base}/livrare-retur\nRetragere online: ${base}/retragere\nGaranția legală: ${base}/garantie-legala\nTermeni și condiții: ${base}/termeni-si-conditii\n\n${store.name}, CUI ${store.cui}, ${store.registration}\n${store.address}\nContact: ${store.email}\n\nE-Store House`;
  const merchantText = `${testLabel}Comandă plătită ${order.id}\n\n${lines}\nReducere: ${formatLeiCents(order.discountCents)} lei\nCurier ales: ${carrier}${lockerDetails}\nTransport: ${formatLeiCents(order.shippingCents)} lei\nTotal: ${total} lei\n\nClient: ${order.customer.firstName} ${order.customer.lastName}\nE-mail: ${order.customer.email}\nTelefon: ${order.customer.phone}\nAdresă livrare: ${order.customer.address}, ${order.customer.city}, ${order.customer.county}, ${order.customer.postalCode}\nFacturare: ${order.customer.billingName}, ${order.customer.billingAddress}, ${order.customer.billingCity}, ${order.customer.billingCounty}, ${order.customer.billingPostalCode}${order.customer.billingCompany ? `\nFirmă: ${order.customer.billingCompany}` : ""}${order.customer.billingCui ? `\nCUI: ${order.customer.billingCui}` : ""}\n\n${order.testOrder ? "Aceasta este o tranzacție de test. Nu expediați nimic." : "Verifică statusul verde „Livrare permisă” în EuPlătesc înainte de expediere."}\nComenzi: ${base}/admin/comenzi`;
  await Promise.all([
    send(order.customer.email, `Confirmare plată E-Store House — ${order.id}`, customerText, `customer-paid-${order.id}`),
    send(merchantInbox(), `Comandă plătită ${order.id}`, merchantText, `merchant-paid-${order.id}`),
  ]);
}

export async function sendCodConfirmation(order: StoreOrder) {
  if (order.paymentMethod !== "cod" || order.status !== "pending_cod") throw new Error("Comanda nu este ramburs.");
  const lines = order.items.map((item) => `${item.quantity} × ${item.name}: ${formatLeiCents(item.quantity * item.unitPriceCents)} lei`).join("\n");
  const total = formatLeiCents(order.totalCents);
  const base = process.env.STORE_PUBLIC_URL;
  const summary = `${lines}\nReducere: ${formatLeiCents(order.discountCents)} lei\nTransport Sameday la domiciliu: ${formatLeiCents(order.shippingCents)} lei\nTotal de achitat la curier: ${total} lei\nPlată: ramburs la domiciliu\nTermen estimat: ${store.deliveryEstimate ?? "de comunicat"}`;
  const customerText = `Bună ziua, ${order.customer.firstName},\n\nAm înregistrat comanda ${order.id}, cu plata ramburs la domiciliu. Plata nu se face online; suma de ${total} lei se achită curierului la livrare.\n\n${summary}\n${store.taxNotice ?? ""}\n\nAdresă livrare: ${order.customer.address}, ${order.customer.city}, ${order.customer.county}, ${order.customer.postalCode}\n\nStatus comandă: ${base}/plata/rezultat?order=${order.id}\nLivrare și retur: ${base}/livrare-retur\nRetragere: ${base}/retragere\nGaranția legală: ${base}/garantie-legala\nTermeni: ${base}/termeni-si-conditii\n\n${store.name}, CUI ${store.cui}, ${store.registration}\n${store.address}\nContact: ${store.email}`;
  const merchantText = `Comandă RAMBURS ${order.id} — neîncasată\n\n${summary}\n\nClient: ${order.customer.firstName} ${order.customer.lastName}\nEmail: ${order.customer.email}\nTelefon: ${order.customer.phone}\nAdresă: ${order.customer.address}, ${order.customer.city}, ${order.customer.county}, ${order.customer.postalCode}\nFacturare: ${order.customer.billingName}, ${order.customer.billingAddress}, ${order.customer.billingCity}, ${order.customer.billingCounty}, ${order.customer.billingPostalCode}${order.customer.billingCompany ? `\nFirmă: ${order.customer.billingCompany}` : ""}${order.customer.billingCui ? `\nCUI: ${order.customer.billingCui}` : ""}\n\nLa emiterea AWB, Sameday trebuie să încaseze ${total} lei. Verifică datele comenzii și coletul înainte de expediere.\nComenzi: ${base}/admin/comenzi`;
  await Promise.all([
    send(order.customer.email, `Confirmare comandă ramburs E-Store House — ${order.id}`, customerText, `customer-cod-${order.id}`),
    send(merchantInbox(), `Comandă RAMBURS ${order.id}`, merchantText, `merchant-cod-${order.id}`),
  ]);
}

export async function sendWithdrawalReceipt(request: WithdrawalRequest) {
  const submitted = new Date(request.submittedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" });
  const text = `Cererea de retragere a fost primită la ${submitted}.\n\nNumăr cerere: ${request.id}\nComandă / data comenzii: ${request.orderId || "nespecificată"}\nData primirii produselor: ${request.receivedAt || "nespecificată"}\nNume: ${request.name}\nE-mail: ${request.email}\nProduse: ${request.products}\nAdresă: ${request.address}\n\nVom analiza cererea și îți vom comunica pașii pentru retur. Aceasta este confirmarea primirii declarației de retragere, nu confirmarea rambursării.\n\nE-Store House`;
  await Promise.all([
    send(request.email, `Confirmare primire retragere — ${request.id}`, text, `withdrawal-customer-${request.id}`),
    send(merchantInbox(), `Cerere retragere ${request.orderId}`, text, `withdrawal-merchant-${request.id}`),
  ]);
}

export async function sendComplaintReceipt(request: ComplaintRequest) {
  const submitted = new Date(request.submittedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" });
  const text = `Reclamația a fost primită la ${submitted}.\n\nNumăr: ${request.id}\nComandă: ${request.orderId || "nespecificată"}\nNume: ${request.name}\nE-mail: ${request.email}\nTelefon: ${request.phone || "nespecificat"}\nProblema descrisă:\n${request.issue}\n\nE-Store House`;
  await Promise.all([
    send(request.email, `Confirmare primire reclamație — ${request.id}`, text, `complaint-customer-${request.id}`),
    send(merchantInbox(), `Reclamație primită — ${request.id}`, text, `complaint-merchant-${request.id}`),
  ]);
}

export async function sendCancellationConfirmation(order: StoreOrder) {
  if (order.status !== "cancelled" || !order.cancellation) throw new Error("Anularea nu este confirmată.");
  const payment = order.cancellation.refundReviewRequired
    ? "Plata cu cardul necesită verificarea separată a rambursării. Acest email nu confirmă restituirea banilor."
    : order.paymentMethod === "cod" ? "Comanda nu mai urmează să fie încasată ramburs la livrare." : "Nu iniția o nouă plată pentru această comandă. Dacă ai fost debitat, contactează magazinul pentru verificarea rambursării.";
  const body = `Comanda ${order.id} a fost anulată.\n\nMotiv: ${order.cancellation.reason}\nTotal comandă: ${formatLeiCents(order.totalCents)} lei\n${payment}\n\nContact: ${store.email}\nE-Store House`;
  await Promise.all([
    send(order.customer.email, `Comandă anulată E-Store House — ${order.id}`, body, `customer-cancel-${order.id}`),
    send(merchantInbox(), `Comandă ANULATĂ ${order.id}`, `${body}\n\nNu expedia comanda. ${order.cancellation.refundReviewRequired ? "Verifică și efectuează separat rambursarea plății cu cardul." : ""}`, `merchant-cancel-${order.id}`),
  ]);
}

export async function sendCancelledPaymentNotice(order: StoreOrder) {
  const body = `Pentru comanda ${order.id}, aflată în anulare/anulată, a fost primită o confirmare de plată cu cardul de ${formatLeiCents(order.totalCents)} lei.\n\nComanda nu este reactivată pentru expediere. Rambursarea trebuie verificată și procesată separat; acest mesaj nu confirmă restituirea banilor.\n\nContact: ${store.email}`;
  await Promise.all([
    send(order.customer.email, `Verificare plată pentru comanda anulată — ${order.id}`, body, `customer-cancel-payment-${order.id}`),
    send(merchantInbox(), `ATENȚIE: plată la o comandă anulată ${order.id}`, body, `merchant-cancel-payment-${order.id}`),
  ]);
}
