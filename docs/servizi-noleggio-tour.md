# Noleggio bici e tour su misura — flusso richieste (esca TT365)

Test di domanda deciso ad agosto 2026. Non abbiamo (ancora) un servizio di
noleggio né tour operativi. Il sito raccoglie richieste vere, noi rispondiamo
a mano dopo aver sentito i partner. Obiettivo doppio — misurare quanta domanda
c'è prima di costruire il servizio, e nel frattempo servire chi possiamo
servire davvero tramite le strutture ufficiali.

## Come gira

1. Il visitatore compila uno dei due form su `/services/` (noleggio o tour).
2. `functions/api/service-request.js` fa tre cose, via API Brevo:
   - **notifica interna** a `SERVICE_NOTIFY_EMAIL` (default `collab@tuscanytrail.it`),
     con reply-to del richiedente → si risponde direttamente col client di posta;
   - **conferma automatica** al richiedente ("verifichiamo coi partner, risposta
     entro 2 giorni lavorativi"), spedita da `365@tuscanytrail.it` ma con
     reply-to sulla casella di lavoro `collab@`, così una risposta del cliente
     atterra dove sta già la richiesta. ⚠️ Il reply-to **non** è `365@`: quella
     casella inoltra a `info@tuscanytrail.it` e non a `collab@` (verificato il
     27/8/2026), quindi le risposte si staccherebbero dalle richieste;
   - **tagging del contatto** su Brevo (`CIT_SERVICE`, `CIT_SERVICE_INFO`), best-effort.
3. **La seconda email è SEMPRE manuale.** Prima si sentono davvero i partner,
   poi si risponde. Mai un no automatico — il richiedente ha lasciato dati veri
   e merita una risposta vera.

## Setup una tantum (stato al go-live del 27/8/2026)

- [x] Cloudflare Pages → Environment variables → `BREVO_API_KEY` presente nelle
      env **production** (verificata end-to-end il 27/8 col gate GPX di lead.js;
      sulle preview non c'è, lì la function risponde `{ok, demo}`).
      `SERVICE_NOTIFY_EMAIL` non impostata → vale il default collab@tuscanytrail.it.
- [x] Casella `365@tuscanytrail.it` creata e validata in Brevo come sender
      (id 10, attivo dal 27/8/2026 — il dominio è autenticato, quindi nessuna
      email di validazione da cliccare). Il collaudo del 27/8 qui sotto è stato
      fatto quando il mittente era ancora `hello@` (id 9).
- [x] `collab@tuscanytrail.it` riceve — verificato 27/8 col collaudo qui sotto:
      notifica interna E conferma automatica arrivate in inbox (non spam),
      entrambe spedite da hello@ via Brevo (mittente di allora). Dopo lo swap a
      `365@` (27/8) è stata rifatta la prova sulla parte cambiata: invio da
      `365@` a `365@`, esito `delivered` sui log Brevo — vedi README.
- [x] Costante `SITE` in `functions/api/service-request.js` aggiornata a
      `365.tuscanytrail.it` al momento del merge (27/8, dopo il cutover).
      L'indirizzo mittente non si tocca, sta sul dominio radice apposta.
- [x] Brevo → Contacts → Settings → Contact attributes → `CIT_SERVICE` (testo)
      e `CIT_SERVICE_INFO` (testo) **creati il 27/8/2026**, via API dal VPS
      Hetzner (l'allowlist IP dell'account rifiuta le chiamate dal portatile).
      Prima esistevano solo i sei `CIT_*` del gate GPX.
      Se mancano NON si perdono richieste: le due email partono comunque, salta
      solo il tagging del contatto (best-effort, errore ignorato).
- [x] Collaudo end-to-end fatto il 27/8/2026, subito dopo il merge: richiesta
      di prova (noleggio, marcata TEST, richiedente collab@, consenso NON
      spuntato) inviata da `/services/` in produzione → `{ok: true}`, notifica
      interna e conferma automatica entrambe arrivate in inbox su collab@.
      Il contatto di prova NON è entrato in lista 29 (consenso assente).

## Regole di risposta

- Rispondere **entro 2 giorni lavorativi** (è la promessa fatta in pagina e
  nella conferma automatica).
- Richieste di noleggio in zona **Punta Ala** → NON dire di no. Punta Ala Camp
  ha già noleggio, officina e Trail Center. Girare la richiesta a loro (o dare
  il contatto): è il modo per non calpestarli e per portare loro valore.
- Villa Toscana e Villaggio Orizzonte dichiarano "bike rentals delivered" tra i
  servizi → per richieste in zona Piombino/costa sentire prima loro.
- Ogni richiesta va annotata (anche solo la notifica in una cartella Gmail
  dedicata) — è il dato che decide se il servizio si costruisce.

## Template — seconda email manuale

Da mandare rispondendo alla notifica interna (il reply-to è già il richiedente).
Regola di scrittura — mai i due punti nella prosa.

### A. Nessuna disponibilità trovata (la "scusa" onesta)

> **Subject:** About your bike rental request
>
> Hi {name},
>
> we checked with our partners in the {area} area for your dates and,
> honestly, we couldn't secure a bike that meets the standard we'd want to
> put you on. Rather than a maybe, we prefer telling you straight.
>
> Two things that might still help. {Punta Ala Camping Resort runs a full
> Trail Center with gravel, road, MTB and e-bike rentals — if your plans can
> touch the coast, they're excellent / Some of our official stays arrange
> rental delivery for their guests — if you book with them, ask directly}.
> And every route on the site stays free to download for when you're set up.
>
> Our partner network is growing. If you'd like, we'll keep your request on
> file and write you the moment a partner covers your area and dates.
>
> Ride on,
> {firma} — Tuscany Trail 365

Varianti della scusa, a seconda del caso vero
- date piene → "our partners are fully booked on those dates"
- zona scoperta → "we don't yet have a partner we trust in that area"
- mezzo mancante (es. taglie, bici bimbi) → "none of our partners could match
  what you need at the level we'd want"

### B. Disponibilità trovata (handoff al partner)

> **Subject:** Good news about your bike rental
>
> Hi {name},
>
> good news — {partner} in {località} has what you asked for on your dates.
> Here's what they offer. {dettagli e prezzo}
>
> If it works for you, reply and we'll put you directly in touch — or book
> straight away through {canale}. Tell them Tuscany Trail 365 sent you.
>
> Ride on,
> {firma} — Tuscany Trail 365

### C. Tour su misura — non riusciamo a costruirlo

> **Subject:** About the trip you asked us for
>
> Hi {name},
>
> thank you for trusting us with your idea — we read it carefully and talked
> to our partners. For {periodo} we can't yet build the trip the way you
> deserve it, and we'd rather be honest than improvise.
>
> What we CAN offer today. Our verified routes are free to download, our
> official stays know these roads and welcome riders year round, and we're
> happy to suggest a self-guided itinerary based on what you told us — just
> reply and we'll sketch it, no strings attached.
>
> We're building the guided side of this project. May we keep your request
> and write you when it's real?
>
> Ride on,
> {firma} — Tuscany Trail 365

L'offerta dell'itinerario self-guided gratuito nella variante C non è cortesia,
è l'esca dentro l'esca — tiene vivo il contatto, costa poco e dice quanto il
richiedente fa sul serio.

## Cosa misurare (quando decidere)

Dopo 60-90 giorni guardare — numero richieste per servizio, zone chieste,
date chieste, valore medio (giorni × persone). Se il volume regge, cercare il
partner erogatore; il form ha già validato la domanda.
