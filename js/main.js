/* ══════════════════════════════════════════════════════════════
   Filip Lejček — hero motion
   GSAP 3.13 + ScrollTrigger
   Zásady: animujeme jen transform/opacity, respektujeme
   prefers-reduced-motion, scroll choreografie jen na desktopu.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root     = document.documentElement;
  var wm       = document.getElementById('wordmark');
  var wmInner  = wm && wm.querySelector('.wordmark__inner');
  var letters  = wmInner ? Array.prototype.slice.call(wmInner.children) : [];

  /* ── Fallback: bez GSAP zobrazíme vše staticky ───────────────── */
  if (typeof window.gsap === 'undefined') {
    root.classList.remove('js');
    return;
  }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* ══ 1. Přesné vysázení obří značky na šířku kontejneru ══════════
     Změříme přirozenou šířku řádku písmen při referenční velikosti
     a dopočítáme font-size tak, aby lícoval s okraji. */
  function fitWordmark() {
    if (!wm || !letters.length) return;

    var REF = 200; // referenční velikost pro měření
    var prevJustify = wmInner.style.justifyContent;

    wmInner.style.justifyContent = 'flex-start';
    wm.style.setProperty('--wm-size', REF + 'px');

    var first   = letters[0].getBoundingClientRect();
    var last    = letters[letters.length - 1].getBoundingClientRect();
    var natural = last.right - first.left;

    wmInner.style.justifyContent = prevJustify;

    if (natural > 0) {
      var avail = wm.clientWidth;
      wm.style.setProperty('--wm-size', ((avail / natural) * REF).toFixed(2) + 'px');
    }
  }

  /* ══ 2. Výchozí stavy pro intro ═════════════════════════════════ */
  var photo    = document.querySelector('.hero__photo');
  var navItems = document.querySelectorAll('.navgroup a, .navsep');
  var ctaBtns  = document.querySelectorAll('.hero__cta .btn');
  var cards    = document.querySelectorAll('[data-card]');

  /* Maskované řádky sázíme přes yPercent i v JS.
     CSS drží translate3d(0,110%,0) jen kvůli prvnímu vykreslení — GSAP by ho
     načetl jako pixelové „y“ a tween na yPercent by pak neměl co animovat. */
  gsap.set('.wordmark__l', { yPercent: 110, y: 0 });
  gsap.set('.ln__i',       { yPercent: 110, y: 0 });

  gsap.set(photo,    { opacity: 0, scale: 1.06, transformOrigin: '50% 90%' });
  gsap.set(navItems, { opacity: 0, y: 12 });
  gsap.set(ctaBtns,  { opacity: 0, y: 16 });
  gsap.set(cards,    { opacity: 0, scale: .93, y: 18 });

  /* Počítadla: hodnotu z HTML si schováme a text vynulujeme ještě
     před prvním vykreslením, ať nikde nezabliká „150+" → „0". */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.card__txt strong, .rail__stat strong').forEach(function (el) {
      var raw = el.textContent.trim();
      if (!/^\d/.test(raw)) return;
      el.setAttribute('data-count-target', raw);
      el.classList.add('stat-count');
      el.setAttribute('data-counting', '');
      el.textContent = '0';
    });
  }

  /* ══ 3. Intro timeline ══════════════════════════════════════════ */
  function playIntro() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      gsap.set('.wordmark__l, .ln__i', { yPercent: 0 });
      gsap.set([photo, navItems, ctaBtns, cards], { opacity: 1, scale: 1, y: 0 });
      return null;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.wordmark__l',              { yPercent: 0, duration: 1.15, stagger: .055 }, .05)
      .to(photo,                       { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, .10)
      .to('.hero__headline .ln__i',    { yPercent: 0, duration: 1.0, stagger: .08 }, .48)
      .to(navItems,                    { opacity: 1, y: 0, duration: .7, stagger: .03 }, .58)
      .to(ctaBtns,                     { opacity: 1, y: 0, duration: .75, stagger: .07 }, .88)
      .to(cards,                       { opacity: 1, scale: 1, y: 0, duration: .9, stagger: .09 }, .95)
      .to('.hero__bottom .ln__i',      { yPercent: 0, duration: .85, stagger: .05 }, 1.0)
      .add(function () {
        // uvolníme kompozitní vrstvy, jakmile intro dohraje
        gsap.set('.wordmark__l, .hero__headline .ln__i, .hero__photo',
                 { willChange: 'auto' });
      });

    return tl;
  }

  /* ══ 4. Scroll choreografie (jen desktop + povolený pohyb) ══════ */
  function buildScroll() {
    if (!ST) return;

    var mm = gsap.matchMedia();

    mm.add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', function () {

      /* 5.1 — navigace v hero mizí jako první */
      gsap.to('.hero__nav', {
        autoAlpha: 0, y: 10, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '7% top', scrub: true }
      });

      /* 5.2 — karty odletí do stran a zmenší se */
      gsap.to('.cards-left', {
        scale: .34, autoAlpha: 0, xPercent: -26, yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '2% top', end: '20% top', scrub: true }
      });
      gsap.to('.card--traits', {
        scale: .34, autoAlpha: 0, xPercent: 26, yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '2% top', end: '20% top', scrub: true }
      });

      /* 5.3 — spodní texty vyjedou nahoru pod masku */
      gsap.to('.hero__bottom .ln__i', {
        yPercent: -115, ease: 'none', stagger: .015,
        scrollTrigger: { trigger: '.hero', start: '3% top', end: '13% top', scrub: true }
      });

      /* 5.4 — headline a CTA odplují */
      gsap.to('.hero__center', {
        autoAlpha: 0, y: -54, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '7% top', end: '26% top', scrub: true }
      });

      /* 5.5 — fotka: jemný parallax + ztmavení
         Pozor: procenta v ScrollTrigger se počítají z výšky triggeru (200svh),
         ale odscrollovat lze jen 100svh. Použitelné je tedy jen pásmo 0–50 %. */
      gsap.to('.hero__photo', {
        scale: 1.09, yPercent: 3, opacity: .16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '46% top', scrub: .4 }
      });
      gsap.to('.hero__aurora', {
        opacity: .35, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '46% top', scrub: .4 }
      });

      /* 5.6 — obří značka zmizí, jakmile hero odscrollujeme */
      var wmTween = gsap.to(wm, {
        autoAlpha: 0, scale: .92, ease: 'none',
        scrollTrigger: {
          trigger: '.hero', start: '20% top', end: '42% top', scrub: true
        }
      });

      /* úklid při změně breakpointu */
      return function () {
        if (wmTween) wmTween.scrollTrigger && wmTween.scrollTrigger.kill();
        gsap.set([wm, '.hero__center', '.hero__nav',
                  '.cards-left', '.card--traits', '.hero__photo', '.hero__aurora'],
                 { clearProps: 'all' });
        gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
      };
    });

    /* Mobil / omezený pohyb — obsah je staticky na místě */
    mm.add('(max-width: 980px), (prefers-reduced-motion: reduce)', function () {
      gsap.set('.hero__bottom .ln__i', { yPercent: 0 });
    });
  }

  /* ══ 6. Magnetický efekt na primárním CTA (jen jemný, desktop) ══ */
  function magneticCta() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.hero__cta .btn').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: .45, ease: 'power3.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: .45, ease: 'power3.out' });

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width  / 2)) * .16);
        qy((e.clientY - (r.top  + r.height / 2)) * .22);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }

  /* ══ 6b. Doprovodný kurzor ─────────────────────────────────────
     Tečka drží krok 1:1, prstenec se zpožďuje (quickTo). Nad
     interaktivními prvky se nafoukne, při stisku stáhne. Element
     vkládáme z JS, takže bez JS ani na dotyku nikde nepřekáží. */
  function cursorCompanion() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var el = document.createElement('div');
    el.className = 'cursor';
    el.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"></span>';
    document.body.appendChild(el);

    var dot  = el.firstChild;
    var ring = el.lastChild;
    var dx = gsap.quickTo(dot,  'x', { duration: .09, ease: 'none' });
    var dy = gsap.quickTo(dot,  'y', { duration: .09, ease: 'none' });
    var rx = gsap.quickTo(ring, 'x', { duration: .42, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: .42, ease: 'power3' });

    var shown = false;
    var sel = 'a, button, [data-card], .services__card, .portrait__fig, .rail__email, .brand, summary, label';

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.to(el, { opacity: 1, duration: .3 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      var over = e.target && e.target.closest && e.target.closest(sel);
      el.classList.toggle('is-hover', !!over);
    }, { passive: true });

    window.addEventListener('pointerdown', function () { el.classList.add('is-down'); });
    window.addEventListener('pointerup',   function () { el.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { el.classList.add('is-hidden'); });
    document.addEventListener('mouseenter', function () { el.classList.remove('is-hidden'); });
  }

  /* ══ 6c. Počítadla čísel ───────────────────────────────────────
     Statistiky (hero karty + lišta) se dopočítají z 0 na cílovou
     hodnotu, jakmile se dostanou do záběru. Suffix („+") zůstává. */
  function animateCount(el) {
    if (el._counted) return;
    el._counted = true;
    var raw = (el.getAttribute('data-count-target') || el.textContent).trim();
    var m = raw.match(/^(\d+)(.*)$/);
    if (!m) return;
    var target = parseInt(m[1], 10);
    var suffix = m[2] || '';
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.4, ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; },
      onComplete: function () { el.textContent = target + suffix; el.removeAttribute('data-counting'); }
    });
  }

  function countUp() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ST) return;

    function arm(el, trigger, start) {
      if (!el.getAttribute('data-count-target')) return;   // nevynulováno = přeskoč
      ST.create({
        trigger: trigger, start: start, once: true,
        onEnter: function () { animateCount(el); }
      });
    }

    document.querySelectorAll('.card__txt strong').forEach(function (el) { arm(el, el, 'top 92%'); });
    document.querySelectorAll('.rail__stat strong').forEach(function (el) { arm(el, '.hero', '42% top'); });
  }

  /* ══ 6d. Klouzavá „pilulka" aktivní položky v liště ─────────────
     Místo blikání pozadí u každého odkazu jede jedna olivová pilulka,
     která se plynule přesune (a přizpůsobí velikost) k aktivní sekci. */
  function railNavMarker() {
    var nav = document.querySelector('.rail__nav');
    if (!nav) return null;

    var marker = document.createElement('span');
    marker.className = 'rail__nav-marker';
    marker.setAttribute('aria-hidden', 'true');
    nav.insertBefore(marker, nav.firstChild);
    gsap.set(marker, { opacity: 0 });

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return function place() {
      var active = nav.querySelector('a.is-active');
      if (!active) { gsap.to(marker, { opacity: 0, duration: .25, overwrite: true }); return; }
      var nr = nav.getBoundingClientRect();
      var ar = active.getBoundingClientRect();
      gsap.to(marker, {
        x: ar.left - nr.left,
        y: ar.top  - nr.top,
        width:  ar.width,
        height: ar.height,
        opacity: 1,
        duration: reduce ? 0 : .55,
        ease: 'expo.out',
        overwrite: true
      });
    };
  }

  /* ══ 7b. Reference — decentní nafade pásu při vjezdu do viewportu ══
     Marquee samotný jede v CSS; tady jen řízený nástup opacity. */
  function buildBrands() {
    var sec = document.querySelector('.brands');
    if (!sec) return;

    var marquee = sec.querySelector('.brands__marquee');
    if (!marquee) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !ST) {
      gsap.set(marquee, { opacity: 1 });
      return;
    }

    gsap.set(marquee, { opacity: 0 });
    ST.create({
      trigger: sec,
      start: 'top 82%',
      once: true,
      onEnter: function () {
        gsap.to(marquee, { opacity: 1, duration: .8, ease: 'power2.out' });
      }
    });
  }

  /* ══ 7c. O mně — reveal + prémiový parallax fotek ═════════════════
     Reveal: fotky vyjedou zpod masky (protipohyb picture/img), nadpis
     zpod masky, odstavce se staggerem.
     Parallax: obě fotky se při scrollu posouvají různou rychlostí
     (hloubka) a na desktopu reagují 3D náklonem na pohyb myši —
     menší „plovoucí" fotka výrazněji. */
  function buildAbout() {
    var sec = document.querySelector('.about');
    if (!sec) return;

    var media    = sec.querySelector('.about__media');
    var figA     = sec.querySelector('.about__fig--a');
    var figB     = sec.querySelector('.about__fig--b');
    var titleI   = sec.querySelector('.about__title-i');
    var paras    = sec.querySelectorAll('.about__text p');
    var pics     = sec.querySelectorAll('.about__fig picture');
    var pImgs    = sec.querySelectorAll('.about__fig img');
    var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !ST) {
      gsap.set(paras, { opacity: 1 });
      gsap.set(titleI, { yPercent: 0, y: 0 });
      gsap.set(pics, { yPercent: 0, y: 0 });
      gsap.set(pImgs, { yPercent: 0, scale: 1 });
      return;
    }

    /* CSS drží translate3d(0,…%,0) jen pro první vykreslení; GSAP by ho
       jinak načetl jako pixelové „y" a tween na yPercent by neměl co hýbat
       (viz stejný trik u .wordmark__l). Proto explicitně y:0. */
    gsap.set(titleI,   { yPercent: 110, y: 0 });
    gsap.set(paras,    { opacity: 0, y: 24 });
    gsap.set(pics,     { yPercent: 101, y: 0 });
    gsap.set(pImgs,    { yPercent: -55, y: 0, scale: 1.06 });
    gsap.set([figA, figB], { transformPerspective: 1000 });

    ST.create({
      trigger: sec,
      start: 'top 72%',
      once: true,
      onEnter: function () {
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(pics,  { yPercent: 0, duration: 1.1, stagger: .14, ease: 'expo.out' }, 0)
          .to(pImgs, { yPercent: 0, scale: 1, duration: 1.25, stagger: .14, ease: 'expo.out' }, 0)
          .to(titleI,    { yPercent: 0, duration: 1.0 }, .18)
          .to(paras,     { opacity: 1, y: 0, duration: .8, stagger: .1 }, .36)
          .add(function () { gsap.set([titleI, pics], { willChange: 'auto' }); });
      }
    });

    /* Scroll parallax — obě fotky, opačná „hloubka" */
    if (figA) gsap.fromTo(figA, { y: 26 }, {
      y: -34, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 }
    });
    if (figB) gsap.fromTo(figB, { y: 54 }, {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 }
    });

    /* Pointer 3D náklon (jen desktop s přesným kurzorem) */
    if (media && figA && figB &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var aRX = gsap.quickTo(figA, 'rotationX', { duration: .7, ease: 'power3.out' });
      var aRY = gsap.quickTo(figA, 'rotationY', { duration: .7, ease: 'power3.out' });
      var aX  = gsap.quickTo(figA, 'x',         { duration: .7, ease: 'power3.out' });
      var bRX = gsap.quickTo(figB, 'rotationX', { duration: .7, ease: 'power3.out' });
      var bRY = gsap.quickTo(figB, 'rotationY', { duration: .7, ease: 'power3.out' });
      var bX  = gsap.quickTo(figB, 'x',         { duration: .7, ease: 'power3.out' });

      media.addEventListener('pointermove', function (e) {
        var r = media.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);   // -1..1
        var ny = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
        aRY(nx * 3.4);  aRX(-ny * 3.4);  aX(nx * 8);
        bRY(nx * 6.2);  bRX(-ny * 6.2);  bX(nx * 18);   // „bližší" fotka reaguje víc
      });
      media.addEventListener('pointerleave', function () {
        aRY(0); aRX(0); aX(0); bRY(0); bRX(0); bX(0);
      });
    }
  }

  /* ══ CTA v liště — „roll" textu po slovech (stejně jako [data-button-hover]
     na heynesh.com). Text se rozdělí na slova ve dvou vrstvách v masce;
     na mouseenter původní řádek vyjede nahoru (-100 %) a klon nahoru
     zespodu (100 % → 0), po slovech se staggerem. Každý hover směr střídá,
     stav se nevrací (obě vrstvy nesou stejný text). Jen desktop. */
  function railCtaHover() {
    var cta = document.querySelector('.rail__cta');
    if (!cta) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var wordsText = cta.textContent.trim().split(/\s+/);

    function makeRow(cloneCls) {
      var row = document.createElement('span');
      row.className = 'rail__cta-row' + (cloneCls ? ' rail__cta-row--clone' : '');
      wordsText.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'rail__cta-w';
        s.textContent = w;
        row.appendChild(s);
        if (i < wordsText.length - 1) row.appendChild(document.createTextNode(' '));
      });
      return row;
    }

    var mask = document.createElement('span');
    mask.className = 'rail__cta-mask';
    var rowA = makeRow(false);
    var rowB = makeRow(true);
    mask.appendChild(rowA);
    mask.appendChild(rowB);
    cta.textContent = '';
    cta.appendChild(mask);

    var wordsA = rowA.querySelectorAll('.rail__cta-w');
    var wordsB = rowB.querySelectorAll('.rail__cta-w');
    gsap.set(wordsB, { yPercent: 100, y: 0 });
    gsap.set(wordsA, { y: 0 });

    var showingA = true, tl = null;
    cta.addEventListener('mouseenter', function () {
      if (tl) tl.kill();
      tl = gsap.timeline({ defaults: { duration: .5, stagger: .05, ease: 'power2.out' } });
      var out = showingA ? wordsA : wordsB;
      var incoming = showingA ? wordsB : wordsA;
      tl.to(out, { yPercent: -100 }, 0)
        .fromTo(incoming, { yPercent: 100 }, { yPercent: 0 }, 0);
      showingA = !showingA;
    });
  }

  /* ══ E-mail pill v liště — klik = kopírování, hover = tooltip.
     Chování jako .nav-email-item na heynesh.com (Clipboard modul):
     mouseenter → tooltip in; mouseleave → out + reset; click →
     navigator.clipboard.writeText, text „Zkopírováno", pop checku
     (back.out) a olivové pozadí tooltipu. */
  function railEmailCopy() {
    var pill = document.querySelector('.rail__email');
    if (!pill) return;

    var tip     = pill.querySelector('.rail__email-tip');
    var tipText = tip && tip.querySelector('span');
    var check   = pill.querySelector('.rail__email-check');
    var addr    = pill.querySelector('.rail__email-addr');
    if (!tip || !tipText || !check || !addr) return;

    var LABEL = tipText.textContent;
    var copied = false;

    gsap.set(tip, { opacity: 0, y: 8 });
    gsap.set(check, { display: 'none' });

    function show() { gsap.to(tip, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }); }
    function hide() {
      gsap.to(tip, {
        opacity: 0, y: 8, duration: .3, ease: 'power2.in',
        onComplete: function () {
          tipText.textContent = LABEL;
          tip.classList.remove('is-copied');
          gsap.set(check, { display: 'none' });
          copied = false;
        }
      });
    }

    function copy() {
      if (copied) return;
      var text = addr.textContent.trim();
      var done = function () {
        copied = true;
        tipText.textContent = 'Zkopírováno';
        tip.classList.add('is-copied');
        gsap.set(check, { display: 'block' });
        gsap.fromTo(check, { opacity: 0, scale: .8 },
          { opacity: 1, scale: 1, duration: .3, ease: 'back.out(1.7)' });
        gsap.to(tip, { opacity: 1, y: 0, duration: .2 });
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    }

    pill.addEventListener('mouseenter', show);
    pill.addEventListener('mouseleave', hide);
    pill.addEventListener('focus', show);
    pill.addEventListener('blur', hide);
    pill.addEventListener('click', copy);
  }

  /* ══ 7d. Levá lišta — nástup po hero + aktivní sekce ═══════════
     Lišta je v CSS skrytá (autoAlpha 0). Jakmile scroll překročí
     ~42 % hero sekce, sjede zleva dovnitř; návrat nahoru ji schová.
     Odkazy dostávají .is-active podle sekce právě ve viewportu. */
  function buildRail() {
    var rail = document.getElementById('rail');
    if (!rail) return;

    railCtaHover();
    railEmailCopy();

    var links = Array.prototype.slice.call(rail.querySelectorAll('.rail__nav a'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var placeMarker = railNavMarker();

    if (!ST) { gsap.set(rail, { autoAlpha: 1, x: 0 }); return; }

    gsap.set(rail, { autoAlpha: 0, x: reduce ? 0 : -16 });

    ST.create({
      trigger: '.hero',
      start: '42% top',
      onEnter: function () {
        gsap.to(rail, {
          autoAlpha: 1, x: 0,
          duration: reduce ? 0 : .6, ease: 'power3.out'
        });
        if (!reduce) {
          gsap.from(rail.querySelectorAll('.rail__nav a'), {
            y: 10, opacity: 0, duration: .5, stagger: .04,
            ease: 'power3.out', clearProps: 'opacity,transform'
          });
        }
        if (placeMarker) gsap.delayedCall(reduce ? 0 : .5, placeMarker);
      },
      onLeaveBack: function () {
        gsap.to(rail, {
          autoAlpha: 0, x: reduce ? 0 : -16,
          duration: reduce ? 0 : .35, ease: 'power2.in'
        });
      }
    });

    /* Aktivní sekce */
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      var target = id && document.getElementById(id);
      if (!target) return;
      ST.create({
        trigger: target,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: function (self) {
          a.classList.toggle('is-active', self.isActive);
          if (placeMarker) placeMarker();
        }
      });
    });

    if (placeMarker) {
      var rt;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(placeMarker, 150);
      }, { passive: true });
    }
  }

  /* ══ 7e. Portfolio služeb — prémiový reveal + 3D náklon ═════════
     Hlavička vyjede zpod masky. Každá dlaždice při příchodu naskočí
     (fade + posun + mikro-rotace ke středu), číslo vyjede zpod masky,
     nadpis zpod masky, popis doskáče; přes sklo přeletí „sheen" a
     rozsvítí se akcentová linka. Po dokončení převezme transform CSS
     a myš dlaždici naklání ve 3D (quickTo), s odleskem u kurzoru a
     jemným protipohybem čísla (hloubka). */
  function buildServices() {
    var sec = document.querySelector('.services');
    if (!sec) return;

    var headI = sec.querySelector('.services__head-i');
    var lead  = sec.querySelector('.services__lead');
    var seam  = sec.querySelector('.services__seam');
    var items = Array.prototype.slice.call(sec.querySelectorAll('.services__item'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !ST) {
      gsap.set(headI, { yPercent: 0, y: 0 });
      gsap.set([lead].concat(items), { opacity: 1, y: 0 });
      gsap.set(sec.querySelectorAll('.services__card'), { opacity: 1, x: 0, xPercent: 0 });
      gsap.set(sec.querySelectorAll('.services__desc'), { opacity: 1, y: 0 });
      if (seam) seam.style.setProperty('--seam', '1');
      items.forEach(function (it) {
        gsap.set(it.querySelector('.services__title span'), { yPercent: 0, y: 0 });
        gsap.set(it.querySelector('.services__num i'), { yPercent: 0, y: 0 });
        it.querySelector('.services__card').classList.add('is-in');
      });
      servicesTilt();
      return;
    }

    gsap.set(headI, { yPercent: 110, y: 0 });
    gsap.set(lead,  { opacity: 0, y: 16 });

    /* Olivový steh ve švu — dokreslí se, jak sekce vstupuje do záběru. */
    if (seam) {
      seam.style.setProperty('--seam', '0');
      ST.create({
        trigger: sec, start: 'top 96%', end: 'top 68%', scrub: .6,
        onUpdate: function (self) { seam.style.setProperty('--seam', self.progress.toFixed(3)); }
      });
    }
    items.forEach(function (it, idx) {
      var fromLeft = (idx % 2 === 0);            // liché dlaždice = levý sloupec
      gsap.set(it.querySelector('.services__card'), {
        opacity: 0, xPercent: fromLeft ? -115 : 115, x: 0
      });
      gsap.set(it.querySelector('.services__num i'), { yPercent: 115, y: 0 });
      gsap.set(it.querySelector('.services__title span'), { yPercent: 110, y: 0 });
      gsap.set(it.querySelector('.services__desc'), { opacity: 0, y: 16 });
    });

    /* Hlavička */
    ST.create({
      trigger: sec, start: 'top 78%', once: true,
      onEnter: function () {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .to(headI, { yPercent: 0, duration: 1.0 }, 0)
          .to(lead,  { opacity: 1, y: 0, duration: .8 }, .2);
      }
    });

    /* Jednotlivé služby */
    items.forEach(function (it) {
      var card   = it.querySelector('.services__card');
      var numI   = it.querySelector('.services__num i');
      var titleI = it.querySelector('.services__title span');
      var desc   = it.querySelector('.services__desc');
      ST.create({
        trigger: it, start: 'top 82%', once: true,
        onEnter: function () {
          gsap.timeline({
            defaults: { ease: 'expo.out' },
            onComplete: function () {
              gsap.set(card, { clearProps: 'transform,translate,rotate,scale' });
            }
          })
            .add(function () { card.classList.add('is-in'); }, .06)
            .to(card,   { opacity: 1, xPercent: 0, duration: 1.2 }, 0)
            .to(numI,   { yPercent: 0, duration: .9 }, .12)
            .to(titleI, { yPercent: 0, duration: .85 }, .22)
            .to(desc,   { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .34);
        }
      });
    });

    servicesTilt();
  }

  /* Kurzorem řízený 3D náklon dlaždic (jen jemný ukazatel + mimika
     „skla"). Vypnuto na dotykových zařízeních a při reduce-motion. */
  function servicesTilt() {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.services__card').forEach(function (card) {
      var num = card.querySelector('.services__num');
      var setRX = gsap.quickTo(card, '--rx', { duration: .5, ease: 'power3' });
      var setRY = gsap.quickTo(card, '--ry', { duration: .5, ease: 'power3' });
      var setNX = gsap.quickTo(num, 'x', { duration: .6, ease: 'power3' });
      var setNY = gsap.quickTo(num, 'y', { duration: .6, ease: 'power3' });

      card.addEventListener('pointerenter', function () { card.classList.add('is-live'); });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - .5;   // −.5 … .5
        var py = (e.clientY - r.top)  / r.height - .5;
        setRX(-py * 8);          // náklon kolem X podle svislé polohy
        setRY(px * 10);          // náklon kolem Y podle vodorovné polohy
        setNX(-px * 16);         // číslo se posune proti náklonu → hloubka
        setNY(-py * 12);
        card.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-live');
        setRX(0); setRY(0); setNX(0); setNY(0);
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

  /* ══ 7f. Portrét pod Portfoliem — prémiový reveal + 3D náklon ═══
     Fotka naběhne zdola (fade + posun), vnitřní obraz se dojede
     z mírného zoomu, za ní se „dokreslí" odsazený rám. Na desktopu
     fotka reaguje jemným 3D náklonem na pohyb myši + odleskem. */
  function buildPortrait() {
    var sec = document.querySelector('.portrait');
    if (!sec) return;
    var fig   = sec.querySelector('.portrait__fig');
    var media = sec.querySelector('.portrait__media');
    var img   = sec.querySelector('.portrait__fig img');
    var frame = sec.querySelector('.portrait__frame');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !ST) {
      gsap.set(fig, { opacity: 1, y: 0, scale: 1 });
      gsap.set(img, { scale: 1 });
      if (frame) gsap.set(frame, { opacity: .55, scale: 1 });
      return;
    }

    gsap.set(fig, { opacity: 0, y: 44, scale: .94 });
    gsap.set(img, { scale: 1.12 });
    if (frame) gsap.set(frame, { opacity: 0, scale: .82, transformOrigin: '100% 100%' });

    ST.create({
      trigger: sec, start: 'top 82%', once: true,
      onEnter: function () {
        gsap.timeline()
          .to(fig,   { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'expo.out' }, 0)
          .to(img,   { scale: 1, duration: 1.5, ease: 'expo.out' }, 0)
          .to(frame, { opacity: .55, scale: 1, duration: 1.0, ease: 'expo.out' }, .28);
      }
    });

    portraitTilt(fig, media, img);
  }

  /* Kurzorem řízený 3D náklon fotky portrétu (jen desktop s přesným
     kurzorem, mimo reduce-motion). */
  function portraitTilt(fig, media, img) {
    if (!fig || !media) return;
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var setRX = gsap.quickTo(fig, '--rx', { duration: .6, ease: 'power3' });
    var setRY = gsap.quickTo(fig, '--ry', { duration: .6, ease: 'power3' });
    var setIX = gsap.quickTo(img, 'x', { duration: .7, ease: 'power3' });
    var setIY = gsap.quickTo(img, 'y', { duration: .7, ease: 'power3' });

    fig.addEventListener('pointerenter', function () { fig.classList.add('is-live'); });
    fig.addEventListener('pointermove', function (e) {
      var r = media.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width  - .5;
      var py = (e.clientY - r.top)  / r.height - .5;
      setRX(-py * 6);
      setRY(px * 7);
      setIX(px * 12);         // lehký paralax obrazu proti náklonu
      setIY(py * 12);
      fig.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
      fig.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
    });
    fig.addEventListener('pointerleave', function () {
      fig.classList.remove('is-live');
      setRX(0); setRY(0); setIX(0); setIY(0);
      fig.style.setProperty('--mx', '50%');
      fig.style.setProperty('--my', '50%');
    });
  }

  /* ══ 7. Start ═══════════════════════════════════════════════════ */
  function init() {
    fitWordmark();

    var built = false;
    function build() {
      if (built) return;
      built = true;
      buildScroll();
      magneticCta();
      cursorCompanion();
      countUp();
      buildBrands();
      buildAbout();
      buildRail();
      buildServices();
      buildPortrait();
      if (ST) ST.refresh();
    }

    var intro = playIntro();

    // Bez intra (omezený pohyb) stavíme rovnou.
    if (!intro) { build(); return; }

    /* Scrub tweeny si zapamatují počáteční hodnoty při prvním vykreslení.
       Kdybychom je postavili během intra, sebraly by rozanimované mezistavy
       (fotka v opacity 0) a zůstaly by na nich. Proto až po dohrání. */
    intro.eventCallback('onComplete', build);

    // Když uživatel začne scrollovat dřív, intro doskočí a řízení předáme scrollu.
    window.addEventListener('scroll', function onEarlyScroll() {
      window.removeEventListener('scroll', onEarlyScroll);
      if (built) return;
      intro.progress(1);
      build();
    }, { passive: true });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }

  /* ══ 8. Resize — přeměření značky a scroll triggerů ═════════════ */
  var rt;
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // na mobilech ignorujeme změnu výšky při skrytí URL lišty
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = setTimeout(function () {
      gsap.set(wm, { clearProps: 'transform' });
      fitWordmark();
      if (ST) ST.refresh();
    }, 180);
  }, { passive: true });

})();
