# Configurarea modului Super Sales / Black Friday

Configurația comună este `src/data/campaign.json`. Fusul este `Europe/Bucharest`.

- `mode: "on"`: campania vizuală rămâne activă manual. Aceasta este starea curentă, deoarece data de încheiere a campaniei nu a fost comunicată.
- `mode: "off"`: revine imediat la prezentarea normală.
- `mode: "auto"`: folosește `startAt` inclusiv și `endAt` exclusiv. Ambele trebuie completate cu data, ora și offsetul României (`+02:00` iarna sau `+03:00` vara), de exemplu `2026-11-05T00:00:00+02:00`. Nu copia data de sfârșit a cupoanelor în `endAt` fără confirmarea perioadei campaniei.

Schimbarea modului actualizează homepage-ul, antetul, titlul colecției și condițiile ofertelor. Filele deschise reîmprospătează datele de pagină la trecerea pragului sau la revenirea în filă. Cupoanele Black Friday au perioada lor separată, validată și pe server: 3–16 noiembrie 2026. Produsele cu reduceri proprii își păstrează prețurile până la o schimbare autorizată a regulii fiecărei oferte; modul vizual nu resetează prețuri și nu modifică comenzile existente.

Înainte de activarea automată, obține de la comerciant **data și ora exactă de început și de sfârșit pentru campania Super Sales / Black Friday**. Rulează `npm run build` și verifică ambele moduri și un coș păstrat între praguri. Publicarea schimbării se face prin commit și deployment; revenirea se face prin `git revert` al commitului sau rollback la deploymentul precedent în Vercel.
