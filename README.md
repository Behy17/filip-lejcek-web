# Filip Lejček — hero sekce

Statický web, žádný build. Nahraje se kamkoliv (Vercel, Netlify, FTP, subdoména).

```
index.html            levá lišta + hero + Reference (pás log) + O mně
css/style.css         design tokeny + layout + responzivita
js/main.js            GSAP intro + scroll choreografie + reveal sekcí + lišta
fonts/                PP Neue Montreal (Book / Medium / Bold), self-host
img/filip-lejcek.*    hlavní hero fotka (WebP + PNG fallback)
img/filip-lejcek-mobil.*  tentýž výřez po pas, menší soubor pro telefony
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

Hotová. Ze stadionového reportážního záběru (Filip sedí, mluví do mikrofonu,
za ním rozostřené hlediště) je vyříznutá postava po pas, pozadí odstraněné.

| Soubor | Rozměr | Kde se použije |
|---|---|---|
| `img/filip-lejcek.webp` (183 kB) | 1244×1500 | ≥ 981 px — výřez po pas, bez pozadí |
| `img/filip-lejcek-mobil.webp` (87 kB) | 788×950 | ≤ 980 px — tentýž výřez, menší soubor |

PNG varianty jsou fallback pro prohlížeče bez WebP. Správnou verzi vybírá
`<picture>` přes `media`, přednačítá se jen ta relevantní. URL nesou
`?v=2` — bez toho prohlížeče držely starý (jinak pojmenovaný) výřez z cache.

**Kompozice na ≥ 981 px** (jako [heynesh.com](https://heynesh.com) —
velký portrét po pas): rozměr sedí na `<picture>` (`position:absolute`,
`left:50%`, `bottom:calc(var(--pad) * -1)`,
`height:clamp(640px, 104vh, 1120px)`, `aspect-ratio:1244/1500`,
`translateX(-50%)`), takže postava je kotvená ke spodní hraně, klín
„vytéká" pod fold a ořízne ho `overflow:hidden` na `.hero__sticky`.
Rozměr je záměrně mimo `.hero__photo` (`<img>`), aby zůstaly netknuté
GSAP transformace (reveal, `scale`, parallax). Blok je uvozený
`@media (min-width:981px)`; mobil používá tentýž výřez v běžném toku
(`.hero__photo-layer` má `aspect-ratio:788/950`).

Výřez je reprodukovatelný:

```bash
python tools/vyrez-filip.py "C:/cesta/ke/zdroji.jpeg"
```

Skript odstraní pozadí modelem `isnet-general-use` s alpha mattingem,
nechá jen největší souvislou komponentu (spadne tmavý stolek v rozích),
lehce stáhne alpha kanál proti světlému lemu z bílého trička a hlediště,
ořízne těsně na obsah + přidá průhledné nadhlaví a vyexportuje obě
velikosti. Klíčové konstanty jsou v hlavičce skriptu
(`CILOVA_VYSKA`, `MOBIL_VYSKA`, `OKRAJ`, `NADHLAVI`).

Vyžaduje jednorázově:

```bash
pip install rembg onnxruntime pillow scipy
```

**Rozlišení:** zdroj má 1634×1840, po ořezu (obsah + nadhlaví) 1244×1500.
Na běžném desktopu se výřez vykresluje ~700–760 px na šířku, na retině
je rezerva. Vyšší originál stačí prohnat stejným skriptem.


---

## 2. Změna textů

Všechno je přímo v `index.html`, žádné CMS:

| Co | Kde |
|---|---|
| Obří značka `LEJČEK` | `.wordmark__inner` — každé písmeno vlastní `<span>` (kvůli animaci) |
| Headline | `.hero__headline` — každý řádek vlastní `<span class="ln">` |
| Tlačítka | `.hero__cta` — obě jsou `.flow-btn` (text ve `.flow-btn__txt`) |
| Text vlevo dole | `.hero__kicker` |
| Text vpravo dole | `.hero__lede` |
| Čísla v kartách | `.card--wide`, `.card--tall` |
| Vlastnosti | `.card--traits` |
| Navigace (desktop) | `.hero__nav` |
| Horní lišta (mobil) | `.hero__bar` — značka, CTA „Poptávka", tlačítko menu |
| Mobilní menu | `#mnav` (`.mnav__links`) |

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
- **Hero CTA tlačítka** jsou teď obě `.flow-btn` (stejná animace jako CTA
  v kontaktu a patičce — na hover z obrysu vyroste olivový kruh, text se
  posune, šipky se prohodí, rohy na 12 px). Nad fotkou (`@media
  (min-width:981px)`) mají krémový text, světlý obrys a jemné tmavé sklo
  (`rgba(20,22,17,.30)` + blur), ať drží kontrast i bez hoveru; na mobilu
  (béžová, tmavý text) používají základní styl `.flow-btn`. Magnetický
  efekt (`magneticCta()`) na nich zůstává. Staré třídy `.btn` /
  `.btn--primary` / `.btn--ghost` už web nepoužívá.

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
| ≥ 981 px | plný layout jako reference — stat karty (`.cards-left`) u levého okraje, `.card--traits` u pravého, mimo tělo postavy; fotka jako absolutní vrstva vzadu; hero se připíná (`position:sticky`, 100 svh) |
| 981–1180 px | karty ještě těsněji k okrajům (`var(--pad)`) |
| ≤ 980 px | **mobilní hero podle reference** — viz níže |

