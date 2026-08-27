# Filip Lejček — hero sekce

Statický web, žádný build. Nahraje se kamkoliv (Vercel, Netlify, FTP, subdoména).

```
index.html            levá lišta + hero + Reference (pás log) + O mně
css/style.css         design tokeny + layout + responzivita
js/main.js            GSAP intro + scroll choreografie + reveal sekcí + lišta
fonts/                PP Neue Montreal (Book / Medium / Bold), self-host
img/filip-lejcek.*    hlavní hero fotka (WebP + PNG fallback)
img/filip-lejcek-mobil.*  portrétní výřez pro telefony
img/about-1.*         O mně — Filip na stadionu Sparty (WebP + JPG)
img/about-2.*         O mně — Filip ve studiu Hitrádia (WebP + JPG)
img/logos/            loga značek pro pás v sekci Reference
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
| Navigace | `.hero__nav` |

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
kompenzovat posun `.wordmark__inner` od `transform-origin`.

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

Písmo: **PP Neue Montreal** (Pangram Pangram) — shodné písmo jako
referenční web [heynesh.com](https://heynesh.com). Jedno písmo pro
nadpisy, značku i běžný text; kompletní česká diakritika. Soubory jsou
self-hostované v `fonts/` (`pp-neue-montreal-{book,medium,bold}.woff2`),
`@font-face` je v sekci 0 `css/style.css`, žádný externí CDN. Váhy
400 / 500 / 700 — proměnné `--f-display` a `--f-body` míří obě na
stejnou rodinu, oddělené zůstávají jen pro případ, že by nadpisy měly
někdy dostat vlastní řez.

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
| 20–42 % | značka zmizí (fade + jemné zmenšení) |

Kompaktní lišta po odscrollování hero (dřívější `.topbar`) byla odstraněna —
po scrollu pryč z hero sekce už na stránce není žádná navigace, dokud se
uživatel nevrátí nahoru.

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
| ≤ 980 px | jednosloupcový layout: hero se nepřipíná, fotka jde **mimo absolutní vrstvu do běžného toku pod obsah**, headline ztmavne na béžové, karty do mřížky, **pořadí obsahu je přeskládané (viz níže)** |
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

## 6. Sekce Reference (`#reference`)

