#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Reprodukovatelný výřez hero fotky Filipa Lejčka.

Zdrojová fotka je reportážní záběr — vpravo sedí druhá osoba, jejíž koleno
se v pásu y 700–830 dotýká Filipova stehna. Souvislé komponenty ani eroze
je neoddělí (most je široký), proto vede pravou hranicí ručně odečtená
polyčára kopírující skutečný obrys.

Použití:
    python tools/vyrez-filip.py "cesta/ke/zdroji.jpeg"

Vyžaduje:  pip install rembg onnxruntime pillow scipy
"""

import os
import sys

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "img")
NAZEV = "filip-lejcek"

# Ořez zdroje na Filipa + jeho židli (souřadnice originálu 1066×1600)
BOX = (170, 250, 790, 1530)

# Pravá hranice výřezu — souřadnice uvnitř BOXu.
# Odečteno z masky: ruka končí na x=558, holeň 261–374,
# noha židle 387–415, druhá osoba začíná od x≈436.
HRANICE_Y = [  0, 505, 560, 585, 612, 642, 668, 695, 730, 780, 850, 950, 1050, 1130, 1180, 1280]
HRANICE_X = [578, 578, 548, 490, 496, 486, 450, 415, 385, 375, 380, 383,  378,  366,  358,  358]

MODEL = "isnet-general-use"   # jako jediný zachová i židli, human_seg ji odmaže
CILOVA_VYSKA = 1600
OKRAJ = 0.01
MOBIL_VYSKA = 760   # výška portrétního výřezu (hlava–kolena) pro telefony


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    if not os.path.isfile(src):
        sys.exit("Soubor neexistuje: " + src)

    print("Zdroj:", src)
    crop = Image.open(src).convert("RGBA").crop(BOX)
    print("  ořez na", crop.size)

    print("  odstraňuji pozadí (%s)..." % MODEL)
    cut = remove(crop, session=new_session(MODEL))

    arr = np.array(cut).astype(np.float32)
    h, w = arr.shape[:2]

    # ── odmazání druhé osoby polyčárou (3px náběh, ať hrana není břitvová)
    cuts = np.interp(np.arange(h), HRANICE_Y, HRANICE_X)
    xs = np.arange(w)[None, :]
    arr[:, :, 3] *= np.clip((cuts[:, None] - xs) / 3.0 + 1.0, 0.0, 1.0)

    # ── zbylé odřezky pryč, necháme jen hlavní komponentu
    mask = arr[:, :, 3].astype(np.uint8) > 100
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    main_lab = int(np.argmax(sizes)) + 1
    keep = ndimage.binary_dilation(lab == main_lab, iterations=2)
    arr[:, :, 3] = np.where(keep, arr[:, :, 3], 0)
    print("  komponent: %d, ponechána hlavní (%d px)" % (n, int(sizes[main_lab - 1])))

    out = Image.fromarray(arr.astype(np.uint8))

    # ── ořez na neprůhledný obsah
    bbox = out.getchannel("A").getbbox()
    if bbox:
        l, t, r, b = bbox
        dx, dy = int((r - l) * OKRAJ), int((b - t) * OKRAJ)
        out = out.crop((max(0, l - dx), max(0, t - dy),
                        min(out.width, r + dx), min(out.height, b + dy)))
        print("  ořez na obsah:", out.size)

    if out.height > CILOVA_VYSKA:
        out = out.resize((round(out.width * CILOVA_VYSKA / out.height), CILOVA_VYSKA),
                         Image.LANCZOS)
        print("  zmenšeno na", out.size)

    os.makedirs(IMG_DIR, exist_ok=True)
    soubory = []

    def uloz(obr, jmeno):
        cesta_png = os.path.join(IMG_DIR, jmeno + ".png")
        cesta_webp = os.path.join(IMG_DIR, jmeno + ".webp")
        obr.save(cesta_png, optimize=True)
        obr.save(cesta_webp, quality=90, method=6)
        soubory.extend([cesta_webp, cesta_png])
        return obr.size

    rozmer_desktop = uloz(out, NAZEV)

    # ── mobilní varianta: portrétní výřez hlava–kolena, na telefonu působí silněji
    mob = out.crop((0, 0, out.width, MOBIL_VYSKA))
    bb = mob.getchannel("A").getbbox()
    if bb:
        mob = mob.crop((max(0, bb[0] - 4), 0, min(mob.width, bb[2] + 4), MOBIL_VYSKA))
    rozmer_mobil = uloz(mob, NAZEV + "-mobil")

    print("\nHotovo:")
    for f in soubory:
        print("  %-28s %6.0f kB" % (os.path.basename(f), os.path.getsize(f) / 1024))
    print("\nV index.html nastav:")
    print('  desktop <source>/<img>  width="%d" height="%d"' % rozmer_desktop)
    print('  mobil   <source>        width="%d" height="%d"' % rozmer_mobil)
    print("V style.css u mobilního .hero__photo-layer:  aspect-ratio:%d / %d;"
          % rozmer_mobil)


if __name__ == "__main__":
    main()