### Mobilní hero (≤ 980 px)

Přestavěno na **jednu obrazovku, vše absolutně** (jako mobilní heynesh),
`display:block` na `.hero__sticky`, `height:100svh` (`min 600` / `max 940`),
`overflow:hidden`. Rozvržení shora dolů:

1. **Horní lišta** `.hero__bar` (`z-index:--z-nav`) — značka „Filip Lejček"
   (tmavá pilulka), CTA „Poptávka" (olivová pilulka, `margin-left:auto`),
   tlačítko menu `.hero__bar-menu` (mřížka 2×2). Desktop lišta je
   `display:none`, `.hero__nav` naopak jen na desktopu.
2. **Wordmark** `.wordmark` absolutně nahoře, `color:var(--olive)`, `z-index`
   pod fotkou (`--z-wordmark:2 < --z-photo:3`) — vykoukne jen horních ~45 %.
3. **Fotka** `.hero__photo-layer` absolutně přes celou plochu
   (`top:clamp(88px,17.5vh,142px)` → spodní hrana), `object-fit:cover`,
   silnější spodní scrim kvůli bílému headline.
4. **Karta vlastností** `.card--traits` — absolutně vlevo přes fotku,
   `ul` jednosloupcově. **Stat „8+"** `.card--tall` — absolutně vpravo.
   Karty jsou tmavé sklo (`rgba(16,18,12,.44)` + blur, cream text),
   ikonky `--olive-lt`. Wrappery `.hero__cards` / `.cards-left` jsou
   `position:static` / `display:contents`, děti se pozicují samostatně
   vůči `.hero__sticky`.
5. **Headline** `.hero__center` absolutně v dolní třetině přes fotku,
   `color:var(--cream)` + text-shadow (`justify-self:stretch` kvůli
   základnímu `justify-self:center`). `.hero__cta` je `display:none`
   (CTA je v liště). `.hero__bottom` (podpis + odstavec) taky skryté —
   referenční mobilní layout je nemá.
6. **Stat „150+"** `.card--wide` absolutně vlevo dole, s ikonkou mikrofonu
   (`.card--wide .card__ico`, na desktopu `display:none`).

**Mobilní menu** `#mnav` (`div.mnav` za hero v DOM): fixní overlay přes
celou plochu, béžové pozadí, velké odkazy na sekce + Instagram/Facebook.
Otevírá `mobileMenu()` v `main.js` — `hidden` toggle + `.is-open`
(fade), zámek scrollu (`documentElement.style.overflow`), zavření
křížkem / Esc / kliknutím na odkaz. Na desktopu `display:none`.

Ošetřeno `env(safe-area-inset-*)` (lišta, spodní karta, panel menu).
Reduced-motion: `min-height:100svh` drží výšku i s `height:auto`.

---

## 6. Pás log značek (`.brands`, bez kotvy)

Nekonečný pás log značek pod hero. **Sekce nemá `id`** — kotva
`#reference` teď míří na recenze (viz sekce 12). Marquee jede v CSS
(`@keyframes brands-marquee`, `translateX 0 → -50 %`, 52 s lineárně),
pauza na hover, měkké okraje maskou, spotlight na najeté dlaždici; pás
decentně nafade při vjezdu do viewportu (`buildBrands()` v `js/main.js`).

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

