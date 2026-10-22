# Specificația utilizatorului — nota din 23 octombrie 2026, 01:40

Vreau să reproiectezi și să implementezi designul magazinului meu estorehouse.ro. Lucrează ca un designer senior de e-commerce, specialist UX pentru mobil și developer frontend.

Obiectivul este un magazin foarte bine realizat, distinct, rapid, ușor de folosit și convingător pentru cumpărătorii de textile pentru casă din România. Nu vreau numai o pagină frumoasă: vreau ca vizitatorii să găsească produsul potrivit, să înțeleagă oferta și să cumpere fără dificultate.

Acesta este brief-ul consolidat de webdesign. Înlocuiește instrucțiunile anterioare de design, dar păstrează cerințele tehnice existente privind securitatea, corectitudinea datelor, comenzile, plățile și testarea.

## 1. Începe cu proiectul existent

Inspectează repository-ul, instrucțiunile proiectului, componentele, datele și site-ul actual.

Păstrează funcțiile care lucrează corect. Nu reconstrui aplicația de la zero și nu schimba framework-ul fără o necesitate demonstrată.

Lucrează într-un branch și într-un preview. Nu suprascrie modificările existente și nu publica în producție înainte să revizuim rezultatul.

Nu te opri la recomandări, wireframe-uri sau imagini statice. Implementează designul în proiect și verifică funcționarea lui.

Dacă lipsesc fotografii sau date, folosește materiale existente corecte, notează lipsurile și continuă lucrările independente. Nu inventa caracteristici, recenzii, stocuri sau origine.

## 2. Prioritatea absolută: telefonul

Presupunerea mea comercială este că aproape toți clienții vor folosi mobilul. Tratează acest lucru ca prioritate de proiectare, nu ca statistică deja verificată.

Proiectează întâi la 390 px lățime. Verifică apoi la 360, 430, 768 și 1440 px.

Desktop-ul trebuie să fie bine realizat, dar nu vreau o versiune desktop micșorată pentru telefon.

Pe mobil:

- text lizibil fără zoom;
- butoane ușor de apăsat;
- căutare vizibilă;
- categorii ușor de găsit;
- fotografii clare;
- selectarea simplă a dimensiunilor;
- coș și checkout fără obstacole;
- fără scroll orizontal accidental;
- fără elemente fixe care se suprapun.

## 3. Identitate vizuală

Direcția este „Confort bine ales”: cald, elegant, primitor și practic.

Păstrează numele E-STORE HOUSE și dezvoltă identitatea actuală crem–maro. Produsul trebuie să domine vizual.

Paletă inițială:

- fundal: #FAF7F2;
- suprafețe: #FFFFFF;
- text principal: #2B211B;
- buton principal: #5B3A29 cu text alb;
- suprafață secundară: #EEE7DE;
- borduri: #D8CEC3.

Verifică și ajustează contrastul. Nu folosi text bej foarte deschis pe fundal crem.

Folosește maximum două familii de fonturi, preferabil cele existente dacă sunt potrivite:

- serif discret pentru titlurile importante;
- sans-serif lizibil pentru produse, prețuri, formulare și navigare.

Puncte de pornire:

- text obișnuit și inputuri: 16 px;
- text secundar: aproximativ 14 px;
- titluri mobile: aproximativ 28–32 px;
- butoane principale: aproximativ 48–52 px înălțime;
- zone tactile: cel puțin 44 × 44 CSS px;
- margini laterale mobile: aproximativ 16 px.

Aceste dimensiuni sunt orientative. Nu tăia conținutul și nu bloca adaptarea la text mărit.

Folosește spațiere consecventă, umbre discrete și colțuri moderat rotunjite. Evită aspectul de șablon generic cu prea multe casete, badge-uri și efecte.

## 4. Mesajul principal: România și Pucioasa

Pe prima pagină vreau să fie vizibil imediat:

„Textile fabricate în România.”
„Din Pucioasa, pentru casa ta.”

Primul mesaj trebuie să fie dominant, nu ascuns într-o etichetă minusculă.

Adaugă un steag românesc discret lângă mesaj:

- SVG cu benzile verticale albastru, galben și roșu;
- proporții corecte;
- fără animație;
- fără să colorezi întregul banner în tricolor.

