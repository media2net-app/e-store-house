import { allProducts } from "./products";
/** Add only individually verified manufacturing evidence, never supplier location. */
export const manufacturingEvidence: { productId: number; country: 'RO'; locality: string; source: string }[] = [];
export const romanianProducts = allProducts.filter(p => manufacturingEvidence.some(e => e.productId === p.id && e.country === 'RO' && e.locality === 'Pucioasa' && e.source));
export const romanianHeroCopy = {
  title: 'Textile fabricate în România.', subtitle: 'Din Pucioasa, pentru casa ta.',
  description: 'Descoperă lenjerii, pilote și textile realizate la Pucioasa, alese pentru confortul de acasă.',
  action: 'Descoperă colecția românească',
};
