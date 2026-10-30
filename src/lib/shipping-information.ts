import { CUSTOMER_SHIPPING_RON } from './shipping';
import { FREE_SHIPPING_CENTS } from './cart-offers';
export const freeShippingAmount = FREE_SHIPPING_CENTS / 100;
export const shippingEstimate = `Livrare la adresă: de la ${CUSTOMER_SHIPPING_RON.home} lei · Easybox: ${CUSTOMER_SHIPPING_RON.easybox} lei (colete eligibile)`;
export const shippingExplanation = `${shippingEstimate}. Pentru FAN Courier, eventualele suplimente de greutate, dimensiuni, localitate și ramburs sunt calculate din tariful curierului și afișate înainte de comandă. Transportul standard este gratuit de la ${freeShippingAmount} lei după reduceri; suplimentele FAN pot rămâne aplicabile. Metoda de livrare și totalul final sunt confirmate înainte de trimiterea comenzii.`;
export const dispatchExplanation = 'Expedierea se confirmă după verificarea disponibilității; comenzile cu cardul se expediază după confirmarea plății.';
