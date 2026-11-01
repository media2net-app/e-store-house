# Audit mobil și implementare — 2 noiembrie 2026

Brief-ul integral primit de la comerciant este păstrat în `MOBILE-MASTER-BRIEF-20261102.txt`. Acest raport separă observațiile făcute în browser de verificările automate și de lucrurile care cer date ori mediu de producție.

| Observație din audit | Constatare și corecție | Verificare |
| --- | --- | --- |
| „saltea 160x200” începea cu huse | Confirmată: 211 rezultate înainte; căutarea și ordinea implicită au fost ajustate după relevanță, cu saltelele în față. | Căutările locale `saltea 160x200`, `topper 180x200`, `prosop` și teste de normalizare. |
| Dimensiuni duplicate în filtre | Confirmată; dimensiunile sunt canonicalizate fără a confunda salteaua cu componentele lenjeriei. | Numărul opțiunilor și combinațiile de filtre verificate în previzualizare; teste pentru formele `x`, `×` și spații. |
| Filtrul Material avea fraze întregi | Confirmată; opțiuni separate pentru compoziție, țesătură, umplutură și gramaj, numai unde există date. | Panoul de lenjerii a trecut de la 27 de etichete lungi la opțiuni scurte; testele indexului de filtre. |
| Homepage promoțional foarte înalt și repetitiv | Confirmată; în campanie afișează un banner compact și șase produse din lenjerii și baie; modul normal are banner de brand și categorii. | Capturi la 390 px pentru ambele moduri, plus testul de randare. |
| Formulare nepotrivită despre fețe de masă | Confirmată în comunicarea promoțională; textul afișat a fost înlocuit cu mesajul despre condițiile reducerilor. | Inspecția paginii de oferte. |
| Dimensiunile pieselor ascunse la produsul 76881 | Confirmată; rezumatul „Ce primești” apare direct în zona de cumpărare. | Captură produs și teste de dimensiuni. |
| Disponibilitate vagă | Confirmată; „În stoc” apare numai cu cantitate cunoscută, altfel „Disponibilitate de confirmat”; stocul fals devine „Indisponibil”. | Logică verificată în componentă și în paginile locale. |
| Recomandări fără legătură | Confirmată; maximum patru completări din categorii compatibile. | Teste de recomandări; fără fețe de masă/pernuțe pentru lenjerii. |
| Promoție sugerată pentru coș Super Sale | Confirmată; mesajul apare doar când există articole eligibile. | Coș local și teste de excludere a reducerilor. |
| Mesaj „Adăugat” rămas după eliminare | Confirmată; mesajul se șterge la actualizare/eliminare/golirea coșului. | Test în browser: adăugare, eliminare, coș gol. |
| Easybox părea inițial indisponibil | Confirmată ca stare temporară la încărcare; formularul arată acum că verifică eligibilitatea. | Comportamentul anterior văzut pe site; interfața nouă verificată local. |

## Verificări și limite

- Previzualizare locală la lățimi de 360, 390, 430, 768 și 1440 px pentru homepage, categorie, căutare, produs și checkout: fără derulare orizontală accidentală. Sunt lățimi simulate în Chromium, nu teste pe dispozitive iOS/Android reale.
- Capturile înainte/după sunt în `/Users/mihaipopescu/Desktop/estorehouse-mobile-audit-20261102/`: `home-before.png`, `home-after-campaign.png`, `home-after-normal.png`, `category-before.png`, `category-after.png`, `product-before.png`, `product-after.png`, `checkout-before.png`, `checkout-after.png`.
- Căutarea, navigarea, adăugarea rapidă, coșul și accesul la checkout au fost parcurse local. Checkoutul local nu avea acreditările de producție pentru ofertele curierilor, tranzacție/card sau comandă efectivă; regulile de quote, plată ramburs, cupon, prag de 399 lei și prevenirea duplicatelor sunt acoperite de testele server existente. Nu pretind o plată sau comandă reală.
- Valorile de performanță din browserul cald reprezintă doar navigarea de test, nu Core Web Vitals. Nu există scoruri de teren comparabile înainte/după și nu declar o îmbunătățire cuantificată.
- Perioada cupoanelor Black Friday este 3–16 noiembrie 2026. Data de sfârșit a **campaniei vizuale** nu a fost furnizată. Mecanismul `auto` este pregătit, dar modul rămâne `on` până la configurarea intervalului confirmat; detalii în `CAMPAIGN-CONFIG.md`.
- Catalogul comercial (`src/data/products.json`), prețurile, regulile de transport și URL-urile existente nu au fost editate pentru această lucrare.

## Publicare și revenire

Publicarea se face din ramura acestei implementări prin pull request și deployment Vercel, după trecerea buildului și verificarea previzualizării. În caz de regresie, revino la deploymentul anterior din Vercel sau folosește `git revert` pentru commitul implementării și publică din nou. Starea vizuală a campaniei se poate opri separat prin `mode: "off"` în `src/data/campaign.json`.
