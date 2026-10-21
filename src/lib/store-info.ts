export const store = {
  name: "E-STORE HOUSE S.R.L.",
  cui: "51182047",
  registration: "J2025004912009",
  address: "Str. Târgului nr. 8, sat Dragodana, com. Dragodana, jud. Dâmbovița",
  email: process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL || "contact@estorehouse.ro",
  phone: process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE || null,
  returnAddress: process.env.NEXT_PUBLIC_STORE_RETURN_ADDRESS || null,
  shippingCost: process.env.NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION || null,
  deliveryEstimate: process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE || null,
  taxNotice: process.env.NEXT_PUBLIC_STORE_VAT_STATUS === "included"
    ? "Prețurile afișate includ TVA."
    : process.env.NEXT_PUBLIC_STORE_VAT_STATUS === "not_registered"
      ? "Prețuri finale. Societatea nu este înregistrată în scopuri de TVA."
      : null,
};
