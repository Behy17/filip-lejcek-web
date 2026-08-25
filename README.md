# Filip Lejček — hero sekce

Statický web, žádný build. Nahraje se kamkoliv (Vercel, Netlify, FTP, subdoména).

```
index.html            hero sekce
css/style.css         design tokeny + layout + responzivita
js/main.js            GSAP intro + scroll choreografie
img/filip-lejcek.*    hlavní fotka — desktop (WebP + PNG fallback)
img/filip-lejcek-mobil.*  portrétní výřez pro telefony
tools/vyrez-filip.py  reprodukovatelný výřez fotky
```

Lokální náhled:

```bash
python -m http.server 5173
```

**Po úpravě `js/main.js`:** prohlížeče (i lokální náhledy) umí `main.js`
mezipaměťovat i přes tvrdý reload — projeví se to jako by se změna
neaplikovala, i když je soubor na disku správně. `index.html` proto
načítá skript s verzí (`main.js?v=2`) — po další úpravě `main.js`
zvyš číslo, ať je jasné, že jde o nový obsah.

---

## 1. Fotka

Hotová. Ze zdrojového reportážního záběru je vyřezaný Filip i s barovou židlí,
druhá osoba odstraněná.

| Soubor | Rozměr | Kde se použije |
|---|---|---|
| `img/filip-lejcek.webp` (82 kB) | 538×1178 | desktop a tablet — celá postava na židli |
| `img/filip-lejcek-mobil.webp` (53 kB) | 535×760 | ≤ 720 px — portrétní výřez hlava–kolena |

PNG varianty jsou fallback pro prohlížeče bez WebP. Správnou verzi vybírá
`<picture>` přes `media`, přednačítá se jen ta relevantní.

Výřez je reprodukovatelný:

```bash
python tools/vyrez-filip.py "C:/cesta/ke/zdroji.jpeg"
```

Skript odstraní pozadí modelem `isnet-general-use` (jako jediný zachová židli —
`u2net_human_seg` ji odmaže a Filip pak visí v prázdnu), odmaže druhou osobu
ruční polyčárou a vyexportuje obě varianty. Souvislé komponenty ani eroze
druhou osobu neoddělí — její koleno se Filipova stehna dotýká v pásu y 700–830
příliš širokým mostem, proto je hranice odečtená z masky ručně
(`HRANICE_X` / `HRANICE_Y` v hlavičce skriptu).

Vyžaduje jednorázově:

```bash
pip install rembg onnxruntime scipy
```

**Rozlišení:** zdroj má 1066×1600, po ořezu zbylo 538×1178. Na displeji
1440×900 se fotka vykresluje 411×900, tedy se zmenšením na 0,76 — ostré.
Na retina displejích už se ale mírně dopočítává. Pokud existuje originál
ve vyšším rozlišení, stačí ho prohnat stejným skriptem.


---

## 2. Změna textů

Všechno je přímo v `index.html`, žádné CMS:

| Co | Kde |
|---|---|
| Obří značka `LEJČEK` | `.wordmark__inner` — každé písmeno vlastní `<span>` (kvůli animaci) |
| Headline | `.hero__headline` — každý řádek vlastní `<span class="ln">` |
| Tlačítka | `.hero__cta` |
| Text vlevo dole | `.hero__kicker` |
| Text vpravo dole | `.hero__lede` |
| Čísla v kartách | `.card--wide`, `.card--tall` |
| Vlastnosti | `.card--traits` |
| Navigace | `.hero__nav` a `.topbar__nav` |

**Pozor u víceřádkových textů:** každý řádek musí zůstat obalený
`<span class="ln"><span class="ln__i">…</span></span>`. Vnější `span` je maska,
vnitřní se animuje — bez toho text nenajede.

Značka se sází automaticky na přesnou šířku kontejneru (`fitWordmark()`
v `main.js`), takže jde změnit počet písmen bez ručního dolaďování velikosti.

**Diakritika (Č, Ž, Š, Ř, Ď, Ť, Ň):** záměrně useknutá. `.wordmark` má
těsný `line-height:.76` (tight display crop) kvůli tomu, jak vypadá velká
značka — háček nad velkými písmeny (sahá ~0,22 em nad kapitálku) se do
tak těsného řádku nevejde a `overflow:hidden` (maska pro reveal animaci)
ho ořízne. „LEJČEK" se tak zobrazuje vizuálně jako „LEJCEK". Jde o vědomé
rozhodnutí ve prospěch těsného stříhu, ne o chybu — pokud by se to
v budoucnu mělo změnit, řešení je přidat `padding-top` (uvnitř
clip-boxu, takže vytvoří skutečný prostor navíc bez zásahu do
line-height ostatních písmen) a v `measureMorph()` v `main.js`
kompenzovat posun `.wordmark__inner` od `transform-origin`, jinak
scroll-morph do loga v topbaru přestane sedět.

---

## 3. Barvy a typografie

Vše jsou CSS proměnné na začátku `css/style.css`:

| Token | Hodnota | Použití |
|---|---|---|
| `--bg` | `#D5CFBE` | béžová základna |
| `--ink` | `#1C1E17` | text |
| `--cream` | `#F8F7F3` | text přes fotku |
| `--olive` | `#4F5D3A` | akcent, primární CTA |
| `--olive-dk` | `#3A4529` | hover |

Písma: **Instrument Sans** (nadpisy, značka) + **Inter** (text), obojí
s kompletní českou diakritikou.

Kontrasty ověřeny výpočtem (WCAG kontrastní poměr, ne jen okem): 5,3–10,82 : 1
napříč všemi textovými prvky a scénáři pozadí, všechny páry splňují WCAG AA,
většina i AAA. Krémový headline nad fotkou má pod sebou měkké radiální
podsvícení (`.hero__center::before`), které drží kontrast bez ohledu na to,
jak světlé je pod ním místo fotky.

