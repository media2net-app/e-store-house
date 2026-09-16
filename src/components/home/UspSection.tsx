const values = [
  { title: "Texturi de descoperit", text: "Bumbac, percale și ranforce. Alege materialul care îți transformă odihna într-un ritual." },
  { title: "Spațiul tău, stilul tău", text: "De la nuanțe liniștite la imprimeuri expresive, fiecare dormitor are propria poveste." },
  { title: "Ales pentru tine", text: "Dimensiuni și variante explicate clar, pentru a găsi setul potrivit casei tale." },
];
export default function UspSection() {
  return <section className="brand-story" id="poveste"><div className="story-intro"><p className="eyebrow">FILOSOFIA NOASTRĂ</p><h2>Luxul discret al<br /><em>lucrurilor simple.</em></h2></div><div className="story-values">{values.map((value, index) => <article key={value.title}><span>0{index + 1}</span><div><h3>{value.title}</h3><p>{value.text}</p></div></article>)}</div></section>;
}
