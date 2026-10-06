'use strict';

/* ==========================================================================
   scene.js - Three.js background: velvet curtain folds + floating photo strips.
   ES module (one local import, scene-textures.js). Three.js (self-hosted, minified) loads through a guarded
   dynamic import after the page has loaded, and is skipped on Save-Data / low-memory devices.
   Failure of any kind falls back to the static CSS scene (html.scene-static).
   ========================================================================== */

import { STRIP_THEMES, buildPlainTextures } from './scene-textures.js';

const THREE_URL = '../assets/vendor/three.module.min.js'; // three@0.160.0, MIT, self-hosted
const IMPORT_TIMEOUT_MS = 8000;
const IDLE_TIMEOUT_MS = 2000;
const TEXTURE_DELAY_MS = 300;
const LOW_MEMORY_GB = 2;
const PHONE_QUERY = '(max-width: 47.99em)';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const TEXTURE_URLS = [
  'assets/img/output-strips-black.webp',
  'assets/img/output-bw-grid.webp',
  'assets/img/output-strips-duo.webp'
];

const SCENE_FAINT = 0.22;
const HERO_OPACITY_CAP = 0.85;
const HERO_OPACITY_CAP_PHONE = 0.45;
const WASH_START = 0.3;
const WASH_END = 0.8;
const SCROLL_DRIFT = 2.5;
const SCROLL_DAMP = 4;
const LEAN_MAX = 0.35;
const LEAN_DAMP = 3;
const MAX_DPR_DESKTOP = 1.75;
const MAX_DPR_PHONE = 1.0;
const STRIPS_DESKTOP = 12;
const STRIPS_PHONE = 6;
const TEXTURED_DESKTOP = 4;
const TEXTURED_PHONE = 2;
const HERO_STRIP_SHARE = 0.6;
const FRAME_MS_HERO = 1000 / 60;
const FRAME_MS_BELOW = 1000 / 30;
const FRAME_MS_IDLE = 1000 / 15;
const FRAME_TOLERANCE_MS = 2; // rAF timestamps jitter around the interval
const WASH_PARK = 0.95; // below the hero and this washed out: stop drawing
const HEIGHT_JITTER_PX = 120; // mobile URL-bar show/hide
const PULSE_MS = 450;
const PULSE_KICK = 0.08;
const PULSE_CLICK_SHUTTER = 0.35;
const PULSE_CLICK_PEN = 0.15;
const RESIZE_DEBOUNCE_MS = 150;
const CAMERA_FOV = 40;
const CAMERA_Z = 10;
const AVOID_PAD = 0.06;
const AVOID_MARGIN = 0.04;
const STRIP_EXTENT_FUDGE = 1.2; // tilt + float amplitude
const AVOID_TRIES = 24;
const RIGHT_EDGE_LIMIT = 0.94; // NDC x limit for hero strips
const MAX_FRAME_DT = 0.1;
const SEED = 12345;

