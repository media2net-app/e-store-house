import CheckoutForm from "./CheckoutForm";

export default function CheckoutPage() {
  const raw = process.env.STORE_SHIPPING_RON;
  const shipping = raw === undefined ? NaN : Number(raw);
  const shippingRon = Number.isInteger(shipping) && shipping >= 0 ? shipping : null;
  const enabled = process.env.STORE_CHECKOUT_ENABLED === "true" && shippingRon !== null
    && ["included", "not_registered"].includes(process.env.NEXT_PUBLIC_STORE_VAT_STATUS || "")
    && !!process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE?.trim();
  return <CheckoutForm shippingRon={shippingRon} enabled={enabled} />;
}
