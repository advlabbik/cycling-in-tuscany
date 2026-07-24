# -*- coding: utf-8 -*-
import os, json, html
ROOT = "/Users/zale/Desktop/Sito Destinazione (Momento 2)"
os.makedirs(os.path.join(ROOT,"assets"), exist_ok=True)

STAY22_AID = "694570b3581ec595fca56708"
def stay22(lat,lng):
    return f"https://www.stay22.com/allez/roam?aid={STAY22_AID}&campaign=tuscanytrail&lat={lat}&lng={lng}&product_medium=apps"

# ============================================================
#  UNICO FILE DATI — aggiungere un partner = aggiungere un blocco qui
# ============================================================
TERRITORI = [
 {
  "slug":"campiglia-marittima","name":"Campiglia Marittima","tier":"premium",
  "area":"Costa degli Etruschi","lat":43.057,"lng":10.600,
  "tagline":"Home of the Tuscany Trail",
  "intro":"Borgo medievale sospeso tra mare e colline, cuore della Costa degli Etruschi. Terme, archeologia mineraria e una Bike Area tra le più tecniche della Toscana: qui il Tuscany Trail ha la sua casa.",
  "cosa_vedere":[
    ("Il borgo medievale","Piazza della Repubblica, vicoli e scorci; ad agosto il festival di teatro internazionale <em>Apritiborgo</em>."),
    ("Rocca di Campiglia","Fortezza del XII secolo a dominio della valle, panorama fino all'arcipelago."),
    ("Pieve di San Giovanni & Palazzo Pretorio","Romanico del XII secolo e gli stemmi dei podestà sulla facciata del Pretorio (XIV sec.)."),
    ("Parco Archeominerario di San Silvestro","Miniere di rame, piombo e argento, il Villaggio Minerario medievale e i musei del minatore. Dentro il parco un bike park tra cross, enduro e downhill."),
    ("Terme del Calidario — Venturina","Acque termali e Area del Silenzio a pochi minuti dal borgo."),
    ("Bike Area Monte Calvi","Single track tecnici, sentieri neri/enduro e 4 itinerari cross-country, integrati con il Tuscany Trail."),
  ],
  "itinerari_txt":"Una giornata tipo: colazione nel borgo, Rocca e centro storico, pranzo tipico, nel pomeriggio Terme o Parco Archeominerario di San Silvestro. Per chi pedala: Bike Area Monte Calvi e i sentieri del Parco.",
  "ride_pack":None,
  "editorial":None,
  "channels":[
    ("Parco Archeominerario di San Silvestro","https://www.parchivaldicornia.it/parchi-archeologici/parco-archeominerario-di-san-silvestro/"),
    ("Orari e tariffe — Parchi Val di Cornia","https://www.parchivaldicornia.it/info-e-servizi/orari-e-tariffe/?selected=2552"),
  ],
  "numeri_utili":[("Ufficio Turistico","0565 838470 — Via Cavour"),("Comune di Campiglia M.ma","0565 839111 — Via Roma 5")],
  "guida_pdf":"../guide-pdf/Guida-Campiglia-Marittima.pdf",
 },
 {
  "slug":"monterotondo-marittimo","name":"Monterotondo Marittimo","tier":"standard",
  "area":"Colline Metallifere · Cuore geotermico","lat":43.143,"lng":10.857,
  "tagline":"Territorio ufficiale · dove la Terra respira",
  "intro":"Borgo medievale nel cuore geotermico della Toscana: fumarole, soffioni e le colline bianche del Parco delle Biancane. Un paesaggio quasi lunare, dentro un Geoparco UNESCO, da attraversare in bici.",
  "cosa_vedere":[
    ("Parco delle Biancane","Colline bianche, fumarole e soffioni: il volto geotermico del territorio, con anello escursionistico e panorami."),
    ("Il borgo & la Rocca degli Alberti","Piazza Casalini, le Logge, la Chiesa di San Lorenzo, il Museo Fucini e il panorama dalla Rocca."),
    ("Trail Area, Pump Track & Bike Center","Area trail attorno alle Biancane, pump track ai Lagoni a ingresso libero, noleggio e ricarica e-bike."),
    ("Ciclovia delle 3 M","Anello di 90 km Massa Marittima–Monterotondo–Montieri: 14 aree sosta e 10 colonnine di assistenza."),
  ],
  "itinerari_txt":"Quattro percorsi ufficiali dalla porta del borgo, dal gravel tecnico tra le fumarole ai lunghi anelli tra i borghi delle Colline Metallifere.",
  "ride_pack":[
    {"name":"Castle & Crags Loop","type":"Gravel","km":"31","dislivello":"885 m","diff":"Impegnativo","surface":"gravel · e-bike consigliata","hi":"Rocchette Pannocchieschi, Monte Arsenti","url":"https://ridewithgps.com/routes/53994750"},
    {"name":"Fumarole Loop","type":"Gravel","km":"40","dislivello":"1.079 m","diff":"Impegnativo","surface":"gravel · e-bike consigliata","hi":"Le Fumarole, La Leccia, Le Biancane","url":"https://ridewithgps.com/routes/53994755"},
    {"name":"Boar & Deer Loop","type":"Road","km":"78,6","dislivello":"1.270 m","diff":"Sforzo prolungato","surface":"asfalto","hi":"Parco di Montioni, Massa Marittima","url":"https://ridewithgps.com/routes/53994764"},
    {"name":"Borghi & Vineyards Loop","type":"Road","km":"79,6","dislivello":"1.547 m","diff":"Sforzo prolungato","surface":"asfalto","hi":"Montieri, Radicondoli, Castelnuovo V.C., Le Fumarole","url":"https://ridewithgps.com/routes/53994774"},
  ],
  "editorial":{
    "hero_title":"Monterotondo Marittimo — dove la Terra respira",
    "hero_html":"<p>Si arriva in bici a Monterotondo salendo tra i castagni, e la prima cosa che colpisce è il rumore: un sibilo continuo che esce dalla terra. Sono i soffioni, il respiro geotermico di queste colline. Il borgo medievale, raccolto attorno a Piazza Casalini e alle Logge, si apre poi sul paesaggio bianco e fumante delle Biancane, un anfiteatro naturale che sembra appartenere a un altro pianeta.</p><p>È un territorio che si racconta lentamente: le miniere e il vapore, le foreste di castagni, i caseifici e le birre prodotte con il calore della terra. Pedalare qui significa attraversare geologia, storia e gusto nello stesso giro.</p>",
    "boxes":[
      ("Le Biancane e i soffioni","Il fenomeno geotermico che ha reso celebre il territorio: fumarole, lagoni e il Lagone Cerchiaio. Il MUBIA racconta la storia dell'acido borico e delle prime centrali."),
      ("Il Museo Narrante di Renato Fucini","Dedicato allo scrittore toscano; biblioteca comunale 0566 906391, biblioteca@comune.monterotondomarittimo.gr.it."),
      ("Massa Marittima","A pochi km: Fonte dell'Abbondanza, Torre del Candeliere, il Duomo e la Zecca medievale."),
      ("Sapori geotermici","Caseifici, birrifici che sfruttano il vapore (il Birrificio Vapori di Birra a Sasso Pisano) e i piatti tipici: tortelli di ricotta, ribollita, pappardelle al cinghiale, schiaccia all'uva."),
    ],
    "fonte":"Contenuti editoriali dal magazine Cycling in Tuscany. Fonti in rivista/Bibliografia Monterotondo.",
  },
  "channels":[("Comune di Monterotondo Marittimo","https://www.comune.monterotondomarittimo.gr.it/")],
  "numeri_utili":[("Biblioteca / Museo Fucini","0566 906391")],
  "guida_pdf":"../guide-pdf/Ride-Base-Pack-Monterotondo.pdf",
 },
]

