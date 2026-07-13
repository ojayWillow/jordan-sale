# Jordan WMNS izpārdošana

Statiska vienas lapas izpārdošanas katalogs sieviešu *Air Jordan* apaviem (latviešu valodā).
Atlaides līdz –72%, 101 modelis, piegāde visā Latvijā.

## Struktūra

| Fails | Nozīme |
|---|---|
| `index.html` | Visa lapa (iebūvēts CSS + JS) |
| `data.js` | Apavu saraksts — kods, nosaukums, RRP, cena |
| `images.json` | Automātiski iegūtie oficiālie produktu foto (raksta robots) |
| `scripts/fetch-images.js` | Iegūst foto no Nike produktu API pēc modeļa koda |
| `.github/workflows/fetch-images.yml` | Palaiž robotu, kad mainās `data.js`, reizi nedēļā vai manuāli |

## Rediģēšana

- **Cenas / modeļi:** rediģē `data.js`. Pēc izmaiņu iesūtīšanas robots automātiski atrod jauno foto.
- **Kontakti (WhatsApp / Instagram):** `CONFIG` bloks `index.html` augšā.

## Lokāla priekšskatīšana

```
python -m http.server 5178
```
Atver <http://localhost:5178>.
