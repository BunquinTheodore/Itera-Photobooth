/* Itera Collectives - animations.js (owner: animation engineer)
   Scroll reveals, text splitting, hero sequence, printer strips, developing photos,
   header shrink. Pairs with css/animations.css. No globals, no logging. */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('anim-ready');

  const FONT_WAIT_MS = 300;
  const SCROLL_THRESHOLD_PX = 24;
  const HERO_TOTAL_MS = 2600;
  const DUR_REVEAL_MS = 800;
  const STAGGER_LINE_MS = 90;
  const LINE_RESTORE_PAD_MS = 200;
  const ANIMATING_MS = 2600;
  const RESIZE_DEBOUNCE_MS = 200;
  const LINE_TOLERANCE_PX = 2;
  const MAX_DELAY_MS = 1500;
  const IO_THRESHOLD = 0.2;
  const IO_ROOT_MARGIN = '0px 0px -8% 0px';

  const TARGET_SELECTOR = '[data-reveal], [data-stagger], [data-split]:not([data-hero-line]), [data-printer], [data-develop]';
  const SKIP_SELECTOR = '.doodle, [data-doodle], svg, br';

  let lineEntries = [];

  /* ---------------------------------------------------------------- */
  /* helpers                                                          */
  /* ---------------------------------------------------------------- */

  const prefersReducedMotion = () => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
      return false;
    }
  };

  const makeEl = (tag, className) => {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  };

  const setIndex = (el, index) => el.style.setProperty('--i', String(index));

  const createCounter = () => {
    let count = 0;
    return () => count++;
  };

  const normalizeSpaces = (text) => (text || '').replace(/[ \t\r\n\f]+/g, ' ').trim();

  const readLabel = (el) => normalizeSpaces(el.textContent);

  const makeScreenReaderCopy = (el) => {
    const copy = makeEl('span', 'visually-hidden');
    copy.textContent = readLabel(el);
    return copy;
  };

  const failSafe = () => root.classList.add('no-anim');

  /* ---------------------------------------------------------------- */
  /* text splitting                                                   */
  /* ---------------------------------------------------------------- */

  function buildWordUnit(text, nextIndex) {
    const unit = makeEl('span', 'split-word');
    const inner = makeEl('span', 'split-word__inner');
    inner.textContent = text;
    unit.appendChild(inner);
    unit.setAttribute('aria-hidden', 'true');
    setIndex(unit, nextIndex());
    return unit;
  }

  function buildCharGroup(text, nextIndex) {
    const group = makeEl('span', 'split-group');
    group.setAttribute('aria-hidden', 'true');
    Array.from(text).forEach((char) => {
      const unit = makeEl('span', 'split-char');
      unit.textContent = char;
      setIndex(unit, nextIndex());
      group.appendChild(unit);
    });
    return group;
  }

  function splitTextNode(node, mode, nextIndex) {
    return (node.textContent || '')
      .split(/([ \t\r\n\f]+)/)
      .filter(Boolean)
      .map((part) => {
        if (/^[ \t\r\n\f]+$/.test(part)) { return document.createTextNode(' '); }
        return mode === 'chars' ? buildCharGroup(part, nextIndex) : buildWordUnit(part, nextIndex);
      });
  }

  function transformChildren(parent, mode, nextIndex) {
    return Array.from(parent.childNodes).flatMap((node) => {
      if (node.nodeType === Node.TEXT_NODE) { return splitTextNode(node, mode, nextIndex); }
      if (node.nodeType !== Node.ELEMENT_NODE) { return []; }
      if (node.matches(SKIP_SELECTOR)) { return [node]; }
      const clone = node.cloneNode(false);
      clone.setAttribute('aria-hidden', 'true');
      clone.append(...transformChildren(node, mode, nextIndex));
      return [clone];
    });
  }

  function splitWordsOrChars(el, mode) {
    const copy = makeScreenReaderCopy(el);
    const nodes = transformChildren(el, mode, createCounter());
    el.replaceChildren(copy, ...nodes);
    el.classList.add('is-split');
  }

  function groupWordsIntoLines(probes) {
    return probes.reduce((lines, probe) => {
      const last = lines[lines.length - 1];
      const sameLine = last && Math.abs(last.top - probe.offsetTop) <= LINE_TOLERANCE_PX;
      if (sameLine) {
        return [...lines.slice(0, -1), { top: last.top, words: [...last.words, probe.textContent] }];
      }
      return [...lines, { top: probe.offsetTop, words: [probe.textContent] }];
    }, []);
  }

  function buildLineUnit(words, index) {
    const unit = makeEl('span', 'split-line');
    const inner = makeEl('span', 'split-line__inner');
    inner.textContent = words.join(' ');
    unit.appendChild(inner);
    unit.setAttribute('aria-hidden', 'true');
    setIndex(unit, index);
    return unit;
  }

  function hasDropCap(el) {
    try {
      const cap = window.getComputedStyle(el, '::first-letter');
      const initial = cap.initialLetter || cap.webkitInitialLetter || 'normal';
      return cap.float !== 'none' || (initial !== 'normal' && initial !== 'initial');
    } catch (error) {
      return false;
    }
  }

  function markWhole(el) {
    el.classList.add('split-whole', 'is-split');
  }

  function isSplittableByLine(el) {
    return el.children.length === 0 && el.offsetWidth !== 0 && !hasDropCap(el);
  }

  function probesFor(words) {
    return words.map((word) => {
      const probe = document.createElement('span');
      probe.textContent = word;
      return probe;
    });
  }

  /* Batched in three passes (read, write probes, read) so N elements cost one layout, not 2N. */
  function splitLinesBatch(els) {
    const eligible = els.filter(isSplittableByLine);
    els.filter((el) => !eligible.includes(el)).forEach(markWhole);
    const jobs = eligible.map((el) => {
      const original = Array.from(el.childNodes);
      const copy = makeScreenReaderCopy(el);
      const probes = probesFor(readLabel(el).split(' ').filter(Boolean));
      return { el, original, copy, probes };
    });
    jobs.forEach(({ el, probes }) => {
      el.replaceChildren(...probes.flatMap((probe, i) => (i === 0 ? [probe] : [document.createTextNode(' '), probe])));
    });
    const measured = jobs.map((job) => ({ ...job, lines: groupWordsIntoLines(job.probes) }));
    measured.forEach(({ el, original, copy, lines }) => {
      el.replaceChildren(copy, ...lines.map((line, i) => buildLineUnit(line.words, i)));
      el.classList.add('is-split');
      lineEntries = [...lineEntries, { el, original }];
    });
  }

  function splitLines(el) {
    splitLinesBatch([el]);
  }

  function restoreLines(el) {
    const entry = lineEntries.find((item) => item.el === el);
    if (!entry) { return; }
    el.replaceChildren(...entry.original);
    lineEntries = lineEntries.filter((item) => item.el !== el);
  }

  function splitTarget(el) {
    const mode = el.getAttribute('data-split');
    if (mode === 'lines') { splitLines(el); return; }
    if (mode === 'words' || mode === 'chars') { splitWordsOrChars(el, mode); return; }
    el.classList.add('is-split');
  }

  function resplitUnrevealedLines() {
    const pending = lineEntries.filter((item) => !item.el.classList.contains('is-revealed'));
    pending.forEach((item) => restoreLines(item.el));
    splitLinesBatch(pending.map((item) => item.el));
  }

  /* ---------------------------------------------------------------- */
  /* reveal triggers                                                  */
  /* ---------------------------------------------------------------- */

  function readDelay(el) {
    const raw = parseInt(el.getAttribute('data-reveal-delay') || '', 10);
    if (Number.isNaN(raw)) { return 0; }
    return Math.min(Math.max(raw, 0), MAX_DELAY_MS);
  }

  function prepare(el) {
    const delay = readDelay(el);
    if (delay > 0) { el.style.setProperty('--reveal-delay', `${delay}ms`); }
    if (!el.hasAttribute('data-stagger')) { return; }
    Array.from(el.children)
      .filter((child) => !child.matches('.doodle'))
      .forEach((child, i) => setIndex(child, i));
  }

  function scheduleLineRestore(el) {
    const count = el.querySelectorAll('.split-line').length;
    if (count === 0) { return; }
    const wait = DUR_REVEAL_MS + count * STAGGER_LINE_MS + LINE_RESTORE_PAD_MS;
    window.setTimeout(() => restoreLines(el), wait);
  }

  function markAnimating(el) {
    el.classList.add('is-animating');
    window.setTimeout(() => el.classList.remove('is-animating'), ANIMATING_MS + readDelay(el));
  }

  function reveal(el) {
    markAnimating(el);
    if (el.hasAttribute('data-printer')) { el.classList.add('is-printed'); }
    if (el.hasAttribute('data-develop')) { el.classList.add('is-developed'); }
    const needsReveal = el.hasAttribute('data-reveal') || el.hasAttribute('data-stagger') || el.hasAttribute('data-split');
    if (!needsReveal) { return; }
    el.classList.add('is-revealed');
    if (el.getAttribute('data-split') === 'lines') { scheduleLineRestore(el); }
  }

  function onIntersect(entries, observer) {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry) => {
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
  }

  function initObserver() {
    const targets = Array.from(document.querySelectorAll(TARGET_SELECTOR));
    targets.forEach(prepare);
    if (!('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver(onIntersect, {
      threshold: IO_THRESHOLD,
      rootMargin: IO_ROOT_MARGIN
    });
    targets.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------- */
  /* hero sequence                                                    */
  /* ---------------------------------------------------------------- */

  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) { return; }
    const bold = hero.querySelector('.hero__bold[data-split="chars"]');
    if (bold) { splitWordsOrChars(bold, 'chars'); }
    hero.querySelectorAll('[data-hero-fade]').forEach((el, i) => setIndex(el, i));

    const finish = () => {
      hero.classList.add('hero--done');
      document.removeEventListener('pointerdown', finish);
      document.removeEventListener('keydown', finish);
    };
    document.addEventListener('pointerdown', finish, { once: true });
    document.addEventListener('keydown', finish, { once: true });
    window.setTimeout(finish, HERO_TOTAL_MS);
    hero.classList.add('hero--ready');
  }

  /* ---------------------------------------------------------------- */
  /* header                                                           */
  /* ---------------------------------------------------------------- */

  function initHeader() {
    const header = document.querySelector('[data-site-header]');
    if (!header) { return; }
    let ticking = false;
    const update = () => {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD_PX);
    };
    window.addEventListener('scroll', () => {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------- */
  /* per section entrances (data-ax) + injected pen doodles            */
  /* ---------------------------------------------------------------- */

  const PEN = '#8B1A1F';
  const svgOpen = (cls, box, extra) =>
    `<svg class="${cls}" viewBox="${box}" aria-hidden="true" focusable="false"${extra || ''}>`;
  const penPath = (d, width) =>
    `<path d="${d}" pathLength="1" fill="none" stroke="${PEN}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const tickMarkup = (cls) =>
    `${svgOpen(cls, '0 0 24 24')}${penPath('M4 13.5 9.5 19 20.5 5.5', 2.6)}</svg>`;
  const ringMarkup = (w, h) => {
    const x = (f) => Math.round(w * f);
    const y = (f) => Math.round(h * f);
    const d = `M${x(0.09)} ${y(0.03)} C${x(0.32)} ${y(0.0)} ${x(0.68)} ${y(0.01)} ${x(0.92)} ${y(0.03)} ` +
      `C${x(0.99)} ${y(0.1)} ${x(1.0)} ${y(0.5)} ${x(0.97)} ${y(0.96)} C${x(0.7)} ${y(1.0)} ${x(0.3)} ${y(1.0)} ${x(0.06)} ${y(0.97)} ` +
      `C${x(0.0)} ${y(0.8)} ${x(0.01)} ${y(0.3)} ${x(0.03)} ${y(0.06)} C${x(0.3)} ${y(0.0)} ${x(0.55)} ${y(-0.01)} ${x(0.75)} ${y(0.01)}`;
    return `${svgOpen('ax-ring', `0 0 ${w} ${h}`, ' preserveAspectRatio="none"')}${penPath(d, 2.4)}</svg>`;
  };
  const SPARKLE_MARKUP =
    `${svgOpen('ax-sparkle', '0 0 24 24')}<path d="M12 1 14.6 9.4 23 12 14.6 14.6 12 23 9.4 14.6 1 12 9.4 9.4Z" fill="#C9A96E" stroke="${PEN}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  const PIN_MARKUP =
    `${svgOpen('ax-pin', '0 0 24 34')}<path d="M12 14 12 32" stroke="#6B1217" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="12" cy="9" r="8" fill="${PEN}"/><circle cx="9" cy="6.5" r="2.4" fill="#FBF4F1" opacity="0.55"/></svg>`;
  const FLASH_MARKUP = '<span class="ax-flash" aria-hidden="true"></span>';

  /* hosts get decorative, aria-hidden children before the plans tag them */
  const INJECTIONS = [
    { hosts: '.included__item', markup: tickMarkup('ax-tick') },
    { hosts: '.tier--featured', markup: (host) => ringMarkup(host.offsetWidth + RING_PAD * 2, host.offsetHeight + RING_PAD * 2) },
    { hosts: '.event-card', markup: SPARKLE_MARKUP },
    { hosts: '.where__photo', markup: PIN_MARKUP },
    { hosts: '.form__submit', markup: FLASH_MARKUP },
    { hosts: '.faq__answer', markup: tickMarkup('ax-faq-tick') }
  ];

  /* root: trigger element (observed); items: tagged children (null = root itself).
     claim: also drop the generic data-reveal / data-stagger / data-develop hooks. */
  const PLANS = [
    { root: '#about .about__text', items: 'p', kind: 'line', step: 170, claim: true },
    { root: '.packages__grid', items: '.tier', kind: 'rise', step: 150, claim: true },
    { root: '.packages__grid', items: '.tier__price', kind: 'late', step: 150, delay: 850 },
    { root: '.packages__grid', items: '.ax-ring', kind: 'ring', delay: 1300 },
    { root: '.included__list', items: '.ax-tick', kind: 'tick', step: 110, delay: 450 },
    { root: '.events__list', items: '.ax-sparkle', kind: 'twinkle', step: 110, delay: 550 },
    { root: '.where__photo', items: null, kind: 'fan', claim: true },
    { root: '.where__photo', items: '.ax-pin', kind: 'pin', delay: 650 },
    { root: '.process__steps', items: '.step', kind: 'light', step: 520, delay: 500, claim: true, claimRoot: true },
    { root: '.faq__list', items: '.faq__item', kind: 'cascade', step: 110 },
    { root: '#inquiry-form', items: '.form__note, .form__field', kind: 'slide', step: 70 },
    { root: '#inquiry-form', items: '.form__submit', kind: 'pulse', delay: 950 },
    { root: '#inquiry-form', items: '.ax-flash', kind: 'flash', delay: 950 },
    { root: '.site-footer', items: '.site-footer__logo, .site-footer__tagline, .site-footer__list li, .site-footer__contact li, .site-footer__legal', kind: 'fade', step: 70 }
  ];
  const CLAIM_ATTRS = ['data-reveal', 'data-reveal-delay', 'data-stagger', 'data-develop'];
  const FORM_WRAP_SELECTOR = '.inquiry__form-wrap';
  const RING_PAD = 12;
  const FAN_ANGLES = [-8, 7, -5];
  const FAQ_OPEN_MS = 380;

  const claim = (el) => CLAIM_ATTRS.forEach((attr) => el.removeAttribute(attr));

  function injectDecor() {
    INJECTIONS.forEach(({ hosts, markup }) => {
      document.querySelectorAll(hosts).forEach((host) => host.insertAdjacentHTML('beforeend', typeof markup === 'function' ? markup(host) : markup));
    });
    const wrap = document.querySelector(FORM_WRAP_SELECTOR);
    if (wrap) { claim(wrap); }
  }

  function tagItem(el, plan, index, groupIndex) {
    el.setAttribute('data-ax', plan.kind);
    el.style.setProperty('--ax-i', String(index));
    if (plan.step) { el.style.setProperty('--ax-step', `${plan.step}ms`); }
    if (plan.delay) { el.style.setProperty('--ax-d', `${plan.delay}ms`); }
    if (plan.kind === 'fan') { el.style.setProperty('--ax-r', `${FAN_ANGLES[groupIndex % FAN_ANGLES.length]}deg`); }
    if (plan.claim) { claim(el); }
  }

  function tagPlan(plan, groups) {
    Array.from(document.querySelectorAll(plan.root)).forEach((root, groupIndex) => {
      const items = plan.items ? Array.from(root.querySelectorAll(plan.items)) : [root];
      if (items.length === 0) { return; }
      items.forEach((el, i) => tagItem(el, plan, i, groupIndex));
      if (plan.claimRoot) { claim(root); }
      groups.set(root, [...(groups.get(root) || []), ...items]);
    });
  }

  function onSceneIntersect(groups) {
    return (entries, observer) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          (groups.get(entry.target) || []).forEach((el) => el.classList.add('ax-in'));
          observer.unobserve(entry.target);
        });
    };
  }

  function initScenes() {
    injectDecor();
    const groups = new Map();
    PLANS.forEach((plan) => tagPlan(plan, groups));
    const roots = Array.from(groups.keys());
    if (!('IntersectionObserver' in window)) {
      groups.forEach((items) => items.forEach((el) => el.classList.add('ax-in')));
      return;
    }
    const observer = new IntersectionObserver(onSceneIntersect(groups), { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    roots.forEach((root) => observer.observe(root));
  }

  /* ---------------------------------------------------------------- */
  /* FAQ: smooth height open / close (pen tick is pure CSS on [open])  */
  /* ---------------------------------------------------------------- */

  function animateAnswer(answer, from, to, onDone) {
    const run = answer.animate(
      [{ height: `${from}px`, opacity: from === 0 ? 0 : 1 }, { height: `${to}px`, opacity: to === 0 ? 0 : 1 }],
      { duration: FAQ_OPEN_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    answer.style.overflow = 'hidden';
    const done = () => {
      answer.style.overflow = '';
      if (onDone) { onDone(); }
    };
    run.onfinish = done;
    run.oncancel = done;
  }

  function onFaqClick(event) {
    const summary = event.target.closest('summary');
    const item = summary ? summary.parentElement : null;
    const answer = item ? item.querySelector('.faq__answer') : null;
    if (!answer || typeof answer.animate !== 'function') { return; }
    if (item.dataset.faqBusy === '1') { event.preventDefault(); return; }
    if (!item.open) {
      window.requestAnimationFrame(() => animateAnswer(answer, 0, answer.scrollHeight));
      return;
    }
    event.preventDefault();
    item.dataset.faqBusy = '1';
    animateAnswer(answer, answer.offsetHeight, 0, () => {
      item.open = false;
      delete item.dataset.faqBusy;
    });
  }

  function initFaqMotion() {
    const list = document.querySelector('[data-faq]');
    if (list) { list.addEventListener('click', onFaqClick); }
  }

  /* ---------------------------------------------------------------- */
  /* boot                                                             */
  /* ---------------------------------------------------------------- */

  function whenFontsReady() {
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const timeout = new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS));
    return Promise.race([fontsReady.catch(() => undefined), timeout]);
  }

  function initResizeHandling() {
    let timer = 0;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (window.innerWidth === lastWidth) { return; }
        lastWidth = window.innerWidth;
        resizeSafely();
      }, RESIZE_DEBOUNCE_MS);
    }, { passive: true });
  }

  function resizeSafely() {
    try {
      resplitUnrevealedLines();
    } catch (error) {
      failSafe();
    }
  }

  function start() {
    try {
      const targets = Array.from(document.querySelectorAll('[data-split]:not([data-hero-line])'));
      targets.filter((el) => el.getAttribute('data-split') !== 'lines').forEach(splitTarget);
      splitLinesBatch(targets.filter((el) => el.getAttribute('data-split') === 'lines'));
      initHero();
      initScenes();
      initFaqMotion();
      initObserver();
      initResizeHandling();
    } catch (error) {
      failSafe();
    }
  }

  function init() {
    initHeader();
    if (prefersReducedMotion()) {
      const hero = document.querySelector('.hero');
      if (hero) { hero.classList.add('hero--done'); }
      return;
    }
    whenFontsReady().then(start, failSafe);
    /* Fonts that land after the short wait change line breaks: re-measure lines not yet revealed. */
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(resizeSafely, () => undefined); }
  }

  init();
})();
