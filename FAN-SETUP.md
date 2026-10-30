# FAN Courier în estorehouse.ro și E-Store Control

Fluxul de AWB folosește magazinul drept sursă a comenzilor și a stării expediției. E-Store Control cere magazinului emiterea și PDF-ul prin conexiunea privată existentă. Parola SelfAWB și IBAN-ul nu ajung în browser sau în E-Store Control.

## Activare după confirmarea contractului

În mediul de producție al magazinului configurează:

- `FAN_API_USERNAME` și `FAN_API_PASSWORD`: datele SelfAWB autorizate pentru API.
- `FAN_CLIENT_ID`: ID-ul sucursalei/punctului de lucru comunicat de FAN; nu este CUI-ul firmei.
- `FAN_BANK` și `FAN_BANK_ACCOUNT`: banca și IBAN-ul confirmate de FAN pentru serviciul Cont Colector. Sunt necesare numai pentru ramburs.
- `STORE_FAN_SHIPPING_RON`: taxa de transport aprobată pentru client, în RON. Costul real al AWB-ului se poate estima separat în Control.
- `STORE_FAN_ENABLED=true`: permite afișarea livrării FAN numai când API și emiterea AWB sunt configurate.
- `FAN_AWB_ENABLED=true`: activează emiterea AWB, numai după un test de autentificare, tarif și PDF cu FAN.
- `STORE_COD_ENABLED=true`: permite plata ramburs dacă opțiunea de livrare are curier activ. Pentru FAN, trebuie confirmat și Cont Colector.

Nu seta `FAN_AWB_ENABLED=true` înainte de confirmarea contractului și a ID-ului. Aplicația respinge emiterea cât timp aceste date lipsesc. O comandă de curier pentru ridicare este separată de crearea AWB-ului; până la implementarea și verificarea preluării API, cheamă curierul din SelfAWB sau predă coletul la FAN.

În `/admin/comenzi`, „Verifică contul FAN” citește sucursalele și afișează doar banca și ultimele patru caractere ale IBAN-ului, ca să poți compara contul de ramburs cu contractul. Dacă `FAN_CLIENT_ID` aparține contului, estimează fără emitere un colet Standard și unul Cont Colector de 1 kg, 10 × 10 × 10 cm către București. Verifică baza de 13,00 lei și taxa Cont Colector de 5,50 lei fără TVA față de contractul nr. 4342/26.10.2026; indexul de combustibil, kilometrii suplimentari, alte taxe și TVA sunt afișate separat. Dacă aceste valori nu corespund, cere FAN să asocieze contractul cu acel cont înainte de activarea la checkout.

La verificarea API din 30.10.2026, pentru coletul de referință de 1 kg către București, Standard a returnat 13,00 + 2,55 combustibil + 3,27 TVA = **18,82 lei**, iar Cont Colector 13,00 + 5,50 ramburs + 3,63 combustibil + 4,65 TVA = **26,78 lei**. Indexul rutier FAN pentru octombrie 2026 este 19,6%. Pentru un colet taxat la 5 kg în aceleași condiții, calculul contractual este Standard **24,60 lei** (17,00 bază + 3,33 combustibil + 4,27 TVA) sau Cont Colector **32,56 lei** (17,00 bază + 5,50 ramburs + 4,41 combustibil + 5,65 TVA). Valorile de 5 kg sunt calcule, nu cotații API verificate. Costul final poate varia în funcție de greutatea taxabilă, destinație și opțiuni. Pentru ramburs achitat cu cardul la curier, contractul mai prevede 0,90% din suma rambursului, necuprins în exemple. Prețul de 20 lei afișat clientului pentru livrarea la domiciliu este separat de costul facturat de FAN.

După modificarea variabilelor Vercel, este necesar un deployment nou. Un merge pe `main` declanșează fluxul normal de deployment din GitHub; confirmă că deploymentul Production folosește commitul nou înainte de testul API.

## În E-Store Control

În „Comenzi site propriu”, cântărește coletul final și confirmă datele comenzii. Poți estima costul și emite AWB pentru curierul selectat de client. După emitere, descarcă PDF-ul individual sau selectează până la 20 de AWB-uri pentru un PDF de tipărire. Nu relua emiterea după un răspuns incert: verifică mai întâi referința `estore-<ID comandă>` în SelfAWB.

Anularea unui AWB FAN cere momentan verificare manuală în SelfAWB. Sameday își păstrează fluxul existent de emitere, anulare și tipărire.

Documentație: https://www.fancourier.ro/wp-content/uploads/2025/09/RO_FANCourier_API_130825-1.pdf
