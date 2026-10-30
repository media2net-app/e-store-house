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

În `/admin/comenzi`, „Verifică contul FAN” citește sucursalele și, dacă `FAN_CLIENT_ID` aparține contului, estimează fără emitere un colet Standard de 1 kg, 10 × 10 × 10 cm către București. Verifică „Greutate / primul kg” față de cei 13 lei fără TVA din contractul nr. 4342/26.10.2026; indexul de combustibil, kilometrii suplimentari și TVA sunt afișate separat. Dacă baza nu corespunde, cere FAN să asocieze contractul cu acel cont înainte de activarea la checkout.

## În E-Store Control

În „Comenzi site propriu”, cântărește coletul final și confirmă datele comenzii. Poți estima costul și emite AWB pentru curierul selectat de client. După emitere, descarcă PDF-ul individual sau selectează până la 20 de AWB-uri pentru un PDF de tipărire. Nu relua emiterea după un răspuns incert: verifică mai întâi referința `estore-<ID comandă>` în SelfAWB.

Anularea unui AWB FAN cere momentan verificare manuală în SelfAWB. Sameday își păstrează fluxul existent de emitere, anulare și tipărire.

Documentație: https://www.fancourier.ro/wp-content/uploads/2025/09/RO_FANCourier_API_130825-1.pdf
