/*
 * Itera Collectives Photobooth - doodles.js (module prefix: doodle)
 * Reads the inline SVG sprite (in index.html), fills every .doodle[data-doodle] with a deep
 * clone of its symbol, and adds .is-drawn once each .doodle-draw is in view.
 * No dependency on other modules; any failure leaves all doodles fully drawn.
 */
(function () {
  'use strict';

  const SPRITE_ID = 'itera-sprite';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const READY_CLASS = 'doodles-ready';
  const DRAWN_CLASS = 'is-drawn';
  const DRAW_SELECTOR = '.doodle-draw';
  const DOODLE_SELECTOR = '.doodle[data-doodle]';
  const VISIBLE_RATIO = 0.35;
  const TALL_VISIBLE_RATIO = 0.05;
  const TALL_VIEWPORT_FACTOR = 0.9;
  const RATIO_TOLERANCE = 0.001;
  const OBSERVER_MARGIN = '0px 0px -10% 0px';
  const PATH_STAGGER_MS = 220;
  const MAX_PHONE_MARGIN_DOODLES = 2;
  const STRETCH_ID_PREFIXES = ['wave-divider-', 'process-line-'];
  const STRETCH_CLASS = 'doodle--around';
  const MARGIN_CLASSES = [
    'doodle--tl', 'doodle--tr', 'doodle--bl', 'doodle--br', 'doodle--ml', 'doodle--mr',
  ];
  const HIDE_ON_PHONE_CLASSES = ['doodle--md-up', 'doodle--phone-hidden'];

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_error) {
      return false;
    }
  }

  // The sprite is inlined in index.html (single source of truth: assets/doodles.svg
  // is kept as the editable copy). Icons render from first paint, no fetch needed.
  function ensureSprite() {
    const sprite = document.getElementById(SPRITE_ID);
    if (!sprite || sprite.getElementsByTagName('symbol').length === 0) {
      throw new Error('doodle sprite missing');
    }
    document.documentElement.classList.add(READY_CLASS);
    return sprite;
  }

  function buildSymbolIndex(sprite) {
    const symbols = Array.from(sprite.querySelectorAll('symbol'));
    return new Map(symbols.map(function (symbol) { return [symbol.getAttribute('id'), symbol]; }));
  }

  function shouldStretch(element, id) {
    const byId = STRETCH_ID_PREFIXES.some(function (prefix) { return id.indexOf(prefix) === 0; });
    return byId || element.classList.contains(STRETCH_CLASS);
  }

  function createDoodleSvg(symbol, stretch) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', stretch ? 'doodle__svg doodle__svg--stretch' : 'doodle__svg');
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox') || '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', stretch ? 'none' : 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    Array.from(symbol.childNodes).forEach(function (node) {
      svg.appendChild(node.cloneNode(true));
    });
    Array.from(svg.querySelectorAll('path')).forEach(function (pathEl, index) {
      pathEl.style.setProperty('--path-delay', index * PATH_STAGGER_MS + 'ms');
    });
    return svg;
  }

  function applyDelay(element) {
    const parsed = Number.parseInt(element.getAttribute('data-doodle-delay'), 10);
    const delay = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    element.style.setProperty('--doodle-delay', delay + 'ms');
  }

  function fillDoodle(element, index) {
    const id = element.getAttribute('data-doodle') || '';
    const symbol = index.get(id);
    if (!symbol || element.querySelector('.doodle__svg')) { return; }
    element.appendChild(createDoodleSvg(symbol, shouldStretch(element, id)));
  }

  function hasAnyClass(element, names) {
    return names.some(function (name) { return element.classList.contains(name); });
  }

  function limitPhoneMarginDoodles() {
    Array.from(document.querySelectorAll('.has-doodles')).forEach(function (section) {
      const margins = Array.from(section.querySelectorAll('.doodle')).filter(function (el) {
        return hasAnyClass(el, MARGIN_CLASSES) && !hasAnyClass(el, HIDE_ON_PHONE_CLASSES);
      });
      margins.slice(MAX_PHONE_MARGIN_DOODLES).forEach(function (el) {
        el.classList.add('doodle--phone-hidden');
      });
    });
  }

  function markDrawn(element) {
    element.classList.add(DRAWN_CLASS);
  }

  function createObserver(ratio) {
    return new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < ratio - RATIO_TOLERANCE) { return; }
        markDrawn(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: ratio, rootMargin: OBSERVER_MARGIN });
  }

  function isTall(element) {
    return element.getBoundingClientRect().height * VISIBLE_RATIO >
      window.innerHeight * TALL_VIEWPORT_FACTOR;
  }

  function revealOnView(elements) {
    if (prefersReducedMotion() || typeof window.IntersectionObserver !== 'function') {
      elements.forEach(markDrawn);
      return;
    }
    const normal = createObserver(VISIBLE_RATIO);
    const tall = createObserver(TALL_VISIBLE_RATIO);
    elements.forEach(function (element) {
      (isTall(element) ? tall : normal).observe(element);
    });
  }

  function markAllDrawn() {
    Array.from(document.querySelectorAll(DRAW_SELECTOR)).forEach(markDrawn);
  }

  function init() {
    if (prefersReducedMotion()) { markAllDrawn(); }
    try {
      const sprite = ensureSprite();
      const index = buildSymbolIndex(sprite);
      const doodles = Array.from(document.querySelectorAll(DOODLE_SELECTOR));
      doodles.forEach(function (element) {
        applyDelay(element);
        fillDoodle(element, index);
      });
      limitPhoneMarginDoodles();
      revealOnView(doodles.filter(function (el) { return el.matches(DRAW_SELECTOR); }));
    } catch (_error) {
      // Never leave a half-hidden doodle behind: show everything fully drawn.
      markAllDrawn();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
