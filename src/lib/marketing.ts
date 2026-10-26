export type PrivacyChoice = { analytics: boolean; marketing: boolean; savedAt: number };
export type MarketingItem = { item_id: string; item_name: string; price: number; quantity: number };
export const privacyKey = 'estore-privacy-v1';
export const analyticsId = process.env.NEXT_PUBLIC_GA4_ID || '';
export const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '';
export const marketingConfigured = /^G-[A-Z0-9]+$/.test(analyticsId) || /^[A-Z0-9]{10,40}$/i.test(tiktokId);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ttq?: { track: (name: string, parameters?: object) => void; page: () => void; [key: string]: unknown };
    TiktokAnalyticsObject?: string;
  }
}
export function privacyChoice(): PrivacyChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(privacyKey) || 'null');
    return value && typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean'
      && Number.isFinite(value.savedAt) && value.savedAt <= Date.now() && Date.now() - value.savedAt < 180 * 86400000 ? value : null;
  } catch { return null; }
}
export function savePrivacy(analytics: boolean, marketing: boolean) {
  const value = { analytics, marketing, savedAt: Date.now() };
  try { localStorage.setItem(privacyKey, JSON.stringify(value)); } catch { /* Denied if preferences cannot persist. */ }
  if (!analytics && window.gtag) window.gtag('consent', 'update', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  if (!marketing && typeof window.ttq?.revokeConsent === 'function') window.ttq.revokeConsent();
  window.dispatchEvent(new Event('estore-privacy-change'));
}
let googleStarted = false, tiktokStarted = false;
const once = new Set<string>();
export function startMarketing() {
  const choice = privacyChoice();
  if (choice?.analytics && /^G-[A-Z0-9]+$/.test(analyticsId) && !googleStarted) {
    googleStarted = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    const campaign: Record<string,string> = {};
    const query = new URLSearchParams(window.location.search);
    for (const [param, field] of [['utm_source','campaign_source'],['utm_medium','campaign_medium'],['utm_campaign','campaign_name'],['utm_content','campaign_content']]) {
      const value=query.get(param); if(value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) campaign[field]=value;
    }
    window.gtag('config', analyticsId, { ...campaign, send_page_view: false, page_location: window.location.origin + window.location.pathname, page_referrer: document.referrer ? new URL(document.referrer).origin : '', allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script'); script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`; document.head.appendChild(script);
  }
  if (choice?.marketing && !new URLSearchParams(window.location.search).has('q') && /^[A-Z0-9]{10,40}$/i.test(tiktokId) && !tiktokStarted) {
    tiktokStarted = true;
    // Standard Pixel queue, installed only after explicit marketing consent.
    const queue: unknown[][] = [];
    const ttq = queue as unknown as NonNullable<Window['ttq']>;
    const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    const defer = (target: unknown[][] & Record<string, unknown>, method: string) => { target[method] = (...args: unknown[]) => target.push([method, ...args]); };
    ttq.methods = methods; ttq.setAndDefer = defer;
    for (const method of methods) defer(queue as unknown[][] & Record<string, unknown>, method);
    ttq.instance = (id: string) => {
      const target = (ttq._i as Record<string, unknown[][]>)[id] || [];
      for(const method of methods) defer(target as unknown[][] & Record<string, unknown>, method);
      return target;
    };
    const instance = [] as unknown as { _u: string }; instance._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = { [tiktokId]: instance };
    ttq._t = { [tiktokId]: Date.now() }; ttq._o = { [tiktokId]: {} };
    window.TiktokAnalyticsObject = 'ttq'; window.ttq = ttq;
    const script = document.createElement('script'); script.async = true;
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${tiktokId}&lib=ttq`; document.head.appendChild(script);
  }
}
/** Send product data only. Never include names, email, address, phone or raw search text. */
export function trackCommerce(event: string, parameters: Record<string, unknown> = {}, eventKey?: string) {
  if (typeof window === 'undefined') return false;
  const consent = privacyChoice();
  if (!consent?.analytics && !consent?.marketing) return false;
  startMarketing();
  const key = eventKey ? `${event}:${eventKey}` : undefined;
  let delivered = false;
  if (consent.analytics && googleStarted && (!key || !once.has('ga:'+key))) {
    window.gtag?.('event', event, { ...parameters, page_location: window.location.origin + window.location.pathname });
    if(key) once.add('ga:'+key); delivered = true;
  }
  const pixelEvents: Record<string, string> = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' };
  if (consent.marketing && tiktokStarted && pixelEvents[event] && (!key || !once.has('tt:'+key))) {
    const items = (parameters.items || []) as MarketingItem[];
    window.ttq?.track(pixelEvents[event], { content_type: 'product', content_ids: items.map(i => i.item_id),
      contents: items.map(i => ({ content_id: i.item_id, price: i.price, quantity: i.quantity })),
      currency: 'RON', value: parameters.value, ...(parameters.transaction_id ? { order_id: parameters.transaction_id } : {}) });
    if(key) once.add('tt:'+key); delivered = true;
  }
  return delivered;
}
export function trackPage(path: string) {
  const choice = privacyChoice(); startMarketing();
  if (choice?.analytics && googleStarted) window.gtag?.('event', 'page_view', {
    page_location: `${window.location.origin}${path}`, page_title: document.title,
    page_referrer: document.referrer ? new URL(document.referrer).origin : '',
  });
  // Do not expose order IDs or free-text search queries via automatic Pixel page events.
  if (choice?.marketing && tiktokStarted && !window.location.search) window.ttq?.page();
}
export function rememberMarketingOrder(id: string, items: MarketingItem[]) {
  const consent = privacyChoice(); if (!consent?.analytics && !consent?.marketing) return;
  try { sessionStorage.setItem(`estore-marketing-order:${id}`, JSON.stringify(items)); } catch { /* Tracking never blocks checkout. */ }
}
export function trackConfirmedOrder(order: { id: string; status: string; paymentMethod: string; totalCents: number; shippingCents: number }) {
  const consent = privacyChoice(); if (!marketingConfigured || !consent?.analytics && !consent?.marketing) return;
  if (!['paid_review', 'pending_cod'].includes(order.status)) return;
  const event = order.paymentMethod === 'cod' ? 'cod_order_placed' : 'purchase';
  const key = `estore-conversion:${order.id}:${event}`;
  try {
    if (localStorage.getItem(key)) return;
    const items = JSON.parse(sessionStorage.getItem(`estore-marketing-order:${order.id}`) || 'null');
    if (!Array.isArray(items)) return; // This browser must have initiated this checkout.
    const delivered = trackCommerce(event, { transaction_id: order.id, currency: 'RON', value: (order.totalCents - order.shippingCents) / 100,
      shipping: order.shippingCents / 100, payment_method: order.paymentMethod, items }, order.id);
    if (!delivered) return;
    localStorage.setItem(key, String(Date.now())); sessionStorage.removeItem(`estore-marketing-order:${order.id}`);
  } catch { /* Storage restrictions must never affect the order. */ }
}