## 10. Fotogalerie (`#foto`)

Podle komponenty **3d-parallax-unfurling-gallery** (21st.dev), přepsáno
z Reactu/framer-motion do GSAP. Sekce je vysoká `520vh`, vnitřek
přišpendlený přes CSS `position: sticky` (`.gallery__pin`). Scrubovaná
timeline (`buildGallery()` v `js/main.js`):

1. **Rozbalení panelu** (0 → 15 %): tmavý zaoblený panel `.gallery__banner`
   se z odsazení `9vh / 5vw` a rádiusu roztáhne na celou plochu
   (`top/left/right/bottom → 0`, `border-radius → 0`, `border → 0`).
2. **3D mřížka** (15 → 100 %): `.gallery__matrix` (`transform-style:
   preserve-3d`, `perspective` na `.gallery__stage`) odrotuje z
   `rotateX 25° / rotateY -45° / rotateZ 15° / translateZ -800` do skoro
   roviny (`4° / -8° / 2° / 0`).
3. **Paralaxa sloupců**: 4 sloupce jedou různou rychlostí (`yPercent`
   -40…+20). JS obsah každého sloupce jednou naklonuje, ať 3D mřížka
   drží výšku.

Titulek `.gallery__title` vyjede zpod masky a při rozjezdu mřížky zmizí.

Pod **900 px** a při `prefers-reduced-motion` → klidná mřížka bez pinu
a 3D: 2 sloupce (`display: contents` na `.gallery__col`), pod 520 px
1 sloupec, tmavé pozadí `#141410`.

**Lightbox** (`galleryLightbox()` v `js/main.js`): klik na fotku ji
zvětší v překryvu. Seznam se dedupuje podle `src`, takže klonované
dlaždice míří na správnou fotku (12 unikátních). Listování šipkami
i klávesami ←/→ (s přetočením), zavření křížkem / klikem mimo / Esc,
zámek scrollu (`html { overflow: hidden }`) po dobu otevření. Styly
`.lightbox*` v [css/style.css](css/style.css).

**Fotky:** `img/gallery/foto-01…12.{jpg,webp}` — 12 skutečných fotek
(zdroj `C:\Users\studio\Desktop\Filip Lejček fotky`, zmenšeno na dlouhou
hranu 1280 px, `.webp` + `.jpg` progressive). Rozdělení do sloupců:
sl. 1 = 01/05/09, sl. 2 = 02/06/10, sl. 3 = 03/07/11, sl. 4 = 04/08/12.
Přidání další fotky = nový pár `foto-NN.{jpg,webp}` + `<figure>` do
příslušného `.gallery__col` (JS si sloupce sám naklonuje na výšku).

## 11. Video prezentace (`#video`)

Podle komponenty **video-player** (21st.dev / chetanverma16), přepsáno
z Reactu/framer-motion do vanilla JS (`buildVideos()` +
`initVideoPlayer()` v `js/main.js`). **Tři přehrávače (`.vplayer`)
vedle sebe** — `.videos__inner` je `display:grid;
grid-template-columns:repeat(3,1fr)`, pod 720 px se skládají pod sebe
(`1fr`). Bez čísel a linek (dřív `.videos__head` — odstraněno).

- **Ovládání** (`.vplayer__controls`): scrub lišta (klik = seek,
  ←/→ = ±5 s), play/pauza (klik na video / velké „play" uprostřed /
  tlačítko), mute + lišta hlasitosti, rychlosti 0,5 / 1 / 1,5 / 2×.
  Na myši se panel ukazuje při najetí / při pauze / při fokusu, na
  dotyku je vždy vidět. V řadě jsou přehrávače úzké, takže
  `@media (min-width:721px)` panel zkompaktní (menší mezery, užší
  hlasitost, menší časy).
- **Jen jedno naráz**: spuštění jednoho přehrávače pauzne ostatní.
- `#t=0.1` ve `src` vykreslí první snímek jako poster
  (`preload="metadata"`).
- Reveal přehrávačů přes ScrollTrigger per `.videos__item`
  (`expo.out`, stagger `idx * 0.12 s`).

