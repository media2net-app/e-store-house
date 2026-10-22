/** Navigation groupings only: supplier category hierarchy remains unchanged. */
export const navigationGroups = [
  { slug: 'lenjerii', name: 'Lenjerii de pat', paths: ['lenjerii-de-pat'] },
  { slug: 'pilote-perne', name: 'Pilote și perne', paths: ['pilote', 'perne'] },
  { slug: 'baie', name: 'Prosoape și halate', paths: ['articole-baie'] },
  { slug: 'huse-protectii', name: 'Huse și protecții', paths: ['huse-de-pat', 'protectii-saltea'] },
  { slug: 'cuverturi-paturi', name: 'Cuverturi și pături', paths: ['cuverturi', 'paturi'] },
  { slug: 'saltele', name: 'Saltele și toppere', paths: ['saltele-si-toppere'] },
];
export const groupHref = (slug: string) => `/colectii/${slug}`;
