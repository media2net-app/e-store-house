import Link from 'next/link';

export default function BeddingGuideContent() {
  return <section className="bedding-guide-content" aria-labelledby="bedding-guide-title">
    <p className="eyebrow">GHID DE ALEGERE</p>
    <h2 id="bedding-guide-title">Cum alegi dimensiunile lenjeriei de pat?</h2>
    <p>O lenjerie de pat se alege după fiecare piesă din set: cearșaf, husă de pilotă și fețe de pernă. Măsoară salteaua, inclusiv înălțimea ei, apoi pilota și pernele. În căutarea de mai sus poți combina dimensiunile cu materialul, culoarea și bugetul, fără să completezi toate câmpurile.</p>
    <div className="bedding-guide-columns">
      <article id="cearsaf-simplu-sau-elastic"><h3>Cearșaf simplu sau cu elastic?</h3><p>Cearșaful simplu acoperă salteaua și cade pe laterale. Ai nevoie de material suplimentar pentru înălțimea saltelei și pentru a-l introduce dedesubt. La cearșaful cu elastic, verifică lățimea, lungimea și înălțimea de saltea acceptate de varianta produsului. Dacă folosești un topper, măsoară grosimea totală.</p></article>
      <article id="lenjerie-pat-160x200-180x200"><h3>Lenjerie pentru pat de 160 × 200 sau 180 × 200 cm</h3><p>Dimensiunea patului nu stabilește dimensiunea tuturor pieselor. Pentru o saltea de 160 × 200 cm sau 180 × 200 cm, alege un cearșaf compatibil. Husa de pilotă și fețele de pernă se verifică separat, după pilota și pernele pe care le folosești.</p></article>
      <article id="dimensiuni-pilota-perna"><h3>Husa de pilotă și fețele de pernă</h3><p>O husă de pilotă de 200 × 220 cm nu este aceeași dimensiune cu una de 200 × 230 cm. Alege după eticheta sau măsurătorile pilotei. Pentru perne, verifică dacă setul include fețe de 50 × 70 cm, 70 × 70 cm sau altă dimensiune, precum și numărul de bucăți.</p></article>
    </div>
    <h3>Întrebări despre alegerea lenjeriei</h3>
    <details><summary>Se potrivește un cearșaf simplu pe saltea de 180 × 200 cm?</summary><p>Da, dacă dimensiunile lui oferă suficient material pentru laterale și fixare. De exemplu, un cearșaf de 240 × 260 cm, așezat centrat pe o saltea de 180 × 200 cm, lasă câte 30 cm pe fiecare latură înainte de a acoperi grosimea saltelei. Din acest surplus se scade înălțimea saltelei; restul poate fi introdus dedesubt. Exemplul este orientativ, nu o garanție de potrivire pentru orice saltea.</p></details>
    <details><summary>Ce diferență este între lenjeria de pat din bumbac, Ranforce și Finet?</summary><p>Bumbacul descrie fibra, iar denumiri precum Ranforce sau Finet descriu tipuri de țesătură ori finisaj întâlnite în catalog. Verifică întotdeauna compoziția exactă a produsului: denumirea gamei nu înlocuiește procentele de bumbac și poliester. În pagina fiecărui produs găsești materialul și piesele incluse.</p></details>
    <details><summary>De ce găsesc mai puține lenjerii când aleg mai multe filtre?</summary><p>O variantă disponibilă trebuie să corespundă tuturor alegerilor tale. Dacă dimensiunile se potrivesc, dar prețul acelei variante depășește bugetul ales, ea nu apare. Poți elimina individual o preferință sau reseta selecția. Dimensiunile neprecizate nu sunt tratate ca potriviri.</p></details>
    <nav className="bedding-guide-links" aria-label="Colecții de lenjerii de pat"><Link href="/shop?categorie=lenjerii-de-pat">Toate lenjeriile de pat →</Link><Link href="/shop?categorie=lenjerii-de-pat%2Flenjerii-100-bumbac">Lenjerii de pat din bumbac →</Link><Link href="/shop?categorie=lenjerii-de-pat%2Flenjerii-de-pat-policoton%2Flenjerii-de-pat-finet-6-piese">Lenjerii Finet, 6 piese →</Link></nav>
  </section>;
}
