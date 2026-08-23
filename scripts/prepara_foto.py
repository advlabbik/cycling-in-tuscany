#!/usr/bin/env python3
"""
Prepara le foto di un articolo per il repo.

Perche' esiste: il fotografo consegna file da 8-14 MB (lo shooting di Monterotondo
sono ~200 foto a ~10 MB l'una). Dentro git quei file ci restano per sempre, a ogni
versione, e il repo diventa ingestibile nel giro di pochi articoli. Le immagini che
il sito usa oggi stanno tutte fra 1 e 2 MB a 2400 px sul lato lungo: questo script
porta qualunque consegna a quello standard, con i nomi giusti e nella cartella giusta.

USO
    python scripts/prepara_foto.py <cartella-con-le-foto> <slug-articolo>

ESEMPIO
    python scripts/prepara_foto.py "D:/Consegne/caparzo" caparzo-brunello-estate-by-bike

Scrive in  src/assets/images/articoli/<slug>/  e stampa le righe di frontmatter
gia' pronte da incollare nell'articolo.

La foto di apertura: chiamala `hero` (hero.jpg, hero.png, HERO.jpeg...) nella cartella
di partenza. Se non c'e', lo script prende la prima orizzontale in ordine alfabetico
e lo dice.

Serve Pillow:  pip install pillow
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow. Installalo con:  pip install pillow")

# --- Lo standard del sito -----------------------------------------------------
# 2400 px e' la misura delle immagini gia' in repo (campiglia.jpg, hero.jpg,
# monterotondo.jpg e tutte quelle dei territori). L'hero e' un background-image
# generato a 1600 px: 2400 copre anche gli schermi ad alta densita' senza sprechi.
LATO_LUNGO = 2400
# Sotto questa misura la foto sgrana su un hero a tutta larghezza. Non si accetta.
LATO_LUNGO_MINIMO = 1600
QUALITA = 85
ESTENSIONI = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def elenco_foto(cartella: Path) -> list[Path]:
    return sorted(
        (p for p in cartella.iterdir() if p.is_file() and p.suffix.lower() in ESTENSIONI),
        key=lambda p: p.name.lower(),
    )


def prepara(origine: Path, destinazione: Path) -> tuple[int, int, float, bool]:
    """Ridimensiona e salva. Torna (larghezza, altezza, KB, era_troppo_piccola)."""
    with Image.open(origine) as im:
        # Raddrizza le foto scattate col telefono ruotato, poi butta l'EXIF:
        # i file dei fotografi portano dentro GPS e dati di scatto che non
        # c'e' motivo di pubblicare.
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")

        larghezza, altezza = im.size
        piccola = max(larghezza, altezza) < LATO_LUNGO_MINIMO

        if max(larghezza, altezza) > LATO_LUNGO:
            # thumbnail non ingrandisce mai: una foto piccola resta com'e'
            # invece di essere gonfiata a 2400 px di niente.
            im.thumbnail((LATO_LUNGO, LATO_LUNGO), Image.LANCZOS)

        # Salvando senza passare `exif=` il blocco di metadati non viene riscritto:
        # GPS e dati di scatto restano fuori dal file pubblicato.
        destinazione.parent.mkdir(parents=True, exist_ok=True)
        im.save(destinazione, "JPEG", quality=QUALITA, optimize=True, progressive=True)

        return (*im.size, destinazione.stat().st_size / 1024, piccola)


def main() -> int:
    if len(sys.argv) != 3:
        sys.exit(__doc__)

    sorgente = Path(sys.argv[1]).expanduser()
    slug = sys.argv[2].strip().strip("/")

    if not sorgente.is_dir():
        sys.exit(f"Non trovo la cartella: {sorgente}")

    radice = Path(__file__).resolve().parent.parent
    uscita = radice / "src" / "assets" / "images" / "articoli" / slug

    foto = elenco_foto(sorgente)
    if not foto:
        sys.exit(f"Nessuna immagine dentro {sorgente}")

    # L'hero: prima si cerca un file chiamato "hero", poi si ripiega sulla prima
    # orizzontale. Verticale come apertura non va: il ritaglio 1200x630 per le
    # anteprime social taglierebbe via mezza foto.
    hero = next((p for p in foto if p.stem.lower() == "hero"), None)
    scelto_da_noi = False
    if hero is None:
        for p in foto:
            with Image.open(p) as im:
                w, h = ImageOps.exif_transpose(im).size
            if w >= h:
                hero, scelto_da_noi = p, True
                break
    if hero is None:
        hero, scelto_da_noi = foto[0], True

    altre = [p for p in foto if p != hero]

    print(f"\n  {len(foto)} foto  ->  {uscita}\n")
    righe: list[tuple[str, str, str, str]] = []
    avvisi: list[str] = []

    w, h, kb, piccola = prepara(hero, uscita / "hero.jpg")
    righe.append(("hero.jpg", f"{w}x{h}", f"{kb:.0f} KB", hero.name))
    if piccola:
        avvisi.append(f"hero.jpg e' solo {w}x{h}: sotto {LATO_LUNGO_MINIMO} px sgrana in apertura. Chiedine una piu' grande.")
    if w < h:
        avvisi.append("hero.jpg e' verticale. In apertura serve orizzontale, altrimenti l'anteprima social taglia male.")

    for i, p in enumerate(altre, start=1):
        nome = f"{i:02d}.jpg"
        w, h, kb, piccola = prepara(p, uscita / nome)
        righe.append((nome, f"{w}x{h}", f"{kb:.0f} KB", p.name))
        if piccola:
            avvisi.append(f"{nome} e' solo {w}x{h}: va bene solo piccola nel corpo, non ingrandirla.")

    larghezza_nome = max(len(r[0]) for r in righe)
    for nome, dim, peso, originale in righe:
        print(f"  {nome:<{larghezza_nome}}  {dim:>11}  {peso:>9}   <- {originale}")

    totale = sum(float(r[2].split()[0]) for r in righe) / 1024
    print(f"\n  Totale: {len(righe)} file, {totale:.1f} MB")

    if scelto_da_noi:
        print("\n  ! Nessun file chiamato 'hero': ho preso la prima orizzontale in ordine alfabetico.")
        print("    Se ne vuoi un'altra, rinominala 'hero' nella cartella di partenza e rilancia.")

    if avvisi:
        print("\n  DA SISTEMARE")
        for a in avvisi:
            print(f"    - {a}")

    print("\n  Da incollare nel frontmatter dell'articolo:\n")
    print(f"heroImage: ../../assets/images/articoli/{slug}/hero.jpg")
    print("\n  (le altre si richiamano nel corpo con il percorso relativo allo stesso modo)\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
