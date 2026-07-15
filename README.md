# Jordan WMNS izpārdošana

Statiska vienas lapas izpārdošanas katalogs sieviešu *Air Jordan* apaviem (latviešu valodā).
Atlaides līdz –72%, 101 modelis, piegāde visā Latvijā.

## Struktūra

| Fails | Nozīme |
|---|---|
| `index.html` | Veikala lapa (iebūvēts CSS + JS) + rezervācijas forma |
| `data.js` | Apavu saraksts — kods, nosaukums, RRP, cena, izmēri |
| `images.json` | Automātiski iegūtie oficiālie produktu foto (raksta robots) |
| `thread.html` | Pircēja privātais čats ar veikalu (`thread.html?t=…`) |
| `admin.html` | Administratora panelis — rezervācijas + čats (jāpieslēdzas) |
| `supabase-config.js` | Supabase projekta URL + anon atslēga |
| `supabase.sql` | Datubāzes shēma + drošība (jāpalaiž vienreiz) |
| `app.css` | Kopīgais stils `thread.html` / `admin.html` lapām |
| `scripts/fetch-images.js` | Iegūst foto no Nike produktu API pēc modeļa koda |
| `.github/workflows/fetch-images.yml` | Palaiž robotu, kad mainās `data.js`, reizi nedēļā vai manuāli |

## Rediģēšana

- **Cenas / modeļi / izmēri:** rediģē `data.js`. Izmērus norāda ar `sizes:[8,8.5,9]` (US sieviešu izmēri; EU aprēķinās automātiski). Pēc izmaiņu iesūtīšanas robots automātiski atrod jauno foto.

## Rezervāciju sistēma (Supabase)

Rezervācijas un sarakste notiek pašā mājaslapā — bez Telegram / WhatsApp vai citām lietotnēm.
Pircējs aizpilda īsu formu, saņem privātu saiti uz savu čatu; administrators visu redz `admin.html`.
Dati glabājas tavā **Supabase** projektā (bezmaksas līmenis pietiek).

**Uzstādīšana (vienreiz, ~10 min):**

1. Izveido bezmaksas projektu vietnē <https://supabase.com>.
2. **SQL Editor → New query** → ielīmē visu `supabase.sql` saturu → **Run**.
3. **Authentication → Users → Add user** → izveido administratora e-pastu + paroli
   (ar to pieslēgsies `admin.html`).
4. **Settings → API** → nokopē **Project URL** un **anon public** atslēgu un ieliec
   tās `supabase-config.js` failā.
5. Iesūti izmaiņas (`git push`) — sistēma strādā.

> `anon` atslēga ir publiska pēc dizaina (drošību nodrošina `supabase.sql` noteikumi).
> **Nekad** neliec šeit `service_role` atslēgu.

**Personīgais čats (bez personas datiem):** katram apmeklētājam ir sava **privāta**
saruna ar veikalu. Peldošā poga *"💬 Čats"* atver čata logu jebkurā lapā — nav vajadzīgs
vārds vai e-pasts, sarunas pavediens tiek atcerēts pārlūkā. Neviens neredz cita cilvēka
ziņas. Rezervējot konkrētu apavu, atveras tas pats privātais čats, pieķēdēts pie modeļa.

**Kā strādā:** `admin.html` rāda visas sarunas un rezervācijas (jaunākās augšā), statusu
(Čats → Jauna → Rezervēts → Apmaksāts → Nosūtīts), un pašu čatu. Jaunas ziņas parādās
~3 sekunžu laikā. Kamēr `admin.html` ir atvērts, pārlūks var rādīt paziņojumu par jaunu
ziņu.

## Lokāla priekšskatīšana

```
python -m http.server 5178
```
Atver <http://localhost:5178>.
