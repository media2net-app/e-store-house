import type { Product } from './products';
export type BedMeasurements = { mattressWidth: string; mattressLength: string; duvetWidth: string; duvetLength: string; pillowWidth: string; pillowLength: string };
const sizes = (text: string) => [...text.matchAll(/(\d{2,3})\s*[×x]\s*(\d{2,3})/gi)].map(m => [Number(m[1]),Number(m[2])].sort((a,b)=>a-b).join('x'));
const key = (a:string,b:string) => [Number(a),Number(b)].sort((a,b)=>a-b).join('x');
/** Only match dimensions explicitly associated with the named bedding component. */
export function matchingBedding(products: Product[], values: BedMeasurements) {
  const duvet = key(values.duvetWidth, values.duvetLength), pillow = key(values.pillowWidth, values.pillowLength), mattress=key(values.mattressWidth,values.mattressLength);
  return products.filter(p => p.categoryPath?.startsWith('lenjerii-de-pat') && p.inStock !== false).flatMap(p => {
    const choices = p.variants?.length ? p.variants.filter(v=>v.inStock!==false).map(v=>({label:v.name,text:v.contents,variantId:v.id})) : [{label:'Varianta prezentată',text:p.description??'',variantId:p.id}];
    return choices.filter(choice=>{
      const lines=choice.text.split(/[\n;]+/);
      const duvetLines=lines.filter(l=>/pilot/i.test(l) && !/pern|saltea|cear[sș]/i.test(l));
      const pillowLines=lines.filter(l=>/pern/i.test(l) && !/pilot|saltea|cear[sș]/i.test(l));
      const fittedLines=lines.filter(l=>/saltea|elastic/i.test(l));
      return duvetLines.some(l=>sizes(l).includes(duvet)) && pillowLines.some(l=>sizes(l).includes(pillow)) && (!fittedLines.length || fittedLines.some(l=>sizes(l).includes(mattress)));
    }).map(choice=>({product:p,label:choice.label,variantId:choice.variantId}));
  });
}
