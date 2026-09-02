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
      var size = ((avail / natural) * REF).toFixed(2) + 'px';
      wm.style.setProperty('--wm-size', size);
      /* i na wrapper — aby ho zdědilo malé „FILIP" (.hero__brand-pre)
         a mohlo se opticky zarovnat na levý tah „L" */
      if (wm.parentElement) wm.parentElement.style.setProperty('--wm-size', size);
    }
  }

  /* ══ 2. Výchozí stavy pro intro ═════════════════════════════════ */
  var photo    = document.querySelector('.hero__photo');
  var navItems = document.querySelectorAll('.navgroup a, .navsep');
  var ctaBtns  = document.querySelectorAll('.hero__cta .flow-btn');
  var cards    = document.querySelectorAll('[data-card]');

  /* Maskované řádky sázíme přes yPercent i v JS.
     CSS drží translate3d(0,110%,0) jen kvůli prvnímu vykreslení — GSAP by ho
     načetl jako pixelové „y“ a tween na yPercent by pak neměl co animovat. */
  gsap.set('.wordmark__l',      { yPercent: 110, y: 0 });
  gsap.set('.ln__i',            { yPercent: 110, y: 0 });
  gsap.set('.hero__brand-pre__i', { yPercent: -105, y: 0 });   /* svislý štítek „FILIP" — sjede shora */

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
      gsap.set('.wordmark__l, .ln__i, .hero__brand-pre__i', { yPercent: 0 });
      gsap.set([photo, navItems, ctaBtns, cards], { opacity: 1, scale: 1, y: 0 });
      return null;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.wordmark__l',              { yPercent: 0, duration: 1.15, stagger: .055 }, .05)
      .to(photo,                       { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, .10)
      .to('.hero__brand-pre__i',       { yPercent: 0, duration: .9, ease: 'expo.out' }, .4)
      .to('.hero__headline .ln__i',    { yPercent: 0, duration: 1.0, stagger: .08 }, .48)
      .to(navItems,                    { opacity: 1, y: 0, duration: .7, stagger: .03 }, .58)
      .to(ctaBtns,                     { opacity: 1, y: 0, duration: .75, stagger: .07 }, .88)
      .to(cards,                       { opacity: 1, scale: 1, y: 0, duration: .9, stagger: .09 }, .95)
      .to('.hero__bottom .ln__i',      { yPercent: 0, duration: .85, stagger: .05 }, 1.0)
      .add(function () {
        // uvolníme kompozitní vrstvy, jakmile intro dohraje
        gsap.set('.wordmark__l, .hero__brand-pre__i, .hero__headline .ln__i, .hero__photo',
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

      /* 5.6 — obří značka + malý štítek „FILIP" zmizí, jakmile hero odscrollujeme.
         Štítek jen fade (bez scale), ať mu zůstane CSS transform (posun na háček). */
      var wmTween = gsap.to(wm, {
        autoAlpha: 0, scale: .92, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '20% top', end: '42% top', scrub: true }
      });
      gsap.to('.hero__brand-pre', {
        autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '20% top', end: '42% top', scrub: true }
      });

      /* úklid při změně breakpointu */
      return function () {
        if (wmTween) wmTween.scrollTrigger && wmTween.scrollTrigger.kill();
        gsap.set([wm, '.hero__brand-pre', '.hero__center', '.hero__nav',
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

    document.querySelectorAll('.hero__cta .flow-btn').forEach(function (btn) {
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

  /* ══ 7f. Portrét pod Portfoliem — profilová karta (glassmorphism) ══
     Vanilla náhrada za 21st.dev/@beratberkayg "glassmorphism-profile-
     card" (React/Tailwind/shadcn) — tenhle web běží bez build kroku,
     takže stejné chování (reveal, živé hodiny) je přepsané do
     prostého GSAP + DOM. */
  function buildPortrait() {
    var sec = document.querySelector('.portrait');
    if (!sec) return;
    var wrap = sec.querySelector('.pcard-wrap');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !ST) {
      gsap.set(wrap, { opacity: 1, y: 0, scale: 1 });
    } else {
      gsap.set(wrap, { opacity: 0, y: 40, scale: .96 });
      ST.create({
        trigger: sec, start: 'top 82%', once: true,
        onEnter: function () {
          gsap.to(wrap, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out' });
        }
      });
    }

    pcardClock(sec);
  }

  /* Živé hodiny v kartě — minutová přesnost, kontrola co 15s stačí. */
  function pcardClock(sec) {
    var el = sec.querySelector('[data-pcard-time]');
    if (!el) return;
    function tick() {
      var now = new Date();
      var h = now.getHours();
      var m = now.getMinutes().toString().padStart(2, '0');
      var hour12 = ((h + 11) % 12) + 1;
      var ampm = h >= 12 ? 'PM' : 'AM';
      el.textContent = hour12 + ':' + m + ampm;
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ══ 7g. Fotogalerie — „unfurling" panel + 3D parallax mřížka ═══
     Podle 3d-parallax-unfurling-gallery (21st.dev), přepsáno do GSAP:
     scroll nejdřív rozbalí tmavý zaoblený panel na celou plochu
     (0 → 15 %), pak odrotuje 3D mřížku fotek do skoro roviny a
     rozjede 4 sloupce různou rychlostí (15 → 100 %).
     Jen desktop (≥ 901 px) mimo reduce-motion — jinak klidná mřížka. */
  function buildGallery() {
    var sec = document.querySelector('.gallery');
    if (!sec) return;

    var banner = sec.querySelector('.gallery__banner');
    var matrix = sec.querySelector('.gallery__matrix');
    var cols   = Array.prototype.slice.call(sec.querySelectorAll('.gallery__col'));
    var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var desktop = window.matchMedia('(min-width: 901px)').matches;

    if (!ST || reduce || !desktop) return;

    /* Bez klonování — každá fotka jednou. Sloupce (4–5 fotek) jsou vyšší
       než mřížka (.gallery__matrix height), přesah ořízne .gallery__pin;
       paralaxa je proto malá, aby se nikde neukázala mezera. */

    var tracks = [
      { from:  3, to: -5 },
      { from: -5, to:  4 },
      { from:  2, to: -6 },
      { from: -4, to:  5 }
    ];

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    /* 1) Rozbalení panelu */
    tl.to(banner, {
      top: 0, right: 0, bottom: 0, left: 0,
      borderRadius: 0, borderWidth: 0,
      ease: 'none', duration: .15
    }, 0);

    /* 2) 3D odrotování mřížky */
    tl.fromTo(matrix,
      { rotationX: 25, rotationY: -45, rotation: 15, z: -800 },
      { rotationX: 4, rotationY: -8, rotation: 2, z: 0, ease: 'none', duration: .85 }, .15);

    /* 3) Paralaxa sloupců */
    cols.forEach(function (col, i) {
      var t = tracks[i % 4];
      tl.fromTo(col, { yPercent: t.from, y: 0 },
                     { yPercent: t.to, ease: 'none', duration: .85 }, .15);
    });
  }

  /* ══ 7h. Lightbox — po kliknutí na fotku v galerii se zvětší ════
     Sestaví se unikátní seznam fotek (klony v mřížce ignoruje),
     overlay s tmavým pozadím, obrázek naskočí ze scale .92; šipky
     + klávesy ←/→ listují, Esc / klik mimo / křížek zavře. */
  function galleryLightbox() {
    var sec = document.querySelector('.gallery');
    if (!sec) return;
    var matrix = sec.querySelector('.gallery__matrix');
    var figs = Array.prototype.slice.call(sec.querySelectorAll('.gallery__fig'));
    if (!matrix || !figs.length) return;

    var seen = {}, photos = [];
    figs.forEach(function (fig) {
      var img = fig.querySelector('img');
      var src = img && img.getAttribute('src');
      if (!src || seen[src]) return;
      seen[src] = true;
      var srcEl = fig.querySelector('source');
      photos.push({
        jpg: src,
        webp: srcEl ? srcEl.getAttribute('srcset') : null,
        alt: (img.getAttribute('alt') || '')
      });
    });
    if (!photos.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var X  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var LT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var RT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Zvětšená fotka');
    lb.innerHTML =
      '<div class="lightbox__backdrop"></div>' +
      '<button class="lightbox__close" type="button" aria-label="Zavřít">' + X + '</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Předchozí fotka">' + LT + '</button>' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Další fotka">' + RT + '</button>' +
      '<figure class="lightbox__stage"><picture><source class="lightbox__src" type="image/webp"><img class="lightbox__img" alt=""></picture></figure>' +
      '<p class="lightbox__count"></p>';
    document.body.appendChild(lb);

    var backdrop = lb.querySelector('.lightbox__backdrop');
    var closeBtn = lb.querySelector('.lightbox__close');
    var navs     = lb.querySelectorAll('.lightbox__nav');
    var stage    = lb.querySelector('.lightbox__stage');
    var srcEl    = lb.querySelector('.lightbox__src');
    var imgEl    = lb.querySelector('.lightbox__img');
    var countEl  = lb.querySelector('.lightbox__count');
    var idx = 0, open = false;

    function render() {
      var p = photos[idx];
      if (p.webp) srcEl.setAttribute('srcset', p.webp); else srcEl.removeAttribute('srcset');
      imgEl.setAttribute('src', p.jpg);
      imgEl.setAttribute('alt', p.alt);
      countEl.textContent = (idx + 1) + ' / ' + photos.length;
    }
    function show(i) {
      idx = (i % photos.length + photos.length) % photos.length;
      render();
      if (open) {
        if (!reduce) gsap.fromTo(stage, { opacity: .25, scale: .985 }, { opacity: 1, scale: 1, duration: .32, ease: 'power2.out' });
        return;
      }
      open = true;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
      gsap.set(lb, { autoAlpha: 1 });
      if (reduce) {
        gsap.set([backdrop, stage, closeBtn, countEl], { opacity: 1 });
        gsap.set(navs, { opacity: 1 });
      } else {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .4, ease: 'power2.out' });
        gsap.fromTo(stage, { autoAlpha: 0, scale: .92, y: 14 }, { autoAlpha: 1, scale: 1, y: 0, duration: .55, ease: 'expo.out' });
        gsap.fromTo([closeBtn, countEl], { opacity: 0 }, { opacity: 1, duration: .35, delay: .12 });
        gsap.fromTo(navs, { opacity: 0 }, { opacity: 1, duration: .35, delay: .12 });
      }
      closeBtn.focus();
    }
    function hide() {
      if (!open) return;
      open = false;
      lb.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      if (reduce) { gsap.set(lb, { autoAlpha: 0 }); lb.classList.remove('is-open'); return; }
      gsap.to(stage, { autoAlpha: 0, scale: .95, y: 10, duration: .3, ease: 'power2.in' });
      gsap.to(lb, { autoAlpha: 0, duration: .32, ease: 'power2.in',
        onComplete: function () { lb.classList.remove('is-open'); } });
    }

    matrix.addEventListener('click', function (e) {
      var fig = e.target.closest && e.target.closest('.gallery__fig');
      if (!fig) return;
      var img = fig.querySelector('img');
      var src = img && img.getAttribute('src');
      for (var i = 0; i < photos.length; i++) {
        if (photos[i].jpg === src) { show(i); break; }
      }
    });
    backdrop.addEventListener('click', hide);
    closeBtn.addEventListener('click', hide);
    navs[0].addEventListener('click', function () { show(idx - 1); });
    navs[1].addEventListener('click', function () { show(idx + 1); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ══ 7i. Video prezentace — tři přehrávače pod sebou ═══════════
     Vzhled dle video-player (21st.dev / chetanverma16), přepsáno do
     vanilla JS: play/pauza (klik na video i tlačítko), scrub lišta,
     hlasitost + mute, rychlosti 0,5–2×. Ovládání se ukazuje při
     najetí / při pauze / při fokusu. Spustí-li se jedno video,
     ostatní se pauznou. Číslo + přehrávač naběhnou při scrollu. */
  function clampPct(n) { return Math.min(100, Math.max(0, n)); }
  function fmtTime(s) { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + ('0' + (s % 60)).slice(-2); }

  function initVideoPlayer(wrap, onPlay) {
    var video = wrap.querySelector('.vplayer__video');
    var big   = wrap.querySelector('.vplayer__big');
    var playB = wrap.querySelector('.vplayer__play');
    var muteB = wrap.querySelector('.vplayer__mute');
    var bar   = wrap.querySelector('.vplayer__bar');
    var fill  = wrap.querySelector('.vplayer__fill');
    var volB  = wrap.querySelector('.vplayer__vol');
    var volF  = wrap.querySelector('.vplayer__vol-fill');
    var curEl = wrap.querySelector('.vplayer__time--cur');
    var durEl = wrap.querySelector('.vplayer__time--dur');
    var speedB = Array.prototype.slice.call(wrap.querySelectorAll('.vplayer__speeds button'));

    function setFill(p) { p = clampPct(p); fill.style.width = p + '%'; bar.setAttribute('aria-valuenow', Math.round(p)); }
    function setVolFill(p) { p = clampPct(p); volF.style.width = p + '%'; volB.setAttribute('aria-valuenow', Math.round(p)); }

    function toggle() { if (video.paused) { video.play().catch(function () {}); } else { video.pause(); } }
    video.addEventListener('click', toggle);
    big.addEventListener('click', toggle);
    playB.addEventListener('click', toggle);
    video.addEventListener('play', function () {
      wrap.classList.add('is-playing');
      if (onPlay) onPlay(video);
    });
    video.addEventListener('pause', function () { wrap.classList.remove('is-playing'); });
    video.addEventListener('ended', function () { wrap.classList.remove('is-playing'); });

    function syncDur() { if (isFinite(video.duration) && video.duration > 0) durEl.textContent = fmtTime(video.duration); }
    video.addEventListener('loadedmetadata', syncDur);
    video.addEventListener('durationchange', syncDur);
    syncDur();
    video.addEventListener('timeupdate', function () {
      var d = video.duration || 0;
      setFill(d ? (video.currentTime / d) * 100 : 0);
      curEl.textContent = fmtTime(video.currentTime);
    });

    bar.addEventListener('click', function (e) {
      if (!video.duration) return;
      var r = bar.getBoundingClientRect();
      var p = clampPct(((e.clientX - r.left) / r.width) * 100);
      video.currentTime = (p / 100) * video.duration;
      setFill(p);
    });
    bar.addEventListener('keydown', function (e) {
      if (!video.duration) return;
      if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration, video.currentTime + 5);
      else if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5);
    });

    function setVol(v) {
      v = Math.min(1, Math.max(0, v));
      video.volume = v;
      video.muted = v === 0;
      setVolFill(v * 100);
      wrap.classList.toggle('is-muted', video.muted || video.volume === 0);
    }
    volB.addEventListener('click', function (e) {
      var r = volB.getBoundingClientRect();
      setVol((e.clientX - r.left) / r.width);
    });
    volB.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') setVol(video.volume + .1);
      else if (e.key === 'ArrowLeft') setVol(video.volume - .1);
    });
    muteB.addEventListener('click', function () {
      video.muted = !video.muted;
      wrap.classList.toggle('is-muted', video.muted);
      setVolFill(video.muted ? 0 : video.volume * 100);
    });
    setVolFill(100);

    speedB.forEach(function (b) {
      b.addEventListener('click', function () {
        video.playbackRate = parseFloat(b.getAttribute('data-speed'));
        speedB.forEach(function (x) { x.classList.toggle('is-active', x === b); });
      });
    });

    return video;
  }

  function buildVideos() {
    var sec = document.querySelector('.videos');
    if (!sec) return;
    var items = Array.prototype.slice.call(sec.querySelectorAll('.videos__item'));
    if (!items.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var videos = [];
    function pauseOthers(active) {
      videos.forEach(function (v) { if (v !== active && !v.paused) v.pause(); });
    }

    items.forEach(function (item, idx) {
      var wrap = item.querySelector('.vplayer');
      var video = initVideoPlayer(wrap, pauseOthers);
      videos.push(video);

      if (!ST || reduce) { gsap.set(wrap, { opacity: 1, y: 0 }); return; }
      gsap.set(wrap, { opacity: 0, y: 42 });
      ST.create({
        trigger: item, start: 'top 82%', once: true,
        onEnter: function () {
          gsap.to(wrap, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: idx * 0.12 });
        }
      });
    });
  }

  /* ══ 7i2. Výzva k akci — reveal CTA pásu (mezi Portrétem a Fotogalerií) ══ */
  function buildCta() {
    var sec = document.querySelector('.cta');
    if (!sec) return;
    var accent = sec.querySelector('.cta__accent');
    var lines  = sec.querySelectorAll('.cta__title .ln__i');
    var lead   = sec.querySelector('.cta__lead');
    var btn    = sec.querySelector('.cta__btn');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!ST || reduce) {
      gsap.set(lines, { yPercent: 0, y: 0 });
      gsap.set([lead, btn], { opacity: 1, y: 0 });
      if (accent) gsap.set(accent, { scaleX: 1 });
      return;
    }

    gsap.set(lines, { yPercent: 110, y: 0 });
    gsap.set([lead, btn], { opacity: 0, y: 18 });
    gsap.set(accent, { scaleX: 0 });

    ST.create({
      trigger: sec, start: 'top 80%', once: true,
      onEnter: function () {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .to(accent, { scaleX: 1, duration: .6 }, 0)
          .to(lines,  { yPercent: 0, duration: 1, stagger: .1 }, .05)
          .to(lead,   { opacity: 1, y: 0, duration: .7 }, .3)
          .to(btn,    { opacity: 1, y: 0, duration: .7 }, .42);
      }
    });
  }

  /* ══ 7j. Reference — kolotoč jedné recenze ════════════════════
     Podle design-testimonial (21st.dev), přepsáno do vanilla JS:
     jedna recenze naráz, auto-přepínání po 6 s + kruhová navigace.
     Obří číslo bleeduje vlevo (parallax na myš, blur-in přechod),
     citace se odkrývá po slovech, autor s narůstající linkou,
     svislá progress linka. */
  function buildTestimonials() {
    var sec = document.querySelector('.testi');
    if (!sec) return;

    var items = Array.prototype.slice.call(sec.querySelectorAll('.testi__source > div')).map(function (d) {
      return {
        quote: d.textContent.trim(),
        name: d.getAttribute('data-name') || '',
        role: d.getAttribute('data-role') || '',
        logo: d.getAttribute('data-logo') || ''
      };
    });
    if (!items.length) return;

    var idxEl     = sec.querySelector('.testi__index');
    var fillEl    = sec.querySelector('.testi__progress-fill');
    var badgeLogo = sec.querySelector('.testi__badge-logo');
    var quoteEl = sec.querySelector('.testi__quote');
    var lineEl  = sec.querySelector('.testi__author-line');
    var nameEl  = sec.querySelector('.testi__author-name');
    var roleEl  = sec.querySelector('.testi__author-role');
    var prevB   = sec.querySelector('.testi__prev');
    var nextB   = sec.querySelector('.testi__next');
    var stage   = sec.querySelector('.testi__stage');
    var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var i = 0;
    var timer = null;
    var animating = false;
    var animated = !reduce && !!ST;

    function splitQuote(txt) {
      quoteEl.innerHTML = txt.split(/\s+/).map(function (w) { return '<span>' + w + '</span>'; }).join(' ');
      return Array.prototype.slice.call(quoteEl.querySelectorAll('span'));
    }

    function fillPct() { return ((i + 1) / items.length) * 100 + '%'; }

    function setBadge(t) {
      if (!badgeLogo) return;
      if (t.logo) { badgeLogo.src = t.logo; badgeLogo.alt = t.name; badgeLogo.style.display = ''; }
      else { badgeLogo.removeAttribute('src'); badgeLogo.style.display = 'none'; }
    }

    function paintStatic() {
      var t = items[i];
      idxEl.textContent = ('0' + (i + 1)).slice(-2);
      setBadge(t);
      nameEl.textContent = t.name;
      roleEl.textContent = t.role;
      splitQuote(t.quote);
      fillEl.style.height = fillPct();
    }

    if (reduce || !ST) {
      paintStatic();
      gsap.set([quoteEl, sec.querySelector('.testi__badge'), sec.querySelector('.testi__author')], { opacity: 1 });
      gsap.set(lineEl, { scaleX: 1 });
      wireNav();
      return;
    }

    /* Přechod: krátký „ven", pak plná výměna obsahu a „dovnitř".
       Výměnu i odemčení řídí prostý setTimeout (ne GSAP ticker),
       aby se kolotoč nikdy nezasekl, i kdyby tweeny neběžely. */
    function render(dir) {
      animating = true;
      var t = items[i];
      var badge = sec.querySelector('.testi__badge');
      var author = sec.querySelector('.testi__author');

      gsap.to([badge, author], { opacity: 0, y: -10, duration: .22, ease: 'power2.in' });
      gsap.to(quoteEl.children, { opacity: 0, y: -8, duration: .2, stagger: .004, ease: 'power2.in' });
      gsap.to(idxEl, { opacity: 0, scale: 1.08, filter: 'blur(10px)', duration: .3, ease: 'power2.in' });

      setTimeout(function () {
        idxEl.textContent = ('0' + (i + 1)).slice(-2);
        setBadge(t);
        nameEl.textContent = t.name;
        roleEl.textContent = t.role;
        var words = splitQuote(t.quote);
        gsap.set(quoteEl, { opacity: 1, y: 0 });
        gsap.set(words, { opacity: 0, y: 10 });

        gsap.fromTo(idxEl, { opacity: 0, scale: .86, filter: 'blur(10px)' },
                           { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .55, ease: 'expo.out' });
        gsap.fromTo(badge, { opacity: 0, x: dir < 0 ? 18 : -18 }, { opacity: 1, x: 0, duration: .4, ease: 'power3.out' });
        gsap.to(words, { opacity: 1, y: 0, duration: .5, stagger: .014, ease: 'expo.out' });
        gsap.fromTo(author, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .45, delay: .08, ease: 'power3.out' });
        gsap.fromTo(lineEl, { scaleX: 0 }, { scaleX: 1, duration: .6, delay: .12, ease: 'expo.out' });
        gsap.to(fillEl, { height: fillPct(), duration: .5, ease: 'expo.out' });
        animating = false;
      }, 240);
    }

    function go(n, manual) {
      if (animating) return;
      i = (i + n + items.length) % items.length;
      if (animated) render(n < 0 ? -1 : 1);
      else {
        paintStatic();
        gsap.set([quoteEl, sec.querySelector('.testi__badge'), sec.querySelector('.testi__author'), quoteEl.querySelectorAll('span')], { opacity: 1, y: 0 });
        gsap.set(lineEl, { scaleX: 1 });
      }
      if (manual) restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduce) timer = setInterval(function () { go(1, false); }, 6000);
    }
    function wireNav() {
      prevB.addEventListener('click', function () { go(-1, true); });
      nextB.addEventListener('click', function () { go(1, true); });
      sec.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
      sec.addEventListener('mouseleave', restart);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { if (timer) clearInterval(timer); } else restart();
      });
    }

    /* Parallax obřího čísla na pohyb myši (jen desktop, přesný kurzor) */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      var qx = gsap.quickTo(idxEl, '--px', { duration: .5, ease: 'power3' });
      var qy = gsap.quickTo(idxEl, '--py', { duration: .5, ease: 'power3' });
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        qx(((e.clientX - (r.left + r.width / 2)) / r.width) * 22);
        qy(((e.clientY - (r.top + r.height / 2)) / r.height) * 16);
      });
      stage.addEventListener('pointerleave', function () { qx(0); qy(0); });
    }

    /* Výchozí stav — blockquote je vidět (opacity 1), skrytá jsou jen
       jednotlivá slova; badge/autor naběhnou jako celek. */
    paintStatic();
    gsap.set([sec.querySelector('.testi__badge'), sec.querySelector('.testi__author')], { opacity: 0 });
    gsap.set(quoteEl, { opacity: 1, y: 0 });
    gsap.set(lineEl, { scaleX: 0 });
    gsap.set(fillEl, { height: 0 });
    gsap.set(quoteEl.querySelectorAll('span'), { opacity: 0, y: 10 });

    wireNav();
    ST.create({
      trigger: sec, start: 'top 72%', once: true,
      onEnter: function () {
        var badge = sec.querySelector('.testi__badge');
        var author = sec.querySelector('.testi__author');
        var words = quoteEl.querySelectorAll('span');
        gsap.timeline()
          .fromTo(idxEl, { opacity: 0, scale: .86, filter: 'blur(10px)' },
                         { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .7, ease: 'expo.out' }, 0)
          .fromTo(badge, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: .5, ease: 'power3.out' }, .1)
          .to(words, { opacity: 1, y: 0, duration: .5, stagger: .014, ease: 'expo.out' }, .2)
          .fromTo(author, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, .3)
          .fromTo(lineEl, { scaleX: 0 }, { scaleX: 1, duration: .6, ease: 'expo.out' }, .45)
          .to(fillEl, { height: fillPct(), duration: .6, ease: 'expo.out' }, .3)
          .add(restart);
      }
    });
  }

  /* ══ 7k. Kontakt — formulář (contact-card) + prémiové mikrointerakce
     Bez backendu: validace + sestavení mailto odkazu, honeypot.
     Reveal: karta nabíhá, „+" rohy „lupnou" z rotace, nadpis zpod
     masky, kontaktní čipy popnou, pole se staggerem. Interakce:
     podtržení pole se kreslí při fokusu, tlačítko má světelný přeběh
     a po odeslání šipka → fajfka s „lupnutím". Karta má jemné světlo
     u kurzoru. */
  function buildContact() {
    var sec = document.querySelector('.contact');
    if (!sec) return;
    var form    = sec.querySelector('.contact__form');
    var card    = sec.querySelector('.contact__card');
    var glow    = sec.querySelector('.contact__glow');
    var titleI  = sec.querySelector('.contact__title span');
    var lead    = sec.querySelector('.contact__lead');
    var corners = Array.prototype.slice.call(sec.querySelectorAll('.contact__plus'));
    var icos    = Array.prototype.slice.call(sec.querySelectorAll('.contact__ico'));
    var infoTx  = Array.prototype.slice.call(sec.querySelectorAll('.contact__item > div'));
    var fields  = Array.prototype.slice.call(sec.querySelectorAll('.contact__field, .contact__submit, .contact__consent'));
    var note    = sec.querySelector('.contact__note');
    var btn     = sec.querySelector('.contact__submit');
    var btnTxt  = btn.querySelector('.flow-btn__txt');
    var hp      = form.querySelector('.contact__hp');
    var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var nameEl  = form.querySelector('#cf-name');
    var mailEl  = form.querySelector('#cf-email');
    var phoneEl = form.querySelector('#cf-phone');
    var msgEl   = form.querySelector('#cf-msg');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var sentTimer = null;

    function setNote(txt, cls) {
      note.textContent = txt || '';
      note.className = 'contact__note' + (txt ? ' is-shown' : '') + (cls ? ' ' + cls : '');
    }
    function mark(el, bad) { el.classList.toggle('is-invalid', !!bad); }

    [nameEl, mailEl, phoneEl, msgEl].forEach(function (el) {
      el.addEventListener('input', function () {
        mark(el, false);
        if (note.classList.contains('is-err')) setNote('');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (hp.value) { setNote('Děkuji, zpráva byla odeslána.', 'is-ok'); form.reset(); return; }

      var badName = !nameEl.value.trim();
      var badMail = !EMAIL_RE.test(mailEl.value.trim());
      var badMsg  = !msgEl.value.trim();
      mark(nameEl, badName);
      mark(mailEl, badMail);
      mark(msgEl, badMsg);
      if (badName || badMail || badMsg) {
        setNote('Zkontrolujte prosím vyznačená pole.', 'is-err');
        var bad = form.querySelector('.is-invalid');
        if (bad) bad.focus();
        return;
      }

      var subject = 'Poptávka moderování — ' + nameEl.value.trim();
      var body =
        'Jméno: ' + nameEl.value.trim() + '\n' +
        'E-mail: ' + mailEl.value.trim() + '\n' +
        (phoneEl.value.trim() ? 'Telefon: ' + phoneEl.value.trim() + '\n' : '') +
        '\n' + msgEl.value.trim() + '\n';

      setNote('Otevírám váš e-mailový klient…', 'is-ok');
      btn.classList.remove('is-sent');
      void btn.offsetWidth;                 // reflow, ať „lupne" i podruhé
      btnTxt.textContent = 'Odesláno';
      btn.classList.add('is-sent');
      clearTimeout(sentTimer);
      sentTimer = setTimeout(function () {
        btn.classList.remove('is-sent');
        btnTxt.textContent = 'Odeslat poptávku';
      }, 3200);

      window.location.href = 'mailto:info@filiplejcek.cz'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    });

    /* Světlo u kurzoru po kartě (jen desktop s přesným kurzorem). */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }

    if (!ST || reduce) {
      gsap.set(titleI, { yPercent: 0, y: 0 });
      gsap.set([card, lead].concat(corners, icos, infoTx, fields), { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 });
      return;
    }

    gsap.set(titleI, { yPercent: 120, y: 0 });
    gsap.set(card, { opacity: 0, y: 40 });
    gsap.set(corners, { opacity: 0, scale: 0, rotate: -90, transformOrigin: '50% 50%' });
    gsap.set(lead, { opacity: 0, y: 12 });
    gsap.set(icos, { opacity: 0, scale: .5, rotate: -12 });
    gsap.set(infoTx, { opacity: 0, x: -10 });
    gsap.set(fields, { opacity: 0, y: 16 });

    ST.create({
      trigger: sec, start: 'top 78%', once: true,
      onEnter: function () {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .to(card, { opacity: 1, y: 0, duration: 1 }, 0)
          .to(corners, { opacity: 1, scale: 1, rotate: 0, duration: .7, stagger: .07, ease: 'back.out(2)' }, .1)
          .to(titleI, { yPercent: 0, duration: .9, ease: 'power3.out' }, .18)
          .to(lead, { opacity: 1, y: 0, duration: .6 }, .34)
          .to(icos, { opacity: 1, scale: 1, rotate: 0, duration: .55, stagger: .08, ease: 'back.out(2.2)' }, .4)
          .to(infoTx, { opacity: 1, x: 0, duration: .5, stagger: .08 }, .46)
          .to(fields, { opacity: 1, y: 0, duration: .6, stagger: .07 }, .4);
      }
    });
  }

  /* ══ 7l. Patička — footer-section ════════════════════════════
     4 sloupce (sekce, kontakt, sociální sítě) + rychlý e-mail →
     mailto. Rok se dopočítá. Sloupce naběhnou při vjezdu. */
  function buildFooter() {
    var footer = document.querySelector('.footer');
    if (!footer) return;
    var cols   = Array.prototype.slice.call(footer.querySelectorAll('.footer__col'));
    var yearEl = footer.querySelector('.footer__year');
    var news   = footer.querySelector('.footer__news');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    if (news) {
      var input   = news.querySelector('input');
      var sendBtn = news.querySelector('.flow-btn');
      var sendTxt = sendBtn && sendBtn.querySelector('.flow-btn__txt');
      var sendTimer;
      var RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!RE.test(v)) { input.classList.add('is-invalid'); input.focus(); return; }
        input.classList.remove('is-invalid');
        if (sendBtn) {
          sendBtn.classList.remove('is-sent');
          void sendBtn.offsetWidth;            // reflow, ať „lupne" i podruhé
          if (sendTxt) sendTxt.textContent = 'Odesláno';
          sendBtn.classList.add('is-sent');
          clearTimeout(sendTimer);
          sendTimer = setTimeout(function () {
            sendBtn.classList.remove('is-sent');
            if (sendTxt) sendTxt.textContent = 'Odeslat';
          }, 3200);
        }
        window.location.href = 'mailto:info@filiplejcek.cz'
          + '?subject=' + encodeURIComponent('Mám zájem o spolupráci')
          + '&body=' + encodeURIComponent('Můj e-mail: ' + v + '\n\n');
      });
      input.addEventListener('input', function () { input.classList.remove('is-invalid'); });
    }

    if (!ST || reduce) { gsap.set(cols, { opacity: 1, y: 0 }); return; }
    gsap.set(cols, { opacity: 0, y: 24 });
    ST.create({
      trigger: footer, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(cols, { opacity: 1, y: 0, duration: .7, stagger: .1, ease: 'expo.out' });
      }
    });
  }

  /* ══ 7m. Mobilní menu (overlay z hero lišty) ══════════════════ */
  function mobileMenu() {
    var btn = document.querySelector('.hero__bar-menu');
    var nav = document.getElementById('mnav');
    if (!btn || !nav) return;
    var closeB = nav.querySelector('.mnav__close');
    var links  = nav.querySelectorAll('a');
    var openTimer;

    function open() {
      clearTimeout(openTimer);
      nav.hidden = false;
      void nav.offsetWidth;                       // reflow → přechod opacity naskočí
      nav.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      if (closeB) closeB.focus();
    }
    function close() {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      openTimer = setTimeout(function () { nav.hidden = true; }, 320);
      btn.focus();
    }

    btn.addEventListener('click', open);
    if (closeB) closeB.addEventListener('click', close);
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
    });
  }

  /* ══ 7. Start ═══════════════════════════════════════════════════ */
  function init() {
    fitWordmark();
    mobileMenu();

    var built = false;
    function build() {
      if (built) return;
      built = true;
      buildScroll();
      magneticCta();
      countUp();
      buildBrands();
      buildAbout();
      buildRail();
      buildServices();
      buildPortrait();
      buildCta();
      buildGallery();
      galleryLightbox();
      buildVideos();
      buildTestimonials();
      buildContact();
      buildFooter();
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