Nekonečný pás log značek pod hero. Pohybová řeč podle
[heynesh.com](https://heynesh.com): štítek „Reference" najíždí šířkou
z 0 (`expo.inOut`), nadpis po řádcích zpod masky, pás decentně nafade
(vše přes ScrollTrigger v `buildBrands()` v `js/main.js`). Samotný
marquee jede v CSS (`@keyframes brands-marquee`, `translateX 0 → -50 %`,
52 s lineárně), pauza na hover, měkké okraje maskou, spotlight na najeté
dlaždici.

Loga jsou v `img/logos/` – 10× barevné rastrové PNG stažené z rozpracované
verze `filiplejcek.lovable.app` a zmenšené (dlouhá hrana ≤ 560 px), plus
`hc-sparta.svg` (jednopath „S", brand burgundy `#651b2d`, z Wikimedia
Commons). Celkem ~0,5 MB. Sedí na krémových dlaždicích, ve výchozím stavu
`grayscale` + ztlumená, hover je rozsvítí. Dvě identické skupiny 11
položek = bezešvá smyčka.

**Výměna / doplnění loga:** nový soubor do `img/logos/`, uprav `src`
`<img>` v [index.html](index.html) — **na dvou místech** (obě
`.brands__group`). Šířku dlaždice/logo ladí `.brand` a `.brand img`
v [css/style.css](css/style.css) (sekce 5.9). Styl `.brand--word`
(textová dlaždice) zůstává v CSS jako fallback, kdyby nějaké logo
dočasně chybělo — teď se nepoužívá.

- [ ] Rastrová loga jsou PNG s průhledností – zvážit WebP + `<picture>`
  jako u fotek (úspora ~60 %).
- [ ] Práva k logům – užití „značky, se kterými jsem spolupracoval";
  odpovědnost na straně Filipa.

## 7. Sekce O mně (`#o-mne`)

Dvousloupcový editorial: vlevo **překrývající se dvojice fotek**
(`img/about-1.*` Sparta jako dominantní, `img/about-2.*` Hitrádio menší
a „plovoucí" přes její pravý okraj — obě WebP + JPG fallback, dlouhá
hrana 1000 px, staženo z `filiplejcek.lovable.app`), vpravo text —
nadpis, čtyři odstavce a zvýrazněný „pull-quote" řádek s olivovým levým
pruhem. Pod 900 px jednosloupcově, fotky nahoře vedle sebe bez překryvu.

Animace (`buildAbout()` v `js/main.js`):
- **Reveal** — fotky vyjedou zpod masky (protipohyb `picture`/`img`),
  nadpis zpod masky, odstavce a highlight se staggerem.
- **Scroll parallax** — obě fotky se posouvají různou rychlostí
  (`y` scrub, opačná hloubka).
- **Pointer 3D náklon** (jen `hover:hover` + `pointer:fine`) — fotky
  reagují na pohyb myši nad `.about__media` náklonem `rotationX/Y` +
  `x` přes `gsap.quickTo`; menší „bližší" fotka reaguje ~2× víc.
  `.about__media` má proto `perspective` (na mobilu vypnutá).

Pozn.: masky používají `yPercent` + explicitní `y:0` v `gsap.set` —
jinak GSAP načte CSS `translate3d(0,…%,0)` jako pixelové `y` a tween
nemá co animovat (stejný trik jako u `.wordmark__l`).

Text i fotky jsou napevno v `index.html`. Ořez velké fotky drží
`object-position:50% 12%` (Filipův obličej v záběru).

## 8. Levá lišta (`#rail`)

Vzor podle heynesh.com: fixní svislá lišta u levého okraje, **jen desktop
≥ 1280 px**. V CSS je skrytá (`autoAlpha 0`); jakmile scroll překročí
~42 % hero sekce, `buildRail()` v `js/main.js` ji přes ScrollTrigger
sjede zleva dovnitř (`autoAlpha` + `x`), návrat nahoru ji zase schová.
Nahrazuje hero navigaci, která na scrollu mizí.

Skladba jako na referenci — stack matných „skleněných" panelů na béžové
(`rgba(240,237,228,.68)` + `blur(15px)`, 8px rádius, světlý obrys, bez
stínu), akcent olivová (u heynesh žlutá):

1. **`.rail__id`** — jako `.nav-profile` na heynesh.com: horní řádka
   (`.rail__id-top`) = olivový box `LEJČEK` + dvě sociální ikony
   (`.rail__social`, zaoblené čipy 22 px), pod tím eyebrow
   `profesionální moderátor` a krátký popis `.rail__bio`
   > Odkazy v `.rail__social`: `instagram.com/filipkoozy/` a
   > `facebook.com/filip.lejcek/`.
2. **`.rail__stats`** — `150+` / `8` (čísla olivově) + popisky
3. **`.rail__nav`** — 7 položek, VERZÁLKY (700) + ikona v malém zaobleném
   „čipu" (`.rail__nav-ico`) vlevo; aktivní sekce = plná olivová pilulka
   (`.is-active`, ScrollTrigger per odkaz)
4. dole (`margin-top:auto` na `.rail__logos`): mini pás log →
   e-mail pill → plný olivový CTA `Nezávazná poptávka` → `#kontakt`

Mini pás log (`.rail__logos`) je jako `.nav-comapny-wrap` na heynesh.com:
úzký proužek nad e-mailem, monochromatická loga (`grayscale + opacity .5`,
výška 13 px, soubory z `img/logos/`), nekonečná CSS smyčka (`@keyframes
rail-logos`, `translateX 0 → -50 %`, 22 s), měkké okraje maskou. Dvě
identické skupiny = bezešvá smyčka. Dekorativní (`aria-hidden`) —
přístupný seznam značek je v sekci Reference.

CTA má na hover **„roll" textu po slovech** (`railCtaHover()` v `main.js`) —
stejný efekt jako `[data-button-hover]` na heynesh.com: JS rozdělí text
na slova ve dvou vrstvách v masce, na `mouseenter` původní řádek vyjede
nahoru (`yPercent -100`) a klon nahoru zespodu (`100 → 0`), po slovech se
staggerem `.05`, `power2.out`. Směr se s každým hoverem střídá. Bez posunu
ani změny pozadí (jako referenční tlačítko). Jen desktop / přesný kurzor.

Nad CTA je **e-mail pill** (`.rail__email`, `railEmailCopy()`) — stejné
chování jako `.nav-email-item` na heynesh.com: hover ukáže tooltip nad
pilulkou, klik zkopíruje adresu (`navigator.clipboard.writeText`, fallback
přes `execCommand`), tooltip změní text na „Zkopírováno", olivové pozadí
a „pop" fajfky (`back.out(1.7)`); `mouseleave` vše resetuje. Pilulka je
`<button>` (klávesnicově ovladatelná, `focus`/`blur` = totéž co hover).

> ⚠️ **`info@filiplejcek.cz` je zástupná adresa.** Skutečnou dej do
> `.rail__email-addr` v [index.html](index.html) — jen na jednom místě.

Aby lišta nekryla obsah, existuje token **`--rail-space`**: `var(--pad)`
by default, na `≥ 1280 px` `clamp(292px, 21vw, 322px)` (šířka lišty +
odsazení + mezera). Kdo ho používá:
- `.about__inner` — `padding-left: var(--rail-space)` + `max-width: 1440px`
- `.brands__marquee` — levý úsek masky sahá po `--rail-space`, takže
  první plné logo je až za lištou; vpravo pás dál „vytéká"

**Každá další sekce s obsahem u levého okraje musí místo levého `--pad`
použít `var(--rail-space)`** (viz sekce 9).

## 9. Portfolio služeb (`#portfolio`)

Pohybová řeč podle „About me" na heynesh.com: svislá **„scrollující
čára"** ve středu (`.services__line-fill`), která se dokresluje podle
scrollu (`scaleY 0 → 1`, `scrub`), a 8 služeb střídavě po stranách. Každá
služba při najetí naběhne (`opacity + y + scale`, `expo.out`), nadpis
vyjede zpod masky (`yPercent`) a tečka na čáře „lupne" (`back.out`).
Řízení: `buildServices()` v `js/main.js`.

Layout: `.services__item` je grid `1fr | čára | 1fr`; liché položky vlevo
(zarovnané doprava), sudé vpravo — přes `:nth-of-type` (čára je první
dítě `.services__timeline`, položky jsou `<article>`). Pod 860 px čára
doleva, vše jednosloupcově. Na `≥ 1280 px` `.services__inner` používá
`var(--rail-space)` (kvůli liště).

> ⚠️ Popis u služby **04 „Rádio a televize"** je zatím shodný se
> službou 06 (svatba) — vypadá to na omylem zkopírovaný text. Uprav
> `.services__desc` u 4. `<article>` v [index.html](index.html).

## 10. Co zbývá

- [x] Hero fotka (desktop + mobilní varianta)
- [x] Sekce Reference (pás log)
- [x] Sekce O mně
- [x] Levá lišta (po hero)
- [x] Portfolio služeb
- [ ] Opravit popis služby 04 (viz výše)
- [ ] Potvrdit čísla — `150+ akcí` a `8 let` jsou zástupné (hero karty i lišta)
- [ ] Doplnit `img/og-image.jpg` (1200×630) pro sdílení na sociálních sítích
- [ ] Navazující sekce (foto, video, kontakt) — u každé použít vlevo
  `var(--rail-space)` místo `--pad` kvůli liště (viz sekce 8)

Kotvy v navigaci (`#o-mne`, `#portfolio`, `#foto`, `#video`, `#reference`,
`#kontakt`) čekají — `#reference`, `#o-mne` a `#portfolio` jsou hotové;
lišta na ně odkazuje už teď.
