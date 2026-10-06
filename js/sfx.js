/* Itera Collectives - sfx.js
 * Web Audio synthesized click sounds (shutter, pen tick, flash+shutter),
 * mute toggle, white flash overlay, and itera:* events. No audio files.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'itera.sfx.muted';
  const MASTER_GAIN = 0.35;
  const THROTTLE_MS = 60;
  const FLASH_MS = 320;
  const FLASH_CLASS = 'is-firing';
  const NOISE_SECONDS = 0.5;
  const FLASH_SHUTTER_DELAY = 0.07;
  const SHUTTER_PEAK = 0.12;
  const PEN_TICK_PEAK = 0.06;
  const PEN_BLIP_PEAK = 0.05;
  const ZAP_PEAK = 0.08;
  const FLOOR = 0.0001;
  const TARGET_SELECTOR = '[data-sfx], a[href], button, summary, [role="button"], [role="tab"], label[for]';
  const FIELD_SELECTOR = 'input, textarea, select, [contenteditable]';
  const PEN_SELECTOR = 'summary, [role="tab"], [aria-pressed], .nav__link, .nav__toggle';
  const VALID_TYPES = ['shutter', 'pen', 'flash'];
  const TOGGLE_SELECTOR = '[data-sound-toggle]';

  const root = document.documentElement;
  const state = { ctx: null, master: null, noise: null, muted: false, lastPlay: -Infinity, flashTimer: 0 };

  /* ---------- environment helpers ---------- */

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function readStoredMute() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === '1') { return true; }
      if (value === '0') { return false; }
    } catch (e) { /* storage unavailable: use default */ }
    return null;
  }

  function writeStoredMute(muted) {
    try {
      window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch (e) { /* storage unavailable: state is session-only */ }
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: false, detail }));
  }

  /* ---------- audio engine ---------- */

  function createNoiseBuffer(ctx) {
    const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) { data[i] = Math.random() * 2 - 1; }
    return buffer;
  }

  function ensureContext() {
    if (state.ctx) { return state.ctx; }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { return null; }
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
      state.ctx = ctx;
      state.master = master;
      state.noise = createNoiseBuffer(ctx);
    } catch (e) {
      return null;
    }
    return state.ctx;
  }

  function resumeContext() {
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') {
      const attempt = ctx.resume();
      if (attempt && typeof attempt.catch === 'function') { attempt.catch(function () { /* blocked until next gesture */ }); }
    }
    return ctx;
  }

  function envelope(ctx, peak, start, duration) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(FLOOR, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(FLOOR, start + duration);
    gain.connect(state.master);
    return gain;
  }

  function noiseBurst(ctx, opts) {
    const src = ctx.createBufferSource();
    src.buffer = state.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type;
    filter.frequency.setValueAtTime(opts.freq, opts.start);
    if (opts.freqEnd) { filter.frequency.exponentialRampToValueAtTime(opts.freqEnd, opts.start + opts.duration); }
    filter.Q.value = opts.q || 0.7;
    src.connect(filter);
    filter.connect(envelope(ctx, opts.peak, opts.start, opts.duration));
    src.start(opts.start, Math.random() * (NOISE_SECONDS - opts.duration - 0.01));
    src.stop(opts.start + opts.duration + 0.02);
  }

  function tone(ctx, opts) {
    const osc = ctx.createOscillator();
    osc.type = opts.wave;
    osc.frequency.setValueAtTime(opts.freq, opts.start);
    if (opts.freqEnd) { osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, opts.start + opts.duration); }
    osc.connect(envelope(ctx, opts.peak, opts.start, opts.duration));
    osc.start(opts.start);
    osc.stop(opts.start + opts.duration + 0.02);
  }

  function playShutter(ctx, at) {
    const band = { type: 'bandpass', freq: 2400, q: 1.2, peak: SHUTTER_PEAK };
    noiseBurst(ctx, { ...band, start: at, duration: 0.035 });
    noiseBurst(ctx, { ...band, start: at + 0.045, duration: 0.055, peak: SHUTTER_PEAK * 0.85 });
    tone(ctx, { wave: 'sine', freq: 170, freqEnd: 120, peak: SHUTTER_PEAK * 0.9, start: at, duration: 0.045 });
  }

  function playPen(ctx, at) {
    noiseBurst(ctx, { type: 'highpass', freq: 3000, peak: PEN_TICK_PEAK, start: at, duration: 0.025 });
    tone(ctx, { wave: 'triangle', freq: 1100, peak: PEN_BLIP_PEAK, start: at, duration: 0.03 });
  }

  function playFlash(ctx, at) {
    noiseBurst(ctx, { type: 'highpass', freq: 1500, freqEnd: 7000, peak: ZAP_PEAK, start: at, duration: 0.14 });
    playShutter(ctx, at + FLASH_SHUTTER_DELAY);
  }

  const VOICES = { shutter: playShutter, pen: playPen, flash: playFlash };

  function playSound(type) {
    if (state.muted) { return; }
    const voice = VOICES[type];
    if (!voice) { return; }
    const ctx = resumeContext();
    if (!ctx) { return; }
    const now = performance.now();
    if (now - state.lastPlay < THROTTLE_MS) { return; }
    state.lastPlay = now;
    try {
      voice(ctx, ctx.currentTime + 0.005);
    } catch (e) { /* audio failure must never affect the page */ }
  }

  /* ---------- flash overlay ---------- */

  function getFlashOverlay() {
    const existing = document.querySelector('.sfx-flash');
    if (existing) { return existing; }
    const overlay = document.createElement('div');
    overlay.className = 'sfx-flash';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }

  function fireFlashOverlay() {
    if (prefersReducedMotion() || !document.body) { return; }
    const overlay = getFlashOverlay();
    overlay.classList.remove(FLASH_CLASS);
    void overlay.offsetWidth; /* restart the animation */
    overlay.classList.add(FLASH_CLASS);
    window.clearTimeout(state.flashTimer);
    state.flashTimer = window.setTimeout(function () { overlay.classList.remove(FLASH_CLASS); }, FLASH_MS);
  }

  /* ---------- click mapping ---------- */

  function isSilentTarget(el, target) {
    if (el.matches(TOGGLE_SELECTOR) || el.getAttribute('data-sfx') === 'none') { return true; }
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') { return true; }
    if (el.matches('input, textarea, select')) { return true; }
    const isButtonLike = el.matches('button, summary');
    if (!isButtonLike && target.closest && target.closest(FIELD_SELECTOR)) { return true; }
    if (el.tagName === 'LABEL' && !el.querySelector('button')) { return true; }
    return false;
  }

  function resolveType(el) {
    const declared = el.getAttribute('data-sfx');
    if (VALID_TYPES.indexOf(declared) !== -1) { return declared; }
    if (el.matches(PEN_SELECTOR)) { return 'pen'; }
    return 'shutter';
  }

  function clickPoint(event, el) {
    if (event.clientX || event.clientY) { return { x: event.clientX, y: event.clientY }; }
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function onClick(event) {
    const target = event.target;
    if (!target || !target.closest) { return; }
    const el = target.closest(TARGET_SELECTOR);
    if (!el || isSilentTarget(el, target)) { return; }
    const type = resolveType(el);
    const point = clickPoint(event, el);
    if (type === 'flash') {
      fireFlashOverlay();
      emit('itera:flash', point);
    } else {
      emit('itera:click', { type, x: point.x, y: point.y });
    }
    playSound(type);
  }

  function onSfxRequest(event) {
    const type = event && event.detail ? event.detail.type : null;
    if (VALID_TYPES.indexOf(type) === -1) { return; }
    playSound(type);
  }

  /* ---------- mute toggle ---------- */

  function applyMuteState(muted, source) {
    state.muted = muted;
    root.setAttribute('data-sound', muted ? 'off' : 'on');
    const toggle = document.querySelector(TOGGLE_SELECTOR);
    if (toggle) {
      toggle.setAttribute('aria-pressed', muted ? 'false' : 'true');
      toggle.setAttribute('title', muted ? 'Sound effects off' : 'Sound effects on');
      const use = toggle.querySelector('use');
      if (use) { use.setAttribute('href', muted ? '#speaker-off' : '#speaker-on'); }
    }
    emit('itera:mute-change', { muted, source });
  }

  function onToggleClick() {
    const nextMuted = !state.muted;
    writeStoredMute(nextMuted);
    applyMuteState(nextMuted, 'user');
    if (!nextMuted) {
      state.lastPlay = -Infinity;
      playSound('pen');
    }
  }

  function initToggle() {
    const stored = readStoredMute();
    const muted = stored === null ? prefersReducedMotion() : stored;
    applyMuteState(muted, 'init');
    const toggle = document.querySelector(TOGGLE_SELECTOR);
    if (toggle) { toggle.addEventListener('click', onToggleClick); }
  }

  /* ---------- init ---------- */

  function onFirstGesture() {
    resumeContext();
  }

  function init() {
    initToggle();
    const once = { capture: true, passive: true, once: true };
    document.addEventListener('pointerdown', onFirstGesture, once);
    document.addEventListener('keydown', onFirstGesture, once);
    document.addEventListener('touchstart', onFirstGesture, once);
    document.addEventListener('click', onClick, true);
    document.addEventListener('itera:sfx', onSfxRequest);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