**Formát přehrávače:** svislý (telefon), jednotný `aspect-ratio:1/2`
na všech třech (kvůli srovnaným výškám v řadě) + `.vplayer__video`
`object-fit:cover`, takže **žádné černé pruhy** (ani CSS pillarbox
u svislých videí, ani „zapečený" pruh z video-1, což je 16:9 soubor
se svislým obsahem pillarboxovaným natvrdo v pixelech — `1/2` ořez ho
odřízne). `background` je `var(--bg)`, aby krátký výpadek při načítání
ladil s pozadím. Videa 2 a 3 jsou nativně svislá (540×960 / 464×832),
`1/2` je oproti jejich poměru ořízne shora/zdola o ~5 %.

**Videa:** `video/video-1…3.mp4` (zdroj `Desktop\show-1/5/6.mp4`,
zkopírováno beze změny — bez ffmpeg; ~5 / 8,5 / 12 MB, `moov` atom
vepředu, takže se dají streamovat progresivně). Video-1 je 1280×720,
videa 2–3 svislá.

> ⚠️ Perkládání ve videu (seek na nenačtenou část) potřebuje HTTP
> **Range** requesty — Python `http.server` v náhledu je neumí, na
> reálném hostingu (Vercel/Netlify/nginx…) to funguje samo.

> 💡 Pokud bude vadit objem, dej videům `preload="none"` (přijdeš o
> poster snímek a délku do prvního přehrání) nebo je protáhni ffmpegem
> (H.264 720p, CRF ~24, `-movflags +faststart`).

## 12. Reference — kolotoč recenzí (`#reference`)

Podle komponenty **design-testimonial** (21st.dev), přepsáno do vanilla
JS (`buildTestimonials()` v `js/main.js`). Jedna recenze naráz,
**auto-přepínání po 6 s** + kruhová navigace; pauza na hover a při
skryté záložce.

- **Obří světlé číslo** (`01` / `02`) bleeduje přes levý okraj,
  `parallax` na pohyb myši (`--px/--py` přes `gsap.quickTo`), při
  přepnutí `blur-in` (`scale + filter: blur`).
- Vlevo svislý label „Reference" (`writing-mode: vertical-rl`) +
  **progress linka**, jejíž výplň roste podle indexu.
- Uprostřed: nahoře **logo klienta** (`.testi__badge-logo`,
  `object-fit:contain`) — mění se podle recenze z atributu `data-logo`
  na zdrojovém `<div>`. Wordmark (Škoda) má výšku ~26 px; čtvercové
  znaky dostávají přes `[src*="ac-sparta"]` výšku ~52 px, ať mají
  podobnou optickou váhu. **Citace odkrývaná po slovech**
  (`stagger .014`, `expo.out`), autor s **narůstající linkou**
  (`scaleX 0 → 1`). `setBadge()` přepíná `src` + `alt`; když recenze
  `data-logo` nemá, `<img>` se schová.
- Kruhová **navigace se sunoucí výplní** (`::before` `translateX`),
  šipka zbělá na hoveru.

Data recenzí jsou v `.testi__source` (skrytý `<div hidden>`), JS je
čte do pole — **úprava textu / přidání recenze / změna loga = jen tam**
(`data-name`, `data-role`, `data-logo`). Loga jsou v `img/logos/`
(Škoda `skoda.png`, AC Sparta `ac-sparta.png`). Přechod i odemčení
řídí `setTimeout`, takže se kolotoč nezasekne.
`prefers-reduced-motion` → bez auto-přepínání; nav funguje okamžitým
překreslením.

> Kotva `#reference` se přesunula sem — sekce s pásem log (`.brands`)
> už `id` nemá.

## 13. Kontakt — formulář (`#kontakt`)

Podle komponenty **contact-card** (21st.dev), přepsáno do vanilla JS
(`buildContact()` v `js/main.js`). Ostrá karta (`var(--cream)`, bez
zaoblení) s „+" značkami v rozích; vlevo nadpis + text + kontaktní
údaje (e-mail, telefon, působnost — každý s ikonou v čipu), vpravo na
jemně odlišeném podkladu formulář (jméno, e-mail, telefon, zpráva,
odeslat). Pod 900 px jednosloupcově (dělící linka se překlopí na
`border-top`).

