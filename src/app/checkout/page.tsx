import CheckoutForm from "./CheckoutForm";

export default function CheckoutPage() {
  const raw = process.env.STORE_SHIPPING_RON;
  const shipping = raw === undefined ? NaN : Number(raw);
  const shippingRon = Number.isFinite(shipping) && shipping >= 0 ? shipping : null;
  const enabled = process.env.STORE_CHECKOUT_ENABLED === "true" && shippingRon !== null;
  return <CheckoutForm shippingRon={shippingRon} enabled={enabled} />;
}