const ignoredHitSelector = 'a, button, input, select, textarea, label, summary, [data-sfx]';

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
varying vec2 vUv;
uniform float uTime;
uniform float uWash;
uniform float uAspect;
uniform vec3 uFlash;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  float t = uTime * 0.04;
  float x = vUv.x * uAspect;
  float warp = noise(vec2(x * 0.8, vUv.y * 1.4 + t * 3.0)) * 1.6;
  float f = sin(x * 5.5 + warp * 2.0 + t * 6.0) * 0.65
          + sin(x * 11.0 - warp * 3.0 - t * 4.0) * 0.25;
  float s = clamp(f * 0.5 + 0.5, 0.0, 1.0);

  vec3 deep = vec3(0.290, 0.047, 0.063);
  vec3 dark = vec3(0.420, 0.071, 0.090);
  vec3 maroon = vec3(0.545, 0.102, 0.122);
  vec3 hi = vec3(0.639, 0.188, 0.212);

  vec3 col = mix(deep, dark, smoothstep(0.1, 0.6, s));
  col = mix(col, maroon, smoothstep(0.55, 0.95, s) * 0.85);
  col = mix(col, hi, pow(s, 8.0) * 0.35);
  col *= 0.8 + 0.2 * (1.0 - vUv.y * 0.5);
  col *= 0.75 + 0.25 * smoothstep(1.2, 0.3, length(vUv - 0.5) * 1.2);

  vec3 wash = mix(vec3(0.957, 0.902, 0.890), vec3(0.910, 0.812, 0.812), s * 0.6);
  col = mix(col, wash, uWash);

  vec2 d = vUv - uFlash.xy;
  d.x *= uAspect;
  col += vec3(1.0, 0.96, 0.93) * uFlash.z * exp(-dot(d, d) * 6.0) * 0.9;
  gl_FragColor = vec4(col, 1.0);
}`;

/* ---------- small helpers ---------- */

const matches = (query) => {
  try {
    return window.matchMedia(query).matches;
  } catch (error) {
    return false;
  }
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const mulberry32 = (seed) => {
  let state = seed;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const createDisposer = () => {
  const tasks = [];
  return {
    add: (task) => { tasks.push(task); },
    listen: (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      tasks.push(() => target.removeEventListener(type, handler, options));
    },
    run: () => {
      tasks.splice(0).reverse().forEach((task) => {
        try {
          task();
        } catch (error) {
          // Teardown must continue even if one resource is already gone.
        }
      });
    }
  };
};

const webglAvailable = () => {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext(); // release the probe context; the renderer makes its own
    return true;
  } catch (error) {
    return false;
  }
};

const listenMedia = (query, handler) => {
  try {
    const mql = window.matchMedia(query);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  } catch (error) {
    return () => {};
  }
};

const shouldSkipThree = () => {
  const connection = navigator.connection;
  if (connection && connection.saveData) return true;
  return Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= LOW_MEMORY_GB;
};

const afterLoadAndIdle = () => new Promise((resolve) => {
  const idle = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
    else window.setTimeout(resolve, TEXTURE_DELAY_MS);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
});

/* Scroll metrics are cached (refreshed on resize / content-size change) so the
   render loop and the --scene-wash writer never force layout per frame. */
const scrollMetrics = { heroH: window.innerHeight, maxScroll: 1 };

const refreshScrollMetrics = () => {
  const heroEl = document.getElementById('hero');
  scrollMetrics.heroH = (heroEl && heroEl.offsetHeight) || window.innerHeight;
  scrollMetrics.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
};

const computeWash = (scrollY) => clamp01((scrollY / scrollMetrics.heroH - WASH_START) / (WASH_END - WASH_START));

const loadThree = () => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error('three timeout')), IMPORT_TIMEOUT_MS);
  import(THREE_URL).then(
    (module) => { window.clearTimeout(timer); resolve(module); },
    (error) => { window.clearTimeout(timer); reject(error); }
  );
});

const markStatic = () => {
  const root = document.documentElement;
  root.classList.remove('scene-live');
  root.classList.add('scene-static');
};

/* ---------- strip specs and layout ---------- */

const buildStripSpecs = (isPhone) => {
  const rand = mulberry32(SEED);
  const count = isPhone ? STRIPS_PHONE : STRIPS_DESKTOP;
  const textured = isPhone ? TEXTURED_PHONE : TEXTURED_DESKTOP;
  const heroCount = Math.round(count * HERO_STRIP_SHARE);
  return Array.from({ length: count }, (_, index) => ({
    frames: index % 3 === 0 ? 4 : 2,
    themeIndex: index % STRIP_THEMES.length,
    texturedIndex: index < textured ? index % TEXTURE_URLS.length : -1,
    inHero: index < heroCount,
    nx: rand() * 2 - 1,
    ny: rand(),
    z: rand() * 3.5 - 2,
    scale: 0.8 + rand() * 0.4,
    tilt: (rand() - 0.5) * 0.6,
    phase: rand() * Math.PI * 2,
    speed: 0.15 + rand() * 0.2,
    opacity: 0.6 + rand() * 0.35,
    leanFactor: 0.5 + rand() * 0.6
  }));
};

const visibleHalf = (z, aspect) => {
  const halfH = (CAMERA_Z - z) * Math.tan((CAMERA_FOV * Math.PI) / 360);
  return { halfW: halfH * aspect, halfH };
};

const readAvoidRect = () => {
  const el = document.querySelector('[data-scene-avoid]');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const scrollY = window.scrollY || 0;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const padX = rect.width / w * AVOID_PAD * 2;
  const padY = rect.height / h * AVOID_PAD * 2;
  return {
    left: rect.left / w * 2 - 1 - padX,
    right: rect.right / w * 2 - 1 + padX,
    top: 1 - (rect.top + scrollY) / h * 2 + padY,
    bottom: 1 - (rect.bottom + scrollY) / h * 2 - padY
  };
};

/* Tests the strip's whole footprint (centre +/- half size at its depth), not just its centre. */
const hitsRect = (ndc, extent, rect) => Boolean(rect)
  && ndc.x + extent.hw > rect.left - AVOID_MARGIN && ndc.x - extent.hw < rect.right + AVOID_MARGIN
  && ndc.y + extent.hh > rect.bottom - AVOID_MARGIN && ndc.y - extent.hh < rect.top + AVOID_MARGIN;

/* Returns a position, or null when a hero strip cannot be placed clear of the hero text
   (the strip is then hidden rather than dropped behind readable copy). */
const placeStrip = (spec, aspect, avoid, rand) => {
  const { halfW, halfH } = visibleHalf(spec.z, aspect);
  const size = stripSize(spec.frames, spec.scale);
  const extent = { hw: (size.w / 2 * STRIP_EXTENT_FUDGE) / halfW, hh: (size.h / 2 * STRIP_EXTENT_FUDGE) / halfH };
  const heroY = (ny) => (1 - ny * 2) * halfH;
  const trailY = (ny) => -halfH - ny * SCROLL_DRIFT;
  const pick = (nx, ny) => ({
    x: nx * halfW * 0.95,
    y: spec.inHero ? heroY(ny) : trailY(ny)
  });
  let candidate = pick(spec.nx, spec.ny);
  if (!spec.inHero || !avoid) return candidate;
  /* Spread hero strips across the free area right of the hero copy so that half of the hero is never empty. */
  const freeMin = avoid.right + AVOID_MARGIN + extent.hw;
  const freeMax = RIGHT_EDGE_LIMIT - extent.hw;
  if (freeMax > freeMin) {
    const slot = (spec.nx + 1) / 2;
    candidate = { x: (freeMin + (freeMax - freeMin) * slot) * halfW, y: heroY(spec.ny) };
  }
  for (let i = 0; i < AVOID_TRIES; i += 1) {
    const ndc = { x: candidate.x / halfW, y: candidate.y / halfH };
    if (!hitsRect(ndc, extent, avoid)) return candidate;
    candidate = pick(rand() * 2 - 1, rand());
  }
  return null;
};

/* ---------- scene construction ---------- */

const createBackdrop = (THREE) => {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWash: { value: 0 },
      uAspect: { value: 1 },
      uFlash: { value: new THREE.Vector3(0.5, 0.5, 0) }
    }
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material, geometry };
};

const stripSize = (frames, scale) => (frames === 2
  ? { w: 1.0 * scale, h: 2.4 * scale }
  : { w: 0.7 * scale, h: 3.22 * scale });

/* Crops a horizontal window (full height) out of the photo so each strip shows a different slice. */
const cropStripUv = (geometry, frames, offset) => {
  const uv = geometry.attributes.uv;
  const cropW = frames === 2 ? 0.5 : 0.3;
  const u0 = offset * (1 - cropW);
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, u0 + uv.getX(i) * cropW, uv.getY(i));
  }
  uv.needsUpdate = true;
};

const createStrips = (THREE, specs, plainTextures, cap) => {
  const group = new THREE.Group();
  const strips = specs.map((spec) => {
    const size = stripSize(spec.frames, spec.scale);
    const geometry = new THREE.PlaneGeometry(size.w, size.h);
    const plain = plainTextures[(spec.frames === 2 ? 0 : STRIP_THEMES.length) + spec.themeIndex];
    const material = new THREE.MeshBasicMaterial({
      map: plain.texture,
      transparent: true,
      opacity: Math.min(spec.opacity, cap),
      toneMapped: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return { spec, mesh, geometry, material, base: { x: 0, y: 0 } };
  });
  return { group, strips };
};

const applyPhoto = (strip, texture, offset) => {
  cropStripUv(strip.geometry, strip.spec.frames, offset);
  strip.material.map = texture;
  strip.material.needsUpdate = true;
};

const loadPhotoTextures = (THREE, strips, owned, isAlive) => {
  const loader = new THREE.TextureLoader();
  TEXTURE_URLS.forEach((url, urlIndex) => {
    // Only fetch photos that some strip actually uses (phones use fewer).
    if (!strips.some((strip) => strip.spec.texturedIndex === urlIndex)) return;
    loader.load(
      url,
      (texture) => {
        if (!isAlive()) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        owned.push(texture);
        strips
          .filter((strip) => strip.spec.texturedIndex === urlIndex)
          .forEach((strip, i) => applyPhoto(strip, texture, (i % 2) * 0.6));
      },
      undefined,
      () => { /* texture missing: the strip keeps its plain colored face */ }
    );
  });
};

/* ---------- main engine ---------- */

const createEngine = (THREE, container) => {
  const isPhone = matches(PHONE_QUERY) || !matches(FINE_POINTER_QUERY);
  const canLean = !isPhone && matches(FINE_POINTER_QUERY);
  const canvas = document.createElement('canvas');
  canvas.className = 'scene__canvas';
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isPhone,
    alpha: true,
    powerPreference: 'low-power'
  });
  renderer.autoClear = false;
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA_Z);

  const backdrop = createBackdrop(THREE);
  const stripScene = new THREE.Scene();
  const plainTextures = buildPlainTextures(THREE);
  const cap = isPhone ? HERO_OPACITY_CAP_PHONE : HERO_OPACITY_CAP;
  const specs = buildStripSpecs(isPhone);
  const { group, strips } = createStrips(THREE, specs, plainTextures, cap);
  stripScene.add(group);
  const photoTextures = [];

  const state = {
    time: 0,
    scrollY: 0,
    cameraY: 0,
    leanX: 0,
    leanY: 0,
    pointerX: 0,
    pointerY: 0,
    pulse: { x: 0.5, y: 0.5, strength: 0, start: 0 },
    wash: 0,
    canvasOpacity: -1,
    live: false,
    alive: true
  };

  const layout = () => {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const rand = mulberry32(SEED + 1);
    const avoid = readAvoidRect();
    strips.forEach((strip) => {
      const pos = placeStrip(strip.spec, aspect, avoid, rand);
      strip.mesh.visible = pos !== null;
      if (!pos) return;
      strip.base = pos;
      strip.mesh.position.set(pos.x, pos.y, strip.spec.z);
    });
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    backdrop.material.uniforms.uAspect.value = aspect;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, isPhone ? MAX_DPR_PHONE : MAX_DPR_DESKTOP);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    layout();
  };

  const pulse = (strength, clientX, clientY, now) => {
    const x = Number.isFinite(clientX) ? clientX : window.innerWidth / 2;
    const y = Number.isFinite(clientY) ? clientY : window.innerHeight / 2;
    state.pulse = {
      x: x / window.innerWidth,
      y: 1 - y / window.innerHeight,
      strength,
      start: now
    };
  };

  const pulseLevel = (now) => {
    const age = (now - state.pulse.start) / PULSE_MS;
    if (age >= 1 || age < 0) return { glow: 0, kick: 0 };
    const glow = state.pulse.strength * (1 - age) * (1 - age);
    return { glow, kick: PULSE_KICK * state.pulse.strength * Math.sin(Math.PI * age) };
  };

  const pulseActive = (now) => (now - state.pulse.start) < PULSE_MS;

  const updateStrips = (dt, kick) => {
    const damp = 1 - Math.exp(-LEAN_DAMP * dt);
    state.leanX += (state.pointerX - state.leanX) * damp;
    state.leanY += (state.pointerY - state.leanY) * damp;
    group.scale.setScalar(1 + kick);
    strips.forEach((strip) => {
      const { spec, mesh, base } = strip;
      const wave = state.time * spec.speed + spec.phase;
      mesh.position.y = base.y + Math.sin(wave) * 0.15;
      mesh.position.x = base.x + Math.cos(wave * 0.7) * 0.06;
      mesh.rotation.z = spec.tilt + Math.sin(wave * 0.8) * 0.06;
      mesh.rotation.y = state.leanX * LEAN_MAX * spec.leanFactor;
      mesh.rotation.x = -state.leanY * LEAN_MAX * spec.leanFactor;
    });
  };

  const readScroll = () => {
    state.scrollY = window.scrollY || 0;
    state.wash = computeWash(state.scrollY);
    return state.scrollY / scrollMetrics.maxScroll;
  };

  const applyCanvasOpacity = () => {
    if (!state.live) return;
    const next = 1 - state.wash * (1 - SCENE_FAINT);
    if (Math.abs(next - state.canvasOpacity) < 0.005) return;
    state.canvasOpacity = next;
    canvas.style.opacity = String(next);
  };

  const render = (now, dt) => {
    const progress = readScroll();
    const level = pulseLevel(now);
    state.time += dt;
    state.cameraY += ((-progress * SCROLL_DRIFT) - state.cameraY) * (1 - Math.exp(-SCROLL_DAMP * dt));
    camera.position.y = state.cameraY;
    const u = backdrop.material.uniforms;
    u.uTime.value = state.time;
    u.uWash.value = state.wash;
    u.uFlash.value.set(state.pulse.x, state.pulse.y, level.glow);
    updateStrips(dt, level.kick);
    renderer.clear();
    renderer.render(backdrop.scene, camera);
    renderer.clearDepth();
    renderer.render(stripScene, camera);
    if (!state.live) {
      state.live = true;
      document.documentElement.classList.add('scene-live');
      window.setTimeout(() => document.documentElement.classList.add('scene-settled'), 700);
      scheduleTextures();
    }
    applyCanvasOpacity();
  };

  const setHidden = (hidden) => {
    canvas.style.visibility = hidden ? 'hidden' : '';
  };

  const setPointer = (clientX, clientY) => {
    if (!canLean) return;
    state.pointerX = (clientX / window.innerWidth) * 2 - 1;
    state.pointerY = (clientY / window.innerHeight) * 2 - 1;
  };

  const dispose = () => {
    state.alive = false;
    strips.forEach((strip) => {
      strip.geometry.dispose();
      strip.material.dispose();
    });
    plainTextures.forEach((entry) => entry.texture.dispose());
    photoTextures.forEach((texture) => texture.dispose());
    backdrop.geometry.dispose();
    backdrop.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  // Photo textures wait for the first rendered frame, then for an idle moment.
  const scheduleTextures = () => {
    const load = () => loadPhotoTextures(THREE, strips, photoTextures, () => state.alive);
    if (window.requestIdleCallback) window.requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });
    else window.setTimeout(load, TEXTURE_DELAY_MS);
  };

  resize();

  return {
    canvas, state, isPhone, render, resize, pulse, pulseActive, setPointer, setHidden, dispose
  };
};

/* ---------- controller: loop, events, lifecycle ---------- */

const startController = (engine, disposer) => {
  const flags = {
    heroVisible: true,
    lightbox: false,
    paused: document.documentElement.classList.contains('motion-paused'),
    suspended: false,
    parked: false,
    rafId: 0,
    last: 0,
    lastDraw: 0,
    disposed: false
  };
  const hero = document.getElementById('hero');

  const interval = (now) => {
    if (engine.pulseActive(now)) return FRAME_MS_HERO;
    if (flags.heroVisible) return engine.isPhone ? FRAME_MS_BELOW : FRAME_MS_HERO;
    return engine.state.wash >= 1 ? FRAME_MS_IDLE : FRAME_MS_BELOW;
  };

  const stop = () => {
    if (flags.rafId) window.cancelAnimationFrame(flags.rafId);
    flags.rafId = 0;
    flags.last = 0;
  };

  // Below the hero the scene is washed out behind 88%-opaque sections: draw nothing.
  const park = () => {
    flags.parked = true;
    stop();
    engine.setHidden(true);
  };

  const sync = () => {
    const shouldRun = !document.hidden && !flags.lightbox && !flags.paused
      && !flags.suspended && !flags.parked && !flags.disposed;
    if (shouldRun && !flags.rafId) flags.rafId = window.requestAnimationFrame(frame);
    if (!shouldRun) stop();
  };

  function frame(now) {
    flags.rafId = window.requestAnimationFrame(frame);
    if (now - flags.lastDraw < interval(now) - FRAME_TOLERANCE_MS) return;
    const dt = Math.min((now - (flags.last || now)) / 1000, MAX_FRAME_DT);
    flags.last = now;
    flags.lastDraw = now;
    engine.render(now, dt);
    if (!flags.heroVisible && engine.state.wash >= WASH_PARK) park();
  }

  const unpark = () => {
    if (!flags.parked) return;
    flags.parked = false;
    engine.setHidden(false);
  };

  const shutdown = () => {
    if (flags.disposed) return;
    flags.disposed = true;
    stop();
    disposer.run();
    engine.dispose();
  };

  const fallBack = () => {
    shutdown();
    markStatic();
  };

  bindInputs(engine, disposer, flags, { sync, fallBack, shutdown });
  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      flags.heroVisible = entries.some((entry) => entry.isIntersecting);
      if (flags.heroVisible) unpark();
      sync();
    });
    observer.observe(hero);
    disposer.add(() => observer.disconnect());
  }
  sync();
};

const bindInputs = (engine, disposer, flags, ctl) => {
  const now = () => performance.now();
  const flashAt = (strength, detail) => {
    const d = detail || {};
    engine.pulse(strength, d.x, d.y, now());
  };

  disposer.listen(document, 'visibilitychange', ctl.sync);
  disposer.listen(document, 'itera:lightbox-open', () => { flags.lightbox = true; ctl.sync(); });
  disposer.listen(document, 'itera:lightbox-close', () => { flags.lightbox = false; ctl.sync(); });
  disposer.listen(document, 'itera:motion-pause', (event) => {
    flags.paused = Boolean(event.detail && event.detail.paused);
    ctl.sync();
  });
  disposer.listen(document, 'itera:flash', (event) => flashAt(1, event.detail));
  disposer.listen(document, 'itera:click', (event) => {
    const type = event.detail && event.detail.type;
    flashAt(type === 'shutter' ? PULSE_CLICK_SHUTTER : PULSE_CLICK_PEN, event.detail);
  });
  disposer.listen(document, 'pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-scene-hit]')) return;
    if (target.closest(ignoredHitSelector)) return;
    flashAt(1, { x: event.clientX, y: event.clientY });
  });
  disposer.listen(window, 'pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    engine.setPointer(event.clientX, event.clientY);
  }, { passive: true });
  bindResize(engine, disposer);
  disposer.listen(engine.canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    ctl.fallBack();
  });
  // A mid-session switch to reduced motion ends the animated scene (WCAG 2.3.3).
  disposer.add(listenMedia(REDUCED_QUERY, (event) => {
    if (!event.matches) return;
    document.documentElement.classList.add('reduced-motion');
    ctl.fallBack();
  }));
  // bfcache: keep the scene alive and resume it; only dispose on a real unload.
  disposer.listen(window, 'pagehide', (event) => {
    if (event.persisted) {
      flags.suspended = true;
      ctl.sync();
      return;
    }
    ctl.shutdown();
  });
  disposer.listen(window, 'pageshow', (event) => {
    if (!event.persisted) return;
    flags.suspended = false;
    ctl.sync();
  });
};

const bindResize = (engine, disposer) => {
  let timer = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  const apply = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Height-only jitter (mobile URL bar) must not reallocate the buffer or re-place strips.
    if (w === lastW && Math.abs(h - lastH) < HEIGHT_JITTER_PX) return;
    lastW = w;
    lastH = h;
    engine.resize();
  };
  const onResize = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(apply, RESIZE_DEBOUNCE_MS);
  };
  disposer.listen(window, 'resize', onResize);
  disposer.add(() => window.clearTimeout(timer));
};

/* ---------- wash variable (works in live and static mode) ---------- */

const bindWash = (container, disposer) => {
  let ticking = false;
  const update = () => {
    ticking = false;
    container.style.setProperty('--scene-wash', String(computeWash(window.scrollY || 0)));
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  const onMetrics = () => {
    refreshScrollMetrics();
    update();
  };
  disposer.listen(window, 'scroll', onScroll, { passive: true });
  disposer.listen(window, 'resize', onMetrics);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(onMetrics);
    observer.observe(document.documentElement);
    disposer.add(() => observer.disconnect());
  }
  onMetrics();
};

/* ---------- init ---------- */

async function init() {
  const container = document.querySelector('[data-scene-canvas]');
  if (!container) return;
  const washDisposer = createDisposer();
  bindWash(container, washDisposer);

  if (matches(REDUCED_QUERY) || shouldSkipThree() || !webglAvailable()) {
    markStatic();
    return;
  }

  let engine = null;
  const disposer = createDisposer();
  try {
    await afterLoadAndIdle();
    const THREE = await loadThree();
    refreshScrollMetrics();
    engine = createEngine(THREE, container);
    startController(engine, disposer);
  } catch (error) {
    disposer.run();
    if (engine) engine.dispose();
    const stray = container.querySelector('.scene__canvas');
    if (stray) stray.remove();
    markStatic();
  }
}

init().catch(markStatic);
