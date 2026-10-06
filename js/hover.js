/* Itera Collectives - hover.js
 * Image hover zoom/tilt, "view" tag beside the arrow cursor and lightbox (contract v2, 4.12, 4.13, 8.5).
 * Failure-isolated IIFE. No globals, no storage.
 */
(function () {
  'use strict';

  var ZOOM_SELECTOR = 'figure[data-zoom]';
  var FRAME_SELECTOR = '.photo__frame';
  var TILT_MAX_DEG = 5;
  var CURSOR_LERP = 0.25;
  var CURSOR_EPSILON = 0.1;
  var SWIPE_MIN_PX = 50;
  var TAP_MAX_PX = 10;
  var ZOOM_LEVEL = 2;
  var PAN_STEP_PX = 60;
  var CLOSE_MS = 300;
  var CLOSE_MS_REDUCED = 150;
  var INERT_SELECTOR = '[data-site-header], main, .site-footer, .sticky-bar, .scene';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
  var REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

  var root = document.documentElement;

  function matches(query) {
    try {
      return window.matchMedia(query).matches;
    } catch (e) {
      return false;
    }
  }

  function prefersReducedMotion() {
    return matches(REDUCED_QUERY);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* Event contract (all on document, bubbles: false):
   *   itera:lightbox-open    { src, index, count }  once, when the viewer opens
   *   itera:lightbox-change  { src, index, count }  each prev/next/Home/End move
   *   itera:lightbox-close   {}
   */
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: false, detail: detail }));
  }

  function frameFromTarget(target) {
    if (!target || !target.closest) { return null; }
    var frame = target.closest(FRAME_SELECTOR);
    if (!frame || !frame.closest(ZOOM_SELECTOR)) { return null; }
    return frame;
  }

  /* ---------------------------------------------------------------
   * Lightbox
   * ------------------------------------------------------------- */
  var box = null;
  var boxParts = null;
  var boxItems = [];
  var boxIndex = 0;
  var boxTrigger = null;
  var boxOpen = false;
  var closeTimer = 0;
  var loadToken = 0;
  var inertNodes = [];
  var pointerState = null;
  var panState = { x: 0, y: 0 };

  function svgIcon(id) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function zoomIcon() {
    var svg = svgIcon('close');
    svg.removeChild(svg.firstChild);
    [['circle', { cx: '21', cy: '21', r: '12' }], ['path', { d: 'M30 30l11 11M15 21h12M21 15v12' }]].forEach(function (part) {
      var node = document.createElementNS(SVG_NS, part[0]);
      Object.keys(part[1]).forEach(function (name) { node.setAttribute(name, part[1][name]); });
      svg.appendChild(node);
    });
    return svg;
  }

  function makeButton(modifier, label, iconId) {
    var button = document.createElement('button');
    button.className = 'lightbox__btn lightbox__' + modifier;
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('data-sfx', 'pen');
    button.appendChild(iconId ? svgIcon(iconId) : zoomIcon());
    return button;
  }

  function buildLightbox() {
    var el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Image viewer');
    el.setAttribute('aria-describedby', 'lightbox-caption');
    el.hidden = true;

    var backdrop = document.createElement('div');
    backdrop.className = 'lightbox__backdrop';
    backdrop.setAttribute('data-lightbox-close', '');

    var figure = document.createElement('figure');
    figure.className = 'lightbox__figure';
    var img = document.createElement('img');
    img.className = 'lightbox__img';
    img.alt = '';
    img.tabIndex = -1;
    img.draggable = false;
    var caption = document.createElement('figcaption');
    caption.className = 'lightbox__caption';
    caption.id = 'lightbox-caption';
    figure.appendChild(img);
    figure.appendChild(caption);

    var close = makeButton('close', 'Close image viewer', 'close');
    var zoom = makeButton('zoom', 'Zoom', '');
    zoom.setAttribute('aria-pressed', 'false');
    var prev = makeButton('prev', 'Previous image', 'chevron-left');
    var next = makeButton('next', 'Next image', 'chevron-right');
    var count = document.createElement('p');
    count.className = 'lightbox__count';
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    var countVisual = document.createElement('span');
    countVisual.setAttribute('aria-hidden', 'true');
    var countSpoken = document.createElement('span');
    countSpoken.className = 'visually-hidden';
    count.appendChild(countVisual);
    count.appendChild(countSpoken);

    [backdrop, figure, close, zoom, prev, next, count].forEach(function (node) { el.appendChild(node); });
    document.body.appendChild(el);

    boxParts = {
      img: img, caption: caption, close: close, zoom: zoom, prev: prev, next: next,
      count: count, countVisual: countVisual, countSpoken: countSpoken, figure: figure
    };
    return el;
  }

  function ensureLightbox() {
    if (box) { return box; }
    box = buildLightbox();
    box.addEventListener('click', onBoxClick);
    boxParts.img.addEventListener('pointerdown', onImagePointerDown);
    boxParts.img.addEventListener('pointermove', onImagePointerMove);
    boxParts.img.addEventListener('pointerup', onImagePointerUp);
    boxParts.img.addEventListener('pointercancel', onImagePointerCancel);
    return box;
  }

  function itemData(figure) {
    var img = figure.querySelector('.photo__img');
    var frame = figure.querySelector(FRAME_SELECTOR);
    var alt = img ? (img.getAttribute('alt') || '') : '';
    return {
      src: figure.getAttribute('data-full') || (frame && frame.getAttribute('href')) || (img && img.currentSrc) || (img && img.src) || '',
      caption: figure.getAttribute('data-caption') || alt,
      figure: figure,
      frame: frame
    };
  }

  function isRendered(figure) {
    return figure.offsetParent !== null && !figure.closest('[hidden]');
  }

  /* Visible figures only, one entry per image, so Next/Previous and the spoken count skip repeats. */
  function collectItems(current) {
    var seen = {};
    return Array.prototype.slice.call(document.querySelectorAll(ZOOM_SELECTOR))
      .filter(function (figure) { return figure === current || isRendered(figure); })
      .map(itemData)
      .filter(function (item) { return item.src !== ''; })
      .reduce(function (list, item) {
        if (seen[item.src] === undefined) {
          seen[item.src] = list.length;
          return list.concat([item]);
        }
        if (item.figure !== current) { return list; }
        return list.map(function (prev, i) { return i === seen[item.src] ? item : prev; });
      }, []);
  }

  function setInert(on) {
    if (on) {
      inertNodes = Array.prototype.slice.call(document.querySelectorAll(INERT_SELECTOR));
      inertNodes.forEach(function (node) { node.setAttribute('inert', ''); });
      return;
    }
    inertNodes.forEach(function (node) { node.removeAttribute('inert'); });
    inertNodes = [];
  }

  function resetZoom() {
    panState = { x: 0, y: 0 };
    box.classList.remove('is-zoomed', 'is-panning');
    boxParts.img.style.removeProperty('--px');
    boxParts.img.style.removeProperty('--py');
    boxParts.img.style.removeProperty('--zx');
    boxParts.img.style.removeProperty('--zy');
    boxParts.zoom.setAttribute('aria-pressed', 'false');
  }

  function preload(index) {
    var count = boxItems.length;
    if (count < 2) { return; }
    [index + 1, index - 1].forEach(function (i) {
      var item = boxItems[(i + count) % count];
      var probe = new Image();
      probe.src = item.src;
    });
  }

  function showItem(index) {
    var count = boxItems.length;
    boxIndex = (index + count) % count;
    var item = boxItems[boxIndex];
    var token = ++loadToken;
    resetZoom();
    box.classList.add('is-loading');
    var done = function () {
      if (token === loadToken) { box.classList.remove('is-loading'); }
    };
    boxParts.img.onload = done;
    boxParts.img.onerror = done;
    boxParts.img.src = item.src;
    boxParts.img.alt = item.caption;
    boxParts.caption.textContent = item.caption;
    boxParts.countVisual.textContent = (boxIndex + 1) + ' / ' + count;
    boxParts.countSpoken.textContent = item.caption + ', ' + (boxIndex + 1) + ' of ' + count;
    boxParts.prev.hidden = count < 2;
    boxParts.next.hidden = count < 2;
    preload(boxIndex);
  }

  function openLightbox(figure, trigger) {
    ensureLightbox();
    boxItems = collectItems(figure);
    var start = boxItems.findIndex(function (item) { return item.figure === figure; });
    if (start < 0) { return; }
    window.clearTimeout(closeTimer);
    boxTrigger = trigger || document.activeElement;
    boxOpen = true;
    hideCursor();
    box.hidden = false;
    showItem(start);
    window.requestAnimationFrame(function () { box.classList.add('is-open'); });
    root.classList.add('lightbox-open');
    setInert(true);
    boxParts.close.focus();
    emit('itera:lightbox-open', { src: boxItems[boxIndex].src, index: boxIndex, count: boxItems.length });
  }

  function closeLightbox() {
    if (!boxOpen) { return; }
    boxOpen = false;
    box.classList.remove('is-open');
    root.classList.remove('lightbox-open');
    setInert(false);
    var trigger = boxTrigger;
    boxTrigger = null;
    if (trigger && trigger.focus) { trigger.focus(); }
    closeTimer = window.setTimeout(function () {
      box.hidden = true;
      resetZoom();
      boxParts.img.removeAttribute('src');
    }, prefersReducedMotion() ? CLOSE_MS_REDUCED : CLOSE_MS);
    emit('itera:lightbox-close', {});
  }

  function go(index) {
    showItem(index);
    emit('itera:lightbox-change', { src: boxItems[boxIndex].src, index: boxIndex, count: boxItems.length });
  }

  function step(delta, silent) {
    if (boxItems.length < 2) { return; }
    go(boxIndex + delta);
    if (!silent) { emit('itera:sfx', { type: 'pen' }); }
  }

  function onBoxClick(event) {
    var target = event.target;
    if (target.closest('.lightbox__close') || target.closest('[data-lightbox-close]')) {
      closeLightbox();
      return;
    }
    if (target.closest('.lightbox__zoom')) { toggleZoomAt(50, 50); return; }
    if (target.closest('.lightbox__prev')) { step(-1, true); return; }
    if (target.closest('.lightbox__next')) { step(1, true); }
  }

  /* Image: tap to zoom, drag to pan when zoomed, swipe to navigate. */
  function toggleZoomAt(zx, zy) {
    if (box.classList.contains('is-zoomed')) {
      resetZoom();
      return;
    }
    boxParts.img.style.setProperty('--zx', zx + '%');
    boxParts.img.style.setProperty('--zy', zy + '%');
    box.classList.add('is-zoomed');
    boxParts.zoom.setAttribute('aria-pressed', 'true');
  }

  function toggleZoom(event) {
    var rect = boxParts.img.getBoundingClientRect();
    toggleZoomAt(
      clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    );
  }

  /* Keyboard pan while zoomed (WCAG 2.1.1 / 2.5.7: no drag-only interaction). */
  var PAN_KEYS = { ArrowLeft: [PAN_STEP_PX, 0], ArrowRight: [-PAN_STEP_PX, 0], ArrowUp: [0, PAN_STEP_PX], ArrowDown: [0, -PAN_STEP_PX] };

  function panByKey(key) {
    var delta = PAN_KEYS[key];
    if (!delta || !box.classList.contains('is-zoomed')) { return false; }
    applyPan(panState.x + delta[0], panState.y + delta[1]);
    return true;
  }

  function onImagePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) { return; }
    pointerState = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: panState.x,
      panY: panState.y,
      moved: false
    };
    try { boxParts.img.setPointerCapture(event.pointerId); } catch (e) { /* capture unsupported: drag still works while over image */ }
  }

  function applyPan(x, y) {
    var rect = boxParts.img.getBoundingClientRect();
    var maxX = rect.width / 2;
    var maxY = rect.height / 2;
    panState = { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    boxParts.img.style.setProperty('--px', panState.x + 'px');
    boxParts.img.style.setProperty('--py', panState.y + 'px');
  }

  function onImagePointerMove(event) {
    if (!pointerState || pointerState.id !== event.pointerId) { return; }
    var dx = event.clientX - pointerState.x;
    var dy = event.clientY - pointerState.y;
    if (Math.hypot(dx, dy) > TAP_MAX_PX) { pointerState = Object.assign({}, pointerState, { moved: true }); }
    if (pointerState.moved && box.classList.contains('is-zoomed')) {
      box.classList.add('is-panning');
      applyPan(pointerState.panX + dx, pointerState.panY + dy);
    }
  }

  function onImagePointerUp(event) {
    if (!pointerState || pointerState.id !== event.pointerId) { return; }
    var dx = event.clientX - pointerState.x;
    var dy = event.clientY - pointerState.y;
    var wasMoved = pointerState.moved;
    pointerState = null;
    box.classList.remove('is-panning');
    if (!wasMoved) { toggleZoom(event); return; }
    if (box.classList.contains('is-zoomed')) { return; }
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) { step(dx < 0 ? 1 : -1, false); }
  }

  function onImagePointerCancel() {
    pointerState = null;
    box.classList.remove('is-panning');
  }

  function trapTab(event) {
    var focusables = [boxParts.close, boxParts.zoom, boxParts.prev, boxParts.next].filter(function (node) { return !node.hidden; });
    var index = focusables.indexOf(document.activeElement);
    var delta = event.shiftKey ? -1 : 1;
    var nextIndex = index < 0 ? 0 : (index + delta + focusables.length) % focusables.length;
    event.preventDefault();
    focusables[nextIndex].focus();
  }

  function onKeyDown(event) {
    if (!boxOpen) { return; }
    var key = event.key;
    if (key === 'Escape') { event.preventDefault(); closeLightbox(); return; }
    if (key === 'Tab') { trapTab(event); return; }
    if (key === '+' || key === '=') { event.preventDefault(); if (!box.classList.contains('is-zoomed')) { toggleZoomAt(50, 50); } return; }
    if (key === '-' || key === '_') { event.preventDefault(); if (box.classList.contains('is-zoomed')) { resetZoom(); } return; }
    if (panByKey(key)) { event.preventDefault(); return; }
    if (key === 'ArrowLeft') { event.preventDefault(); step(-1, false); return; }
    if (key === 'ArrowRight') { event.preventDefault(); step(1, false); return; }
    if (key === 'Home') { event.preventDefault(); go(0); return; }
    if (key === 'End') { event.preventDefault(); go(boxItems.length - 1); }
  }

  function onFrameClick(event) {
    if (event.defaultPrevented) { return; }
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) { return; }
    var frame = frameFromTarget(event.target);
    if (!frame) { return; }
    event.preventDefault();
    openLightbox(frame.closest(ZOOM_SELECTOR), frame);
  }

  /* ---------------------------------------------------------------
   * Hover zoom/tilt + "view" tag
   * ------------------------------------------------------------- */
  var cursor = null;
  var cursorTarget = { x: 0, y: 0 };
  var cursorPos = { x: 0, y: 0 };
  var cursorRaf = 0;
  var cursorVisible = false;
  var activeFrame = null;
  var lastPointer = null;
  var moveRaf = 0;

  /* The site cursor is the client's arrow (CSS). This is only the small "view" tag that trails it. */
  function buildCursor() {
    var el = document.createElement('div');
    el.className = 'itera-cursor';
    el.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.className = 'itera-cursor__label';
    label.textContent = 'view';
    el.appendChild(label);
    document.body.appendChild(el);
    return el;
  }

  function paintCursor() {
    cursor.style.setProperty('--cx', cursorPos.x + 'px');
    cursor.style.setProperty('--cy', cursorPos.y + 'px');
  }

  function cursorTick() {
    cursorRaf = 0;
    if (prefersReducedMotion()) {
      cursorPos = { x: cursorTarget.x, y: cursorTarget.y };
    } else {
      cursorPos = {
        x: cursorPos.x + (cursorTarget.x - cursorPos.x) * CURSOR_LERP,
        y: cursorPos.y + (cursorTarget.y - cursorPos.y) * CURSOR_LERP
      };
    }
    paintCursor();
    var settled = Math.abs(cursorTarget.x - cursorPos.x) < CURSOR_EPSILON &&
      Math.abs(cursorTarget.y - cursorPos.y) < CURSOR_EPSILON;
    if (!settled) { cursorRaf = window.requestAnimationFrame(cursorTick); }
  }

  function moveCursorTo(x, y, snap) {
    cursorTarget = { x: x, y: y };
    if (snap) { cursorPos = { x: x, y: y }; }
    if (!cursorRaf) { cursorRaf = window.requestAnimationFrame(cursorTick); }
  }

  function showCursor(x, y) {
    if (!cursor || boxOpen) { return; }
    moveCursorTo(x, y, !cursorVisible);
    if (cursorVisible) { return; }
    cursorVisible = true;
    cursor.classList.add('is-visible');
  }

  function hideCursor() {
    if (!cursor || !cursorVisible) { return; }
    cursorVisible = false;
    cursor.classList.remove('is-visible', 'is-down');
  }

  function tiltFor(figure, nx, ny) {
    if (!figure.hasAttribute('data-tilt')) { return; }
    figure.style.setProperty('--rx', ((ny - 0.5) * 2 * TILT_MAX_DEG).toFixed(2) + 'deg');
    figure.style.setProperty('--ry', ((0.5 - nx) * 2 * TILT_MAX_DEG).toFixed(2) + 'deg');
  }

  function trackOrigin(frame, x, y) {
    var figure = frame.closest(ZOOM_SELECTOR);
    var rect = frame.getBoundingClientRect();
    if (!figure || rect.width === 0 || rect.height === 0) { return; }
    var nx = clamp((x - rect.left) / rect.width, 0, 1);
    var ny = clamp((y - rect.top) / rect.height, 0, 1);
    figure.style.setProperty('--ox', (nx * 100).toFixed(1) + '%');
    figure.style.setProperty('--oy', (ny * 100).toFixed(1) + '%');
    tiltFor(figure, nx, ny);
  }

  function leaveFrame(frame) {
    var figure = frame.closest(ZOOM_SELECTOR);
    if (!figure) { return; }
    figure.classList.remove('is-hovering');
    ['--ox', '--oy', '--rx', '--ry'].forEach(function (name) { figure.style.removeProperty(name); });
  }

  function enterFrame(frame) {
    var figure = frame.closest(ZOOM_SELECTOR);
    if (figure && !prefersReducedMotion()) { figure.classList.add('is-hovering'); }
  }

  function processPointer() {
    moveRaf = 0;
    if (!lastPointer) { return; }
    var frame = lastPointer.frame;
    if (frame !== activeFrame) {
      if (activeFrame) { leaveFrame(activeFrame); }
      activeFrame = frame;
      if (frame) { enterFrame(frame); }
    }
    if (!frame) { hideCursor(); return; }
    showCursor(lastPointer.x, lastPointer.y);
    if (!prefersReducedMotion()) { trackOrigin(frame, lastPointer.x, lastPointer.y); }
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || boxOpen) { return; }
    lastPointer = { x: event.clientX, y: event.clientY, frame: frameFromTarget(event.target) };
    if (!moveRaf) { moveRaf = window.requestAnimationFrame(processPointer); }
  }

  function onPointerLeaveDocument(event) {
    if (event.relatedTarget) { return; }
    lastPointer = { x: 0, y: 0, frame: null };
    if (!moveRaf) { moveRaf = window.requestAnimationFrame(processPointer); }
  }

  function onPointerDown(event) {
    if (cursor && cursorVisible && event.pointerType !== 'touch') { cursor.classList.add('is-down'); }
  }

  function onPointerUp() {
    if (cursor) { cursor.classList.remove('is-down'); }
  }

  function enableHover() {
    cursor = buildCursor();
    root.classList.add('has-itera-cursor');
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('pointerout', onPointerLeaveDocument, { passive: true });
  }

  function watchFinePointer() {
    var query;
    try {
      query = window.matchMedia(FINE_POINTER_QUERY);
    } catch (e) {
      return;
    }
    if (query.matches) { enableHover(); return; }
    var onChange = function (event) {
      if (!event.matches || cursor) { return; }
      enableHover();
    };
    if (query.addEventListener) {
      query.addEventListener('change', onChange);
    } else if (query.addListener) {
      query.addListener(onChange); /* older Safari */
    }
  }

  function init() {
    document.addEventListener('click', onFrameClick);
    document.addEventListener('keydown', onKeyDown);
    watchFinePointer();
  }

  try {
    init();
  } catch (e) {
    /* Failure-isolated: frames remain plain links to the large image. */
  }
})();
