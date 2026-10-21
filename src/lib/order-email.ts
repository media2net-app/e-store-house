import type { ComplaintRequest, StoreOrder, WithdrawalRequest } from "./orders";
import { store } from "./store-info";
import { formatLeiCents } from "./money";
import nodemailer from "nodemailer";

export function hasTransactionalEmail() {
  const port = Number(process.env.SMTP_PORT);
  const smtpReady = !!process.env.SMTP_HOST && Number.isInteger(port) && port > 0 && port <= 65535
    && !!process.env.SMTP_USER && !!process.env.SMTP_PASS && !!process.env.SMTP_FROM;
  return smtpReady || !!process.env.RESEND_API_KEY && !!process.env.STORE_MAIL_FROM;
}

function merchantInbox() {
  return process.env.ORDER_NOTIFICATION_EMAIL || "orders@estorehouse.ro";
}

async function send(to: string, subject: string, body: string, idempotencyKey: string) {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER
      && process.env.SMTP_PASS && process.env.SMTP_FROM) {
    const port = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port SMTP invalid.");
    const secure = process.env.SMTP_SECURE === "true";
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port, secure, requireTLS: !secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text: body,
      headers: { "X-Estore-Message": idempotencyKey } });
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
  const base = process.env.STORE_PUBLIC_URL;
  const customerText = `${testLabel}Bună ziua, ${order.customer.firstName},\n\nPlata pentru comanda ${order.id} a fost confirmată.\n\n${lines}\nTransport: ${formatLeiCents(order.shippingCents)} lei\nTotal: ${total} lei\n${store.taxNotice ?? ""}\nTermen estimat de livrare: ${store.deliveryEstimate ?? "de comunicat"}\n\nVom verifica tranzacția în EuPlătesc înainte de expediere. Vă vom contacta dacă sunt necesare clarificări.\n\nLivrare și retur: ${base}/livrare-retur\nRetragere online: ${base}/retragere\nGaranția legală: ${base}/garantie-legala\nTermeni și condiții: ${base}/termeni-si-conditii\n\n${store.name}, CUI ${store.cui}, ${store.registration}\n${store.address}\nContact: ${store.email}\n\nE-Store House`;
  const merchantText = `${testLabel}Comandă plătită ${order.id}\n\n${lines}\nReducere: ${formatLeiCents(order.discountCents)} lei\nTransport: ${formatLeiCents(order.shippingCents)} lei\nTotal: ${total} lei\n\nClient: ${order.customer.firstName} ${order.customer.lastName}\nE-mail: ${order.customer.email}\nTelefon: ${order.customer.phone}\nAdresă livrare: ${order.customer.address}, ${order.customer.city}, ${order.customer.county}, ${order.customer.postalCode}\nFacturare: ${order.customer.billingName}, ${order.customer.billingAddress}, ${order.customer.billingCity}, ${order.customer.billingCounty}, ${order.customer.billingPostalCode}${order.customer.billingCompany ? `\nFirmă: ${order.customer.billingCompany}` : ""}${order.customer.billingCui ? `\nCUI: ${order.customer.billingCui}` : ""}\n\n${order.testOrder ? "Aceasta este o tranzacție de test. Nu expediați nimic." : "Verifică statusul verde „Livrare permisă” în EuPlătesc înainte de expediere."}\nComenzi: ${base}/admin/comenzi`;
  await Promise.all([
    send(order.customer.email, `Confirmare plată E-Store House — ${order.id}`, customerText, `customer-paid-${order.id}`),
    send(merchantInbox(), `Comandă plătită ${order.id}`, merchantText, `merchant-paid-${order.id}`),
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
