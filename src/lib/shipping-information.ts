import { CUSTOMER_SHIPPING_RON } from './shipping';
import { FREE_SHIPPING_CENTS } from './cart-offers';
export const freeShippingAmount = FREE_SHIPPING_CENTS / 100;
export const shippingEstimate = `Livrare la adresă: ${CUSTOMER_SHIPPING_RON.home} lei · Easybox: ${CUSTOMER_SHIPPING_RON.easybox} lei (colete eligibile)`;
export const shippingExplanation = `${shippingEstimate}. Transport gratuit de la ${freeShippingAmount} lei după reduceri. Metoda de livrare și totalul final sunt confirmate înainte de trimiterea comenzii.`;
export const dispatchExplanation = 'Expedierea se confirmă după verificarea disponibilității; comenzile cu cardul se expediază după confirmarea plății.';
