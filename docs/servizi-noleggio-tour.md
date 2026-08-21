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
     entro 2 giorni lavorativi"), spedita da `hello@tuscanytrail.it` ma con
     reply-to sulla casella di lavoro, così una risposta del cliente atterra
     dove sta già la richiesta;
   - **tagging del contatto** su Brevo (`CIT_SERVICE`, `CIT_SERVICE_INFO`), best-effort.
3. **La seconda email è SEMPRE manuale.** Prima si sentono davvero i partner,
   poi si risponde. Mai un no automatico — il richiedente ha lasciato dati veri
   e merita una risposta vera.

## Setup una tantum (da fare al primo deploy)

- [ ] Cloudflare Pages → Environment variables → verificare `BREVO_API_KEY`
      (già usata da lead.js); opzionale `SERVICE_NOTIFY_EMAIL` se la casella
      di lavoro non è collab@tuscanytrail.it.
- [ ] Creare la casella `hello@tuscanytrail.it` e validarla in Brevo
      (Senders & domains). Il dominio tuscanytrail.it è già autorizzato a
      spedire, quindi manca solo l'indirizzo. Finché non esiste, le due email
      non partono — ed è il modo classico di perdere richieste in silenzio.
- [ ] Verificare che `collab@tuscanytrail.it` riceva la notifica e non finisca
      in spam. È posta che arriva da un dominio nostro spedita da Brevo, quindi
      è la prima a essere filtrata se l'autorizzazione a spedire non è a posto.
- [ ] Brevo → Contacts → Settings → Contact attributes → creare
      `CIT_SERVICE` (testo) e `CIT_SERVICE_INFO` (testo).
- [ ] Mandare una richiesta di prova da `/services/` e controllare che arrivino
      sia la notifica interna sia la conferma automatica.

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