STRUTTURE = [
 {
  "slug":"villaggio-orizzonte","name":"Villaggio Orizzonte","town":"Piombino · Riotorto","lat":42.945,"lng":10.624,
  "tagline":"Base camp sul mare del Golfo di Follonica",
  "intro":"Accesso diretto alla spiaggia nel Parco Costiero della Sterpaia: mare e bici nello stesso giorno. Perfetto per famiglie e per chi vuole una base comoda sulla Costa degli Etruschi.",
  "site":"https://www.villaggioorizzonte.it/",
  "services":["Deposito bici sicuro","Area bike wash","Colazione presto / orari pasti flessibili","Lavanderia e asciugatura","Info percorsi e consigli locali","Parcheggio","Check-in/out flessibile","Spiaggia privata"],
  "ride_pack":[
    {"name":"The Bandite Wetlands Route","type":"Gravel","km":"51","dislivello":"237 m","diff":"Facile","surface":"44% sterrato","hi":"Follonica, Cala Violina, Parco della Sterpaia","url":"https://ridewithgps.com/routes/53933820?privacy_code=e3yJfifsBGyjhKqhLsKGDFV3uipus2Dc"},
    {"name":"Etruscan Coast Gravel Loop","type":"Gravel","km":"51,6","dislivello":"243 m","diff":"Facile","surface":"39% gravel","hi":"Suvereto, Parco della Sterpaia","url":"https://ridewithgps.com/routes/53933835?privacy_code=QcHzIOdGSNGbZYlBZyyEh2sJf12pClQY"},
    {"name":"Golden Hills of Bolgheri","type":"Road","km":"108","dislivello":"668 m","diff":"Facile","surface":"asfalto","hi":"Bolgheri, Castagneto Carducci, Sassetta, Suvereto","url":"https://ridewithgps.com/routes/53934291"},
    {"name":"Monteverdi & Canneto Loop","type":"Road","km":"90","dislivello":"658 m","diff":"Facile","surface":"asfalto","hi":"Suvereto, Sassetta, Monteverdi Marittimo","url":"https://ridewithgps.com/routes/53934346"},
  ],
  "guida_pdf":"../guide-pdf/Ride-Base-Pack-Villaggio-Orizzonte.pdf",
 },
 {
  "slug":"villa-toscana","name":"Villa Toscana","town":"Venturina Terme · Val di Cornia","lat":43.033,"lng":10.606,
  "tagline":"Base tranquilla nel cuore della Val di Cornia",
  "intro":"A Venturina Terme, tra Costa degli Etruschi e colline: posizione riservata e accesso diretto a strade panoramiche secondarie e sterrati.",
  "site":"https://www.villatoscanavacanze.it/",
  "services":["Deposito bici sicuro","Area bike wash","Colazione presto / orari pasti flessibili","Lavanderia e asciugatura","Info percorsi e consigli locali","Parcheggio","Check-in/out flessibile"],
  "ride_pack":[
    {"name":"Suvereto & Sterpaia","type":"Gravel","km":"68","dislivello":"281 m","diff":"Facile","surface":"40% sterrato","hi":"Suvereto borgo medievale, Parco della Sterpaia","url":"https://ridewithgps.com/routes/53933155"},
    {"name":"Baratti, Populonia & Piombino","type":"Gravel","km":"55","dislivello":"589 m","diff":"Difficile","surface":"51% sterrato","hi":"Baratti, Populonia, Piombino, Piazza Bovio","url":"https://ridewithgps.com/routes/53933243?privacy_code=QM3Of2XWLB41w1n0wodqOW7JR5IgRWlt"},
    {"name":"Suvereto, Sassetta & the Hills","type":"Road","km":"89","dislivello":"598 m","diff":"Facile","surface":"asfalto","hi":"Suvereto, Sassetta, Monteverdi, Canneto","url":"https://ridewithgps.com/routes/53933290"},
    {"name":"Follonica & Montioni Park","type":"Road","km":"79","dislivello":"221 m","diff":"Facile","surface":"asfalto","hi":"Follonica, Parco di Montioni","url":"https://ridewithgps.com/routes/53933299?privacy_code=DJcGQ2OKwZydioFG0tWMmHVHF54ebMDt"},
  ],
  "guida_pdf":"../guide-pdf/Ride-Base-Pack-Villa-Toscana.pdf",
 },
 {
  "slug":"punta-ala","name":"PuntAla Camp & Resort","town":"Punta Ala · Castiglione della Pescaia","lat":42.811,"lng":10.741,
  "tagline":"Resort in pineta con Trail Center e spiaggia Bandiera Blu",
  "intro":"Campeggio 4 stelle in pineta costiera, spiaggia privata Bandiera Blu. Casa storica della MTB: nel 2013 ha ospitato il primo round dell'Enduro World Series. Trail Center, officina, noleggio e pump track permanente.",
  "site":"https://www.campingpuntala.it/",
  "services":["Punta Ala Trail Center con officina","Noleggio MTB / e-MTB / gravel / road","Tour guidati e shuttle","Pump track permanente","Deposito bici","2 ristoranti + beach bar + market","Alloggi: piazzole, mobile home, glamping"],
  "ride_pack":[
    {"name":"Tirli Loop","type":"Gravel","km":"54,5","dislivello":"767 m","diff":"Impegnativo","surface":"43% sterrato","hi":"Castiglione della Pescaia, Tirli, Cala Violina","url":"https://ridewithgps.com/routes/53993824"},
    {"name":"Castiglione Loop","type":"Gravel","km":"55,8","dislivello":"560 m","diff":"Facile","surface":"52% gravel","hi":"Castiglione, Pian d'Alma, Diaccia Botrona","url":"https://ridewithgps.com/routes/53993827"},
    {"name":"Marsiliana Road","type":"Road","km":"83,9","dislivello":"523 m","diff":"Facile · panoramico","surface":"asfalto","hi":"Maremma, strada della Marsiliana, Follonica","url":"https://ridewithgps.com/routes/53993830"},
    {"name":"The Tirli Climb","type":"Road","km":"60","dislivello":"633 m","diff":"Moderato","surface":"asfalto","hi":"Castiglione della Pescaia, salita di Tirli","url":"https://ridewithgps.com/routes/53994046"},
  ],
  "guida_pdf":"../guide-pdf/Ride-Base-Pack-Punta-Ala.pdf",
 },
]

# salva il file dati leggibile
with open(os.path.join(ROOT,"_dati-partner.json"),"w",encoding="utf-8") as f:
    json.dump({"territori":TERRITORI,"strutture":STRUTTURE},f,ensure_ascii=False,indent=2)

print("dati ok:",len(TERRITORI),"territori,",len(STRUTTURE),"strutture")
