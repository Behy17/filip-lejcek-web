#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Reprodukovatelny vyrez hero fotky Filipa Lejcka (varianta 2 — stadion).

Zdroj je reportazni zaber na stadionu: Filip sedi, mluvi do mikrofonu,
kolem nej rozostrene hlediste. Vlevo dole a vpravo je tmavy stolek /
konstrukce — nejsou spojene s postavou, takze je odstrani filtr na
nejvetsi souvislou komponentu.

Vystup: vyrez po pas (jak je postava naframovana v originalu), bez pozadi,
oriznuty tesne na neprubuznY obsah. Dve velikosti (desktop + mobil).

Pouziti:
    python tools/vyrez-filip.py "C:/Users/studio/Desktop/WhatsApp Image ....jpeg"

Vyzaduje:  pip install rembg onnxruntime pillow scipy
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

MODEL = "isnet-general-use"     # konzistentni s puvodnim vyrezem
CILOVA_VYSKA = 1500             # desktop (retina rezerva)
MOBIL_VYSKA = 950              # mensi soubor pro telefony
OKRAJ = 0.02                   # dech po stranach a dole
NADHLAVI = 0.06                # navic pruhledne misto nad hlavou (at neni zahlavi orezane naostro)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    if not os.path.isfile(src):
        sys.exit("Soubor neexistuje: " + src)

    print("Zdroj:", src)
    im = Image.open(src).convert("RGBA")
    print("  rozmer:", im.size)

    print("  odstranuji pozadi (%s, alpha matting)..." % MODEL)
    cut = remove(
        im,
        session=new_session(MODEL),
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=6,
    )

    arr = np.array(cut).astype(np.float32)

    # ── necháme jen hlavní souvislou komponentu (spadne stolek v rozích)
    mask = arr[:, :, 3].astype(np.uint8) > 110
    lab, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        main_lab = int(np.argmax(sizes)) + 1
        keep = ndimage.binary_dilation(lab == main_lab, iterations=2)
        arr[:, :, 3] = np.where(keep, arr[:, :, 3], 0)
        print("  komponent: %d, ponechana hlavni (%d px)" % (n, int(sizes[main_lab - 1])))

    # ── lehke stazeni alpha, at nezustane svetly lem z bileho tricka / hlediste
    a = arr[:, :, 3] / 255.0
    a = np.clip((a - 0.04) / 0.92, 0.0, 1.0)
    arr[:, :, 3] = a * 255.0

    out = Image.fromarray(arr.astype(np.uint8))

    # ── ořez na neprůhledný obsah + průhledné nadhlaví, ať hlava nesedí na hraně
    bbox = out.getchannel("A").getbbox()
    if bbox:
        l, t, r, b = bbox
        dx = int((r - l) * OKRAJ)
        dy = int((b - t) * OKRAJ)
        top_pad = int((b - t) * NADHLAVI)
        out = out.crop((max(0, l - dx), t - top_pad,
                        min(out.width, r + dx), min(out.height, b + dy)))
        print("  orez na obsah + nadhlavi:", out.size)

    os.makedirs(IMG_DIR, exist_ok=True)
    soubory = []

    def uloz(obr, jmeno, vyska):
        if obr.height > vyska:
            obr = obr.resize(
                (round(obr.width * vyska / obr.height), vyska), Image.LANCZOS
            )
        cesta_png = os.path.join(IMG_DIR, jmeno + ".png")
        cesta_webp = os.path.join(IMG_DIR, jmeno + ".webp")
        obr.save(cesta_png, optimize=True)
        obr.save(cesta_webp, quality=88, method=6)
        soubory.extend([cesta_webp, cesta_png])
        return obr.size

    rozmer_desktop = uloz(out, NAZEV, CILOVA_VYSKA)
    rozmer_mobil = uloz(out, NAZEV + "-mobil", MOBIL_VYSKA)

    print("\nHotovo:")
    for f in soubory:
        print("  %-28s %6.0f kB" % (os.path.basename(f), os.path.getsize(f) / 1024))
    print("\nV index.html nastav width/height u <source>/<img>:")
    print("  desktop  %d x %d" % rozmer_desktop)
    print("  mobil    %d x %d" % rozmer_mobil)
    print("V style.css:")
    print("  desktop .hero__photo-layer picture  aspect-ratio:%d / %d;" % rozmer_desktop)
    print("  mobil   .hero__photo-layer          aspect-ratio:%d / %d;" % rozmer_mobil)


if __name__ == "__main__":
    main()