Subtitlu:
„Descoperă lenjerii, pilote și textile realizate la Pucioasa, alese pentru confortul de acasă.”

Buton principal:
„Descoperă colecția românească”

Legătură secundară:
„Vezi toate produsele”

Acest banner promovează colecția românească, nu afirmă că întregul catalog are aceeași origine. Fotografia, produsele promovate și destinația butonului trebuie să corespundă unor produse cu fabricația confirmată.

Mențiunea Pucioasa se aplică produselor realizate acolo, nu doar expediate de un furnizor din localitate.

Păstrează colecțiile internaționale accesibile și identificabile. Nu atribui automat aceeași origine tuturor produselor.

Folosește text HTML, nu text încorporat în fotografie.

## 5. Prima pagină — această ordine

### A. Header compact

Logo lizibil, meniu și coș cu număr de articole.

Sub header, căutare vizibilă:
„Caută lenjerii, dimensiuni, materiale…”

Meniul trebuie să permită acces direct la categorii. Nu obliga utilizatorul să deschidă întâi un meniu generic „Magazin”, apoi alte meniuri pentru a vedea ce vindem.

Header-ul poate deveni compact la scroll. Nu păstra permanent mai multe rânduri care consumă ecranul.

### B. Bannerul România–Pucioasa

Folosește mesajele din secțiunea precedentă și o singură fotografie bună.

Fotografia trebuie să arate textilele, fără să creeze impresia că mobilierul sau decorul sunt incluse.

Fără carusel automat, video autoplay sau banner care ocupă întregul ecran.

Adaptează imaginea pentru mobil. Păstrează titlul lizibil și categoriile aproape de începutul paginii. Nu încerca să înghesui totul deasupra primei derulări prin micșorarea textului.

### C. Categorii vizuale

Titlu:
„Ce cauți pentru casa ta?”

Grilă mobilă cu două coloane:

- Lenjerii de pat;
- Pilote și perne;
- Prosoape și halate;
- Huse și protecții;
- Cuverturi și pături;
- Saltele și toppere.

Fiecare categorie are imagine relevantă și nume clar.

Acestea pot fi grupări de navigare către categoriile existente. Nu modifica arbitrar structura datelor.

Adaugă „Vezi toate categoriile”, cu acces la HoReCa, bucătărie și restul catalogului.

Nu ascunde toate categoriile într-un carusel orizontal.

### D. Produse recomandate

Titlu:
„Selecția noastră pentru acasă”

Arată inițial 4–6 produse variate, în două coloane, apoi acces la selecția completă.

Nu afișa multe culori ale aceluiași model la început.

Folosește eticheta „Cele mai vândute” numai dacă există date reale de vânzare.

### E. Ajutor pentru alegere

Bloc compact:
„Nu știi ce dimensiune să alegi?”
Buton:
„Găsește setul potrivit”

Ghidul trebuie să ajute alegerea folosind dimensiunile saltelei, pilotei și pernelor. Nu cere cont sau e-mail pentru a vedea rezultatul.

### F. Inspirație care permite cumpărarea

Secțiune:
„Completează confortul”

O imagine coerentă și 2–3 produse compatibile, fiecare cu preț și variantă explicită.

Nu adăuga automat produse în coș. Nu prezenta o combinație ca pachet dacă produsele se vând separat.

### G. Încredere

Recenzii autentice, fotografii reale disponibile și informații clare despre livrare și asistență.

Dacă nu există recenzii, nu inventa și nu simula rating-uri.

O bandă compactă cu acces la „Livrare”, „Retur” și „Ai nevoie de ajutor?” poate apărea mai sus, fără blocuri promoționale repetitive.

### H. Poveste și footer

Povestea firmei apare după zonele importante pentru cumpărare, în câteva rânduri.

Footer-ul include contact, datele firmei, livrare, retur, termeni și celelalte informații necesare. Păstrează vizibile informațiile obligatorii și elimină numai redundanța inutilă.

## 6. Psihologia experienței

Aplică aceste principii prin design, fără promisiuni de creștere garantată:

