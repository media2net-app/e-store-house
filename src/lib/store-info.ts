import { shippingExplanation } from "./shipping-information";
const businessAddress = "Str. Târgului nr. 8, sat Dragodana, com. Dragodana, jud. Dâmbovița";

export const store = {
  name: "E-STORE HOUSE S.R.L.",
  cui: "51182047",
  registration: "J2025004912009",
  address: businessAddress,
  email: process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL || "contact@estorehouse.ro",
  phone: process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE || null,
  // The owner confirmed on 22 October 2026 that return parcels go to the registered office.
  returnAddress: process.env.NEXT_PUBLIC_STORE_RETURN_ADDRESS || businessAddress,
  shippingCost: shippingExplanation,
  deliveryEstimate: process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE || null,
  taxNotice: process.env.NEXT_PUBLIC_STORE_VAT_STATUS === "included"
    ? "Prețurile afișate includ TVA."
    : process.env.NEXT_PUBLIC_STORE_VAT_STATUS === "not_registered"
      ? "Prețuri finale. Societatea nu este înregistrată în scopuri de TVA."
      : null,
};
