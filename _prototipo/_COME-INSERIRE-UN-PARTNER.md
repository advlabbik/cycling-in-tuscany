# Come si inserisce un nuovo partner (logica unica per tutti)

Tutto il sito nasce da UN solo file dati: `_dati-partner.json`.
Ogni territorio e ogni struttura è un blocco. Aggiungere un partner = copiare un blocco, cambiare i dati, rigenerare. Le pagine escono SEMPRE identiche nel formato.

## Gerarchia (Campiglia paga di più → sta più in alto)
- Territorio `"tier":"premium"` → trattamento di punta: hero dorato, ribbon "Home of the Tuscany Trail", box in evidenza in home, download "guida completa". OGGI solo Campiglia.
- Territorio `"tier":"standard"` → territorio ufficiale normale (Monterotondo).
- Struttura → sempre "Official Bike-Friendly Stay" (bordeaux), stesso livello tra loro.

## Aggiungere un TERRITORIO
Copia il blocco di Monterotondo dentro `"territori"` e cambia:
- `slug` (nome-file senza spazi), `name`, `area`, `lat`/`lng` (da Google Maps), `tagline`, `intro`
- `cosa_vedere`: coppie [titolo, descrizione]
- `ride_pack`: i 4 percorsi con link Ride with GPS (o `null` se non ne ha)
- `editorial`: contenuti magazine (o `null`)
- `channels`, `numeri_utili`, `guida_pdf`

## Aggiungere una STRUTTURA
Copia il blocco di Villaggio Orizzonte dentro `"strutture"` e cambia:
- `slug`, `name`, `town`, `lat`/`lng`, `tagline`, `intro`, `site` (loro sito di prenotazione)
- `services`: elenco servizi bike
- `ride_pack`: 4 percorsi con link Ride with GPS (dal loro Ride Base Pack)
- `guida_pdf`: il PDF del pack in `guide-pdf/`

## Rigenerare il sito
Due comandi (li lancio io):
1. `python3 build_site.py`   → riscrive `_dati-partner.json`
2. `python3 build_pages.py`  → rigenera home + tutte le pagine + mappa

La mappa in home si aggiorna da sola: legge gli stessi dati, mette un pin per ogni partner.

## Cartelle
- `territori/` `strutture/` → pagine generate (non toccare a mano)
- `guide-pdf/` → PDF guida/pack scaricabili
- `ride-pack-gpx/` → (futuro) tracce GPX esportate da Ride with GPS per l'overlay sulla mappa
- `rivista/` → sorgenti magazine (docx) da versare nelle pagine territorio
- `assets/style.css` → grafica condivisa (cambi qui = cambi ovunque)