- Dorință: fotografii plăcute, fidele produsului.
- Recunoaștere: categorii și etichete în limbajul clientului.
- Claritate: material, dimensiune, piese și preț ușor de comparat.
- Reducerea incertitudinii: disponibilitate, transport, retur și contact explicate.
- Control: selecții vizibile, modificabile și reversibile.
- Feedback: confirmare imediată când se schimbă varianta sau se adaugă produsul.
- Ierarhie: o acțiune principală per zonă.
- Continuitate: produsul văzut în reclamă trebuie să corespundă paginii de destinație.

Nu crea:

- cronometre fictive;
- mesaje false de stoc limitat;
- numere inventate de vizitatori;
- recenzii sau certificări false;
- pop-up-uri promoționale la intrarea pe site;
- prețuri tăiate fără bază;
- produse suplimentare preselectate.

## 7. Pagina categoriilor și listele de produse

Pagina cu toate categoriile trebuie să fie vizuală, clară și ușor de parcurs.

Într-o categorie:

- breadcrumb compact;
- titlu clar;
- număr real de rezultate;
- descriere foarte scurtă, dacă ajută;
- subcategorii relevante;
- filtre și sortare;
- produsele cât mai aproape de început.

Nu pune paragrafe lungi înainte de produse.

Filtrele mobile se deschid într-un panou accesibil, cu:

- titlu;
- selecții clare;
- resetare;
- număr real de rezultate;
- „Arată X produse”;
- închidere ușoară.

Păstrează filtrele și poziția de scroll când utilizatorul revine dintr-un produs.

Folosește filtre potrivite categoriei. Nu confunda dimensiunea saltelei cu dimensiunea husei de pilotă. Nu expune descrieri tehnice întregi ca opțiuni de filtrare.

La zero rezultate, explică situația și oferă eliminarea filtrelor, fără resetare forțată.

## 8. Cardul de produs

Pornește de la două coloane pe mobil. Permite adaptare la ecrane înguste și text mărit.

Ordinea:

1. fotografie;
2. nume lizibil;
3. atribut important: material, piese sau dimensiune;
4. preț;
5. culori/variante relevante;
6. acțiune.

Fotografiile au proporții consecvente, dar nu decupa elementele necesare înțelegerii produsului.

Titlurile pot ocupa 2–3 rânduri în starea normală. Nu ascunde diferențele esențiale pentru a face toate cardurile identice.

Prețul trebuie să fie corect:

- preț exact pentru produs simplu;
- interval sau „De la” justificat pentru variante;
- preț actualizat după selecție.

Pentru variante folosește „Alege dimensiunea” sau acces la produs. Nu adăuga automat o dimensiune.

Favoritele apar numai dacă funcția este implementată complet. Badge-urile trebuie să fie puține și susținute de date.

## 9. Pagina de produs

Construiește o pagină care răspunde rapid:
Ce cumpăr? Ce primesc? Mi se potrivește? Când ajunge? Cât plătesc?

Include:

- galerie clară cu swipe și controale accesibile;
- număr de imagini și zoom;
- titlu;
- rating autentic, dacă există;
- preț;
- material și conținut scurt;
- selectarea variantei;
- disponibilitate;
- informații de livrare;
- buton principal;
- detalii și recomandări.

Galeria nu trebuie să împingă informațiile utile la mai multe ecrane distanță.

Dimensiunile se aleg din controale mari și lizibile. Culorile au nume, nu doar cercuri colorate. Diferențiază selectat, indisponibil și focus.

„Ce primești” trebuie să fie listă sau tabel actualizat după variantă.

Afișează clar compoziția. Un produs 50% bumbac și 50% poliester nu trebuie prezentat vizual ca fiind 100% bumbac.

Lângă variante:
„Verifică dacă se potrivește”

Ghidul arată dimensiunile relevante și înălțimea maximă a saltelei numai dacă sunt confirmate.

Detaliile lungi, întreținerea și informațiile suplimentare pot folosi secțiuni extensibile. Nu ascunde informația esențială.

Când butonul principal iese din ecran, afișează o bară inferioară compactă:

- preț;
- „Adaugă în coș”.

Dacă varianta nu este aleasă, afișează „Alege dimensiunea” și du utilizatorul la selector.

Păstrează spațiu pentru safe-area și nu acoperi conținutul sau tastatura.

## 10. Coș, checkout și confirmare

După adăugare, confirmă produsul, varianta, cantitatea și prețul.

Oferă clar:

- „Vezi coșul”;
- „Continuă cumpărăturile”.