**Odesílání bez backendu:** JS po validaci sestaví `mailto:` odkaz
(`subject` = „Poptávka moderování — {jméno}", `body` = pole + zpráva)
a otevře e-mailový klient. Fallback bez JS: `<form action="mailto:…"
method="post" enctype="text/plain">`. Honeypot `_gotcha` proti spamu
(vyplněné pole → tichá „úspěšná" hláška, nic se neodešle). Validace:
jméno + zpráva neprázdné, e-mail podle regexu; chybná pole dostanou
`.is-invalid`, hláška v `.contact__note` (`role="status"`).

**Prémiové mikrointerakce:** při vjezdu do viewportu „+" rohy „lupnou"
z rotace (`back.out`), kontaktní čipy popnou, nadpis zpod masky, pole
se staggerem. Fokus pole = olivové **podtržení se nakreslí**
(`::after`, `scaleX 0→1`) + label zezelená a rozšíří `letter-spacing`;
chyba přepne podtržení na červené (`:has(.is-invalid)`). Tlačítko je
**„flow-button"** (21st.dev): pilulka s obrysem → na hoveru z ní
vyroste olivový kruh (`scale(30)`), text se posune, jedna šipka odjede
vpravo a druhá přijede zleva, rohy se stáhnou na 12 px; po odeslání
`.is-sent` = olivová výplň + „Odesláno" + fajfka + `box-shadow`
„lupnutí" (3,2 s). Mechanika je ve sdílené třídě **`.flow-btn`**
(používá ji i CTA v patičce). Karta má jemné **světlo u kurzoru**
(`.contact__glow`, `--mx/--my`). Vše přes GSAP / CSS, respektuje
`prefers-reduced-motion`.

> ⚠️ Pro reálné nasazení zvaž napojení na **Formspree**
> (`action="https://formspree.io/f/ID"`, `method="POST"`) nebo
> **Netlify Forms** (`data-netlify="true"` + skryté `form-name`) —
> pak stačí v `buildContact()` vypnout `e.preventDefault()` / mailto
> větev.

## 14. Patička (`.footer`)

Podle komponenty **footer-section** (21st.dev), přepsáno do vanilla JS
(`buildFooter()`). Tmavá (`var(--ink)`, cream text), 4 sloupce
(`@media ≤900 px` 2, `≤560 px` 1):

1. **Zůstaňme ve spojení** — text + rychlé pole na e-mail a pod ním
   **stejné „flow-button" CTA jako v kontaktu** (`.footer__send.flow-btn`,
   tmavá varianta) → po validaci sestaví `mailto:` s předmětem
   „Mám zájem o spolupráci" a tlačítko přepne na `.is-sent`
   (olivová výplň + „Odesláno" + fajfka, 3,2 s); rozmazaný olivový
   „glow" blob za sloupcem.
2. **Sekce** — odkazy na všechny kotvy webu.
3. **Kontakt** — `<address>` s e-mailem, telefonem a působností.
4. **Sledujte mě** — Instagram + Facebook v kruhových tlačítkách
   s CSS tooltipem (`::after`, `data-tip`).

Spodní pruh: `© {rok} Filip Lejček` (rok se dopočítá z `Date`) +
odkaz na zásady zpracování os. údajů. Sloupce naběhnou při vjezdu
(ScrollTrigger, stagger). `.footer__inner` na `≥1280 px` používá
`var(--rail-space)`, ať obsah nezmizí za lištou.

> **Vynecháno z předlohy:** přepínač světlý/tmavý režim (web má
> pevný design). Odkaz „Zásady zpracování osobních údajů" je
> `href="#"` — doplň stránku / text (GDPR, formulář sbírá osobní údaje).

## 15. Co zbývá

- [x] Hero fotka (desktop + mobilní varianta)
- [x] Pás log značek
- [x] Sekce O mně
- [x] Levá lišta (po hero)
- [x] Portfolio služeb
- [x] Fotogalerie (efekt + 12 fotek hotové)
- [x] Video prezentace (přehrávač + 3 videa)
- [x] Reference — recenze (Škoda Auto, AC Sparta Praha)
- [x] Kontaktní formulář (mailto, bez backendu)
- [x] Patička
- [ ] Doplnit stránku/text „Zásady zpracování osobních údajů"
- [ ] Opravit popis služby 04 (viz výše)
- [ ] Potvrdit čísla — `150+ akcí` a `8 let` jsou zástupné (hero karty i lišta)
- [ ] Doplnit `img/og-image.jpg` (1200×630) pro sdílení na sociálních sítích

Všechny kotvy v navigaci (`#o-mne`, `#portfolio`, `#foto`, `#video`,
`#reference`, `#kontakt`) jsou hotové.