Dvě místa měla původně nedostatečný kontrast a byla opravena:

- **Sklo karet** (`--glass`) bylo světlé (`rgba(194,184,172,.30)`) — počítalo
  s tím, že karty budou stát na tmavé fotce jako v referenci. Ve skutečnosti
  stojí vedle fotky na světlé béžové, takže krémový text na světlém skle
  vycházel na kontrast ~1,5:1 (prakticky nečitelné). Sklo je teď tmavé
  (`rgba(28,30,23,.65)`), funguje spolehlivě bez ohledu na pozadí.
- **Sekundární tlačítko** (`.btn--ghost`) mělo světlý tón (10 % bílá) a
  spoléhalo na tmavý scrim za fotkou. V místě, kam padá (mimo Filipovu
  siluetu), byl scrim slabý a kontrast klesal k ~3,9:1. Tlačítko má teď
  tmavý skleněný tón (34 % černá) stejné rodiny jako karty.

---

## 4. Animace

Intro (po načtení fontů):

1. Písmena značky vyjedou zpod masky (stagger 55 ms)
2. Fotka nasvítí a dojede z měřítka 1,06
3. Headline po řádcích
4. Navigace, tlačítka, karty, spodní texty

Scroll (jen desktop ≥ 981 px):

| Postup | Co se děje |
|---|---|
| 0–14 % | mizí hero navigace |
| 4–40 % | karty se zmenší a odletí do stran |
| 6–26 % | spodní texty vyjedou pod masku |
| 14–52 % | headline a CTA odplují |
| 0–92 % | fotka parallax + ztmavení |
| 0–88 % | **značka se scvrkne přesně do loga v topbaru** |
| 92 % | předání štafety — topbar nastoupí, značka zmizí |

Cílová geometrie loga se měří za běhu, takže morph sedí na pixel při
libovolné šířce okna i po změně velikosti.

Animují se **jen `transform` a `opacity`** — žádné layouty, žádný CLS.
`will-change` se po dohrání intra uvolní.

### Přístupnost pohybu

Při `prefers-reduced-motion: reduce` se scroll choreografie vůbec nepostaví,
hero se nepřipíná a obsah je rovnou na svém místě. Bez JS (nebo když se
nenačte GSAP) se web zobrazí staticky a kompletní.

---

## 5. Responzivita

| Šířka | Chování |
|---|---|
| ≥ 1181 px | plný layout jako reference — karty lemují postavu, fotka jako absolutní vrstva vzadu |
| 981–1180 px | karty se přesunou k okrajům |
| ≤ 980 px | jednosloupcový layout: hero se nepřipíná, fotka jde **mimo absolutní vrstvu do běžného toku pod obsah**, headline ztmavne na béžové, karty do mřížky, navigaci přebírá sticky topbar, **pořadí obsahu je přeskládané (viz níže)** |
| ≤ 720 px | dlouhý popisný odstavec (`.hero__lede`) se skrývá — zůstává jen krátký podpis |
| ≤ 400 px | karta s vlastnostmi (`.card--traits`) přejde na jeden sloupec — stat karty (`.cards-left`) zůstávají 2sloupcové i tady |

**Proč hranice 980, ne 720:** nad 720 px se fotka dřív pořád chovala jako
full-bleed vrstva přes celou (mnohem vyšší, protože obsah je poskládaný
pod sebe) hero sekci na tabletu. Spodní text tak místy padal přímo na
Filipovo tmavé sako — ink text na ink fotce, kontrast ~1,1:1. Sjednocením
hranice na 980 px (stejně jako už dřív používal `main.js` pro scroll
choreografii) fotka na tabletu skončí mimo tok textu, stejně jako na
mobilu.

**Pořadí obsahu na ≤ 980 px (`order` v [css/style.css:611](css/style.css:611)):**
značka → headline/CTA → krátký podpis → **fotka** → karty. Původně ležela
fotka (přes `order:99`) až za dvěma odstavci textu a třemi kartami — na
375px displeji to bylo 930 px scrollu, přes celou obrazovku, než byl
Filip vůbec vidět. Karty jsou doplňkové (čísla, osobnostní přívlastky),
klidně počkají za fotkou; fotka je hlavní důvod důvěry a měla by se
objevit v první obrazovce. Po přeskládání a skrytí dlouhého odstavce na
telefonech (viz níže) je fotka na 375×812 vidět na y=470 — bez scrollu.

**Dlouhý popisný odstavec zmizí na telefonech, ne na tabletu:** tablet
(721–980 px) má na pět řádků textu dost místa a zůstává beze změny; na
užším telefonu by ale jen oddaloval fotku a přidával skenování navíc.
Krátký podpis („Profesionální moderátor. To je Filip Lejček.“) nese tu
samou informaci v jedné větě a zůstává vždy.

Ošetřeno i landscape na nízkých displejích a `env(safe-area-inset-*)`
kvůli výřezu a gesture baru.

---

## 6. Co zbývá

- [x] Fotka vyřezaná a nasazená (desktop + mobilní varianta)
- [ ] Potvrdit texty a čísla — `250+ akcí` a `12 let` jsou zástupné
- [ ] Doplnit `img/og-image.jpg` (1200×630) pro sdílení na sociálních sítích
- [ ] Navazující sekce (o mně, portfolio, foto, video, reference, kontakt)

Kotvy v navigaci (`#o-mne`, `#portfolio`, `#foto`, `#video`, `#reference`,
`#kontakt`) na tyto sekce už čekají.