În coș:

- fotografie mică;
- nume;
- dimensiune și culoare;
- preț;
- cantitate;
- eliminare;
- reducere;
- transport;
- total.

Nu ascunde costurile. Dacă transportul necesită calcul, explică precis.

Păstrează promoțiile și pragurile comerciale reale. Bara de progres spre transport gratuit trebuie să fie secundară, nu elementul dominant.

Checkout:

- o singură coloană;
- fără cont obligatoriu;
- etichete permanente pentru câmpuri;
- autocomplete;
- tastatură potrivită tipului de câmp;
- erori lângă câmp;
- păstrarea informațiilor deja completate;
- sumar compact, cu total vizibil;
- metode de livrare și plată în starea lor reală.

Nu afișa ca activă plata online dacă integrarea nu funcționează.

Nu introduce recomandări, pop-up-uri și alte distrageri în etapa finală.

Confirmarea trebuie să arate o comandă realmente înregistrată: număr, produse, total, plată, livrare și contact.

## 11. Elemente fixe și pagini secundare

Nu afișa simultan:
bară de cumpărare + navigare inferioară + chat + banner promoțional.

Implicit, folosește header compact și CTA contextual. Nu introduce navigare inferioară doar pentru aspectul de aplicație.

Ajutorul sau WhatsApp nu trebuie să blocheze butoane și nu se deschid automat.

Cookie banner-ul trebuie să fie accesibil, cu opțiuni clare și comportament corect.

Aplică același design paginilor:

- căutare;
- rezultate goale;
- contact;
- livrare și retur;
- reclamații;
- pagini informative;
- 404;
- favorite/cont, dacă există.

Nu lăsa paginile secundare să arate ca un alt site.

## 12. Viteză, accesibilitate și stări

Creează componente reutilizabile și token-uri de design.

Optimizează imaginile, fonturile și JavaScript-ul. Rezervă spațiul imaginilor pentru a evita salturile de layout. Nu încărca toate imaginile mari ale catalogului din prima.

Evită animații inutile și respectă reduced motion.

Verifică:

- contrast;
- navigare cu tastatura;
- focus;
- cititoare de ecran;
- text mărit;
- zoom;
- safe-area;
- tastatură mobilă;
- titluri lungi;
- prețuri mari;
- multe variante.

Implementează stări coerente:
loading, eroare, lipsă imagine, stoc epuizat, variantă indisponibilă, coș gol, zero rezultate și succes.

Nu folosi butoane decorative fără acțiune sau confirmări simulate.

## 13. Testare și rezultat final

Fă capturi înainte și după la aceleași dimensiuni.

Testează pe Chrome și Safari/WebKit unde există infrastructură. Spune clar dacă ai testat pe telefon real sau doar prin emulare.

După schimbările de design, verifică din nou:

- meniul;
- căutarea;
- filtrele;
- paginarea;
- selectarea variantei;
- adăugarea în coș;
- cantitățile;
- reducerile;
- transportul;
- checkout-ul.

Nu testa prin plăți sau comenzi reale fără aprobare.

Pregătește un test cu utilizatori reali: găsirea unei lenjerii potrivite, identificarea materialului, aflarea costului livrării, adăugarea variantei corecte și găsirea returului. Nu inventa participanți sau rezultate.

Măsoară ulterior comportamentul clienților. Nu declara că designul crește conversia cu un anumit procent fără date.

## 14. Ordinea de execuție

1. Audit vizual și componente.
2. Header și navigare mobilă.
3. Homepage România–Pucioasa.
4. Categorii, filtre și carduri.
5. Pagina produsului.
6. Coș și checkout.
7. Pagini secundare și stări.
8. Testare și finisare.

Prezintă o singură direcție coerentă, bine executată. Nu îmi livra zece variante superficiale.

Pentru fiecare etapă arată:

- ce ai schimbat;
- motivul;
- preview;
- capturi;
- teste;
- limitări;
- ce urmează.

Nu cumpăra servicii, fonturi sau imagini fără acord. Folosește întâi resursele existente autorizate.

Începe acum prin inspectarea proiectului și a versiunii actuale a magazinului. Continuă cu implementarea în preview. Vreau un design mobil complet, cu identitate românească vizibilă, alegerea produselor simplă și cumpărare fluentă.
