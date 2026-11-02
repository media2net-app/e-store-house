# Configurarea modului Super Sales / Black Friday

Configurația comună este `src/data/campaign.json`. Fusul este `Europe/Bucharest`.

- `mode: "on"`: campania vizuală rămâne activă manual.
- `mode: "off"`: revine imediat la prezentarea normală.
- `mode: "auto"`: folosește `endAt` exclusiv. `startAt: null` înseamnă că actuala campanie rulează deja; dacă există o dată de început confirmată, `startAt` este inclusiv. Valorile completate trebuie să conțină data, ora și offsetul real al României (`+02:00` iarna sau `+03:00` vara). Datele imposibile, precum 31 noiembrie, sunt respinse.

Comerciantul a confirmat în conversație „sfârșitul zilei de noiembrie”. Configurația curentă oprește modul vizual la **1 decembrie 2026, ora 00:00 în România** (`2026-12-01T00:00:00+02:00`), după ultima secundă din 30 noiembrie. Perioada cupoanelor rămâne separată.

Schimbarea modului actualizează homepage-ul, antetul, titlul colecției și condițiile ofertelor. Filele deschise reîmprospătează datele de pagină la trecerea pragului sau la revenirea în filă. Cupoanele Black Friday au perioada lor separată, validată și pe server: 3–16 noiembrie 2026. Produsele cu reduceri proprii își păstrează prețurile până la o schimbare autorizată a regulii fiecărei oferte; modul vizual nu resetează prețuri și nu modifică comenzile existente.

Nu inventa o dată de început pentru campania aflată deja în desfășurare. Rulează `npm run build` și verifică ambele moduri și un coș păstrat între praguri. Publicarea schimbării se face prin commit și deployment; revenirea se face prin `git revert` al commitului sau rollback la deploymentul precedent în Vercel.
