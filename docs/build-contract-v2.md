# Itera Collectives Photobooth - BUILD CONTRACT v2 (Pass 2)

Eight engineers build in parallel and CANNOT see each other's work. This file is the single source of truth and supersedes `docs/build-contract.md` (v1) wherever they differ. Everything here is literal: names are exact and case-sensitive. If something is not defined here, do not invent a class, id, data-attribute, event, storage key or custom property that another file must understand. Private (file-internal) names are fine if they are prefixed with your module prefix (section 1).

Hard rules for everyone: no `console.*`, no `alert`, no `eval`, no `innerHTML` with dynamic data (use `textContent`/DOM APIs), `'use strict'`, immutable style (`const`, build new values, never mutate inputs or shared state), functions under 50 lines, early returns, no magic numbers (named constants at top), files under 800 lines, no secrets, no external images, no inline styles and no inline event handlers in HTML. Only allowed external hosts: `fonts.googleapis.com`, `fonts.gstatic.com`, `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`. Every placeholder in HTML gets BOTH `data-placeholder` on the element and an HTML comment `<!-- PLACEHOLDER: what to replace -->` directly above it. Never invent facts, reviews, client names, prices, or years. NEVER write the number 0956-604-1599 anywhere, and never reference `assets/photos/booking-faq.png`.

Every module must be failure-isolated: if any other module's file is missing or throws, yours must still run and the page content must stay visible and usable. Modules talk ONLY through DOM data-attributes, CSS classes on `<html>`/elements named here, and `CustomEvent`s on `document` (section 7). No `window.*` globals (no `window.Itera`).

Breakpoints (literal in `@media`, never variables): sm `40em`, md `48em`, lg `64em`. "Phone" = below `48em`. "Fine pointer" = `(hover: hover) and (pointer: fine)`.

---

## 1. File ownership (nobody edits files they do not own)

| # | Engineer | Owns (exclusive write) | CSS/JS name prefix(es) they may define |
|---|---|---|---|
| a | Content | `index.html` | n/a (markup only) |
| b | Core | `css/styles.css`, `js/main.js` | all BEM blocks not listed below |
| c | Doodle | `assets/doodles.svg`, `css/doodles.css`, `js/doodles.js` | `.doodle`, `.doodle-draw`, `.doodle--*`, `.doodle__*`, `.icon`, `.is-drawn`, `html.doodles-ready` |
| d | Animation | `css/animations.css`, `js/animations.js` | `.split-*`, `.printer*`, `.hero__*` ANIMATION STATES ONLY (see 8.3), `.is-revealed`, `.is-developed`, `.is-printed`, `.is-scrolled` blur/shrink layer, `html.anim-ready`, `html.no-anim` |
| e | SFX | `js/sfx.js`, `css/sfx.css` | `.sfx-toggle*`, `.sfx-flash` |
| f | Hover/Lightbox | `js/hover.js`, `css/hover.css` | `.photo*`, `.itera-cursor*`, `.lightbox*`, `html.has-itera-cursor`, `html.lightbox-open` |
| g | Three.js | `js/scene.js`, `css/scene.css` | `.scene*`, `html.scene-live`, `html.scene-static` |

Pre-existing files: `assets/favicon.svg`, `assets/og-image.svg`, `assets/og-placeholder.svg` are DEPRECATED and no longer referenced; do not delete. Binary assets under `assets/img/` and favicons are produced by the asset pipeline (not by any of the seven engineers); HTML references the filenames in section 6 and must not assume anything else exists.

Cross-file rule: when two CSS files could style the same element, the split is by PROPERTY OWNERSHIP, defined in 8.3 (animation vs. hover vs. core). Never use `!important` except in the `html.no-anim` / reduced-motion safety blocks defined in this document.

Remote-contract note for core: v1 hooks that remain valid and unchanged: `data-site-header`, `data-nav`, `data-nav-toggle`, `data-nav-menu`, `data-section`, `data-sticky-bar`, `data-layouts`, `data-layout-tab`, `data-layout-panel`, `data-strip-theme`, `data-strip`, `data-strip-caption`, `data-strip-caption-input`, `data-faq`, `data-inquiry-form`, `data-submit`, `data-placeholder`. State classes `is-open`, `is-active`, `is-visible`, `is-invalid`, `is-selected` remain core's. v1 `[data-reveal]` CSS in styles.css is REMOVED (animations.css owns reveal). v1 blanket `prefers-reduced-motion { * {animation:none!important; transition:none!important} }` is REMOVED; each module handles reduced motion itself (section 8).

---

## 2. Document head, CSS order, script order, bootstrap

### 2.1 Exact `<head>` (content engineer writes this verbatim; `<!-- PLACEHOLDER -->` comments kept)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Itera Collectives Photobooth | Elevated Photobooth Experience in Batangas City</title>
  <meta name="description" content="Itera Collectives is a photobooth inside BlueMoon, Alangilan, Batangas City. DSLR camera, triple light system, 18.5-inch OLED touchscreen and fast printing for birthdays, debuts, weddings, school and corporate events, and pop-ups.">
  <meta name="theme-color" content="#8B1A1F">
  <!-- PLACEHOLDER: replace with real domain -->
  <link rel="canonical" href="https://example.com/">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Itera Collectives Photobooth | Elevated Photobooth Experience in Batangas City">
  <meta property="og:description" content="Your moments, beautifully captured - over and over again. Now open inside BlueMoon, Alangilan, Batangas City.">
  <!-- PLACEHOLDER: replace with real domain -->
  <meta property="og:url" content="https://example.com/">
  <!-- PLACEHOLDER: absolute URL needs the real domain; file is derived from assets/cover.png -->
  <meta property="og:image" content="https://example.com/assets/img/og-cover.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Itera Collectives Elevated Photobooth Experience banner with maroon photo strips">
  <meta property="og:site_name" content="Itera Collectives">
  <meta property="og:locale" content="en_PH">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Itera Collectives Photobooth | Elevated Photobooth Experience in Batangas City">
  <meta name="twitter:description" content="Your moments, beautifully captured - over and over again.">
  <!-- PLACEHOLDER: absolute URL needs the real domain -->
  <meta name="twitter:image" content="https://example.com/assets/img/og-cover.jpg">

  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/favicon-192.png">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;0,6..96,700;1,6..96,500&family=Montserrat:wght@400;500;600;700&family=Pinyon+Script&display=swap">

  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/doodles.css">
  <link rel="stylesheet" href="css/animations.css">
  <link rel="stylesheet" href="css/sfx.css">
  <link rel="stylesheet" href="css/hover.css">
  <link rel="stylesheet" href="css/scene.css">

  <script>
    (function () {
      var root = document.documentElement;
      root.classList.add('js');
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add('reduced-motion'); }
      } catch (e) { /* matchMedia unavailable: treat as motion allowed */ }
      window.setTimeout(function () {
        if (!root.classList.contains('anim-ready')) { root.classList.add('no-anim'); }
      }, 3000);
    })();
  </script>

  <!-- PLACEHOLDER: url and image use the placeholder domain; replace with real domain -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://example.com/#business",
    "name": "Itera Collectives - Photobooth",
    "description": "Photobooth service inside BlueMoon, Alangilan, Batangas City, Philippines. DSLR camera, triple light system, 18.5-inch OLED touchscreen, fast printing, unlimited prints and QR digital copies for private events, weddings, debuts, school and corporate events and pop-ups.",
    "telephone": "+63 994 575 5823",
    "email": "iteraphotobooth@gmail.com",
    "url": "https://example.com/",
    "image": "https://example.com/assets/img/og-cover.jpg",
    "logo": "https://example.com/assets/img/logo-lg.webp",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Inside BlueMoon, Alangilan",
      "addressLocality": "Batangas City",
      "addressRegion": "Batangas",
      "addressCountry": "PH"
    },
    "areaServed": "Batangas City, Philippines",
    "sameAs": [
      "https://www.facebook.com/iteracollectives.ph",
      "https://www.instagram.com/iteracollectives.ph",
      "https://www.tiktok.com/@iteracollectives.ph"
    ]
  }
  </script>
</head>
```

JSON-LD must NOT contain ratings, reviews, `priceRange`, `geo`, `openingHours`, or an opening year (unknown). `<body>` begins with the skip link; `<html lang="en">`.

### 2.2 Bootstrap semantics (the `<head>` script above is verbatim, no edits)

- `html.js`: JS enabled. CSS may hide initial states ONLY under `html.js` (and only for elements carrying a data-hook from section 4).
- `html.reduced-motion`: set at parse time when `prefers-reduced-motion: reduce`. CSS must ALSO use the media query (belt and braces); JS modules read `matchMedia` themselves.
- `html.anim-ready`: set by `animations.js` synchronously at the start of its init. If it is not set 3000 ms after parse, bootstrap adds `html.no-anim`.
- `html.no-anim` (safety net, the ONE place `!important` is allowed in animations.css): forces every gated element to its final visible state: `html.no-anim [data-reveal], html.no-anim [data-stagger] > *, html.no-anim [data-split], html.no-anim [data-develop] .photo__img, html.no-anim [data-printer] .printer__strip, html.no-anim [data-hero-line], html.no-anim .doodle-draw path { opacity:1!important; transform:none!important; clip-path:none!important; filter:none!important; animation:none!important; stroke-dashoffset:0!important; }`.
- Other `<html>` state classes (each set by exactly one module): `anim-ready`(animations), `doodles-ready`(doodles; set after sprite injected), `has-itera-cursor`(hover; fine pointer only), `lightbox-open`(hover), `scene-live`(scene; first frame rendered), `scene-static`(scene; fallback in use), plus `data-sound="on|off"` attribute (sfx; see 7.3).

### 2.3 End-of-body script order (exact; content engineer writes this block last, right before `</body>`)

```html
  <script src="js/main.js" defer></script>
  <script src="js/doodles.js" defer></script>
  <script src="js/animations.js" defer></script>
  <script src="js/sfx.js" defer></script>
  <script src="js/hover.js" defer></script>
  <script type="module" src="js/scene.js"></script>
</body>
</html>
```

- `defer` and module scripts execute in document order after parsing; no module may rely on another having run. No inline scripts besides the head bootstrap and JSON-LD.
- **GSAP is NOT used** in pass 2. Do not load it. Everything is IntersectionObserver + CSS (+ `requestAnimationFrame` in hover.js/scene.js). If a future need arises it loads from `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` and `.../ScrollTrigger.min.js` (pinned), deferred before `animations.js`; not in this pass.
- `scene.js` is an ES module with NO static imports. It loads Three.js with a guarded dynamic `import()` of the pinned URL constant `THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'` (core build only, no addons, no importmap). Failure -> static fallback (section 8.6).

---

## 3. Design tokens (owned by `css/styles.css` `:root`; everyone else only CONSUMES via `var()`, with a sensible literal fallback allowed: `var(--color-maroon, #8B1A1F)`)

```css
:root {
  /* color (v1 values kept, additions marked NEW) */
  --color-maroon: #8B1A1F;
  --color-maroon-dark: #6B1217;
  --color-maroon-deep: #4A0C10;      /* NEW: scrims, curtain shadow */
  --color-cream: #FBF4F1;
  --color-blush: #E8CFCF;
  --color-blush-soft: #F4E6E3;
  --color-blush-deep: #D9B3B4;
  --color-gold: #C9A96E;             /* NEW: decorative only (sparkles, rules). NEVER text. */
  --color-ink: #2A1416;
  --color-ink-muted: #5E4446;
  --color-white: #FFFFFF;
  --color-line: rgba(139, 26, 31, 0.25);
  --color-error: #A3121A;
  --color-success: #2F6B3F;
  --color-focus: #8B1A1F;
  --color-pen: #8B1A1F;              /* NEW: red-pen doodle ink */

  /* semantic aliases */
  --bg-page: var(--color-cream);
  --bg-alt: var(--color-blush-soft);
  --bg-section: rgba(251, 244, 241, 0.88);   /* NEW: translucent section wash so the fixed canvas shows faintly */
  --bg-section-alt: rgba(244, 230, 227, 0.88); /* NEW */
  --text-body: var(--color-ink);
  --text-muted: var(--color-ink-muted);
  --text-accent: var(--color-maroon);
  --doodle-color: var(--color-pen);  /* NEW: doodles.css overrides to blush on maroon sections */

  /* fonts */
  --font-display: "Bodoni Moda", "Didot", Georgia, "Times New Roman", serif;  /* NEW: headings, wordmark-style caps */
  --font-script: "Pinyon Script", "Allura", "Snell Roundhand", cursive;        /* NEW: accent words */
  --font-sans: "Montserrat", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: var(--font-display);  /* v1 alias retained */

  /* type scale */
  --fs-xs: 0.8125rem;
  --fs-sm: 0.9375rem;
  --fs-base: 1rem;
  --fs-md: 1.125rem;
  --fs-lg: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  --fs-xl: clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem);
  --fs-2xl: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem);
  --fs-hero-script: clamp(3.5rem, 2rem + 9vw, 8rem);    /* NEW: "Elevated" */
  --fs-hero-bold: clamp(2.25rem, 1rem + 7.2vw, 6.5rem);  /* NEW: "PHOTOBOOTH" */
  --fs-hero-outline: clamp(1.5rem, 0.8rem + 4.6vw, 4.5rem); /* NEW: "EXPERIENCE" */
  --lh-tight: 1.1;
  --lh-snug: 1.3;
  --lh-body: 1.65;
  --tracking-wide: 0.18em;
  --tracking-wider: 0.3em;

  /* spacing (4px base) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.5rem; --space-6: 2rem; --space-7: 3rem; --space-8: 4.5rem; --space-9: 6rem;

  /* radii */
  --radius-sm: 4px; --radius-md: 12px; --radius-lg: 24px; --radius-pill: 999px;
  --photo-radius: var(--radius-md);  /* NEW: consumed by hover.css .photo__frame */

  /* layout */
  --container-max: 72rem;
  --gutter: 1rem;                    /* 2rem at 48em+ */
  --header-h: 4rem;
  --sticky-bar-h: 4rem;

  /* elevation */
  --shadow-sm: 0 1px 3px rgba(107, 18, 23, 0.12);
  --shadow-md: 0 8px 24px rgba(107, 18, 23, 0.14);
  --shadow-lg: 0 18px 48px rgba(74, 12, 16, 0.28);   /* NEW: photos, lightbox */

  /* motion (NEW unless noted) */
  --dur-fast: 150ms;                 /* v1 */
  --dur-base: 300ms;                 /* v1 */
  --dur-slow: 700ms;
  --dur-reveal: 800ms;               /* section/card/body fade-up */
  --dur-word: 700ms;                 /* heading word slide-up */
  --dur-char: 700ms;                 /* PHOTOBOOTH letters */
  --dur-draw: 1200ms;                /* doodle stroke draw */
  --dur-draw-long: 2000ms;           /* dividers, process line */
  --dur-script: 1400ms;              /* "Elevated" pen-write */
  --dur-develop: 1400ms;             /* gallery photo developing */
  --dur-print: 1100ms;               /* strip printer slide */
  --stagger-word: 70ms;
  --stagger-char: 45ms;
  --stagger-line: 90ms;
  --stagger-item: 110ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);       /* v1 */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-pen: cubic-bezier(0.45, 0.05, 0.25, 1);    /* hand-drawn strokes */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* pop-in */

  /* z-index scale (NEW, replaces v1 --z-*; v1 names kept) */
  --z-canvas: 0;        /* .scene fixed canvas */
  --z-doodle: 1;        /* margin doodles */
  --z-content: 2;       /* main, footer */
  --z-sticky-bar: 90;   /* mobile Book-now bar */
  --z-header: 100;      /* nav */
  --z-skip: 200;        /* skip link */
  --z-lightbox: 1000;   /* .lightbox */
  --z-cursor: 1100;     /* .itera-cursor (above lightbox so it can show there if enabled) */
  --z-toast: 1200;      /* reserved for .toast (core may use for form network errors) */
  --z-flash: 1300;      /* .sfx-flash white overlay */
}
```

Layering rules (core implements): `body { background: var(--bg-page); }`; `main, .site-footer { position: relative; z-index: var(--z-content); }`; sections (except hero and `.section--maroon`) get `background: var(--bg-section)` (alt: `var(--bg-section-alt)`) so the canvas (z 0) shows only as a faint wash; `.section--maroon` is opaque maroon; hero is transparent (canvas shows fully) with a scrim (see 4.3). Pre-approved AA pairs from v1 remain; additionally cream/white text on the hero requires the scrim in 4.3; gold is never text.

Contrast guarantee for text sections: `--bg-section` (88% cream) over the canvas at <= 100% maroon gives a worst-case background of about `#EFDFDB`; ink (14:1) and maroon (6:1) text pass AA. Therefore text-section legibility does not depend on scene.js, which is only required to dim itself (8.6).

Typography (core): `h1-h3` and `.section__title`, `.brand__wordmark`: `--font-display`, weight 600-700. Body: `--font-sans`. `.accent` (accent words): `font-family: var(--font-script); font-style: normal; font-weight: 400; color: var(--color-maroon); font-size: 1.35em; line-height: 0.9;` (on dark surfaces: `--color-blush`). Eyebrows/nav/buttons/labels: `--font-sans`, uppercase, `--tracking-wide`. Pinyon Script has one weight; never bold/italic it.

Global CSS requirements (core): v1 smooth-scroll rule (only inside `prefers-reduced-motion: no-preference`), `scroll-padding-top: calc(var(--header-h) + var(--space-4))`, focus ring `:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }` with `outline-color: var(--color-cream)` on `.btn--primary`, `.section--maroon`, `.hero--dark`, `.site-footer`, `.sticky-bar`; `.visually-hidden`, `.skip-link`, `.container` as in v1. `img { max-width: 100%; height: auto; }`.

Shared component classes core must implement (v1 list kept): `.container`, `.section`, `.section--alt`, `.section--maroon`, `.section__header`, `.section__eyebrow`, `.section__title`, `.section__lead`, `.accent`, `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--light`, `.btn--outline-light` (NEW: transparent, 2px cream border, cream text, for dark hero), `.btn--block`, `.badge-placeholder`, `[data-placeholder]` (dashed outline). All buttons: `min-height: 48px`.

---

## 4. HTML skeleton (content engineer implements; every other engineer relies on these hooks)

Order inside `<body>`: skip link -> `.scene` container -> header -> `<main id="main">` with 11 sections in order -> footer -> sticky bar -> scripts. Every `<section>` has `id`, `class` starting with `section` (hero uses `hero`), `data-section`, and `aria-labelledby="<id>-title"` pointing at its heading. No loader element exists (loader-free).

Section order and ids: `hero`, `about`, `packages`, `included`, `layouts`, `gallery`, `events`, `where`, `process`, `faq`, `inquiry`. Background rhythm: hero(dark/transparent) / about(base) / packages(alt) / included(base) / layouts(alt) / gallery(base) / events(alt) / where(base) / process(`section--maroon`) / faq(base) / inquiry(alt).

### 4.1 Data-attribute hooks (global glossary)

| Attribute | Placed on | Values | Consumed by |
|---|---|---|---|
| `data-reveal` | any block | `""`(= up) \| `up` \| `fade` \| `left` \| `right` \| `pop` | animations |
| `data-reveal-delay` | element with data-reveal | integer ms (0-1500) | animations |
| `data-stagger` | container; its DIRECT children are animated in order | `up`(default) \| `pop` | animations |
| `data-split` | heading / paragraph / span | `words` \| `chars` \| `lines` | animations |
| `data-hero-title` | the `<h1>` | boolean | animations |
| `data-hero-line` | each of 3 hero line spans | `script` \| `bold` \| `outline` | animations |
| `data-hero-fade` | hero tagline, actions, meta | boolean | animations (fade-up after title) |
| `data-printer` | `.printer` wrapper | boolean | animations |
| `data-develop` | `.photo` figure | boolean | animations |
| `data-doodle` | `.doodle` span/div | a symbol id from section 5 | doodles |
| `data-doodle-delay` | `.doodle` | integer ms | doodles |
| `data-sfx` | any clickable | `shutter` \| `pen` \| `flash` \| `none` | sfx |
| `data-zoom` | `figure.photo` | boolean | hover |
| `data-full` | `figure.photo` | `assets/img/<name>-lg.webp` | hover |
| `data-caption` | `figure.photo` | lightbox caption text | hover |
| `data-tilt` | `figure.photo` | boolean (strips/gallery) | hover |
| `data-scene-canvas` | `.scene` container | boolean | scene |
| `data-scene-avoid` | hero content wrapper | boolean | scene (keep strips off the text) |
| `data-scene-hit` | hero section | boolean | scene (empty-area click -> flash pulse) |
| `data-session-cta` | package CTA links | `two-hour` \| `three-hour` | core (prefill form select) |
| `data-sound-toggle` | mute button | boolean | sfx |

Rules: attribute values above are the ONLY accepted ones. `data-reveal` and `data-stagger` are never put on the same element, and never on an ancestor of an element that also has them (no nested reveals) except `data-stagger` container inside a `data-reveal` ancestor is NOT allowed either: pick one per subtree.

### 4.2 Header + nav + mute toggle (exact)

```html
<a class="skip-link" href="#main">Skip to main content</a>

<div class="scene" data-scene-canvas aria-hidden="true">
  <div class="scene__fallback">
    <span class="scene__strip scene__strip--1"></span>
    <span class="scene__strip scene__strip--2"></span>
    <span class="scene__strip scene__strip--3"></span>
    <span class="scene__strip scene__strip--4"></span>
    <span class="scene__strip scene__strip--5"></span>
  </div>
</div>

<header class="site-header" data-site-header>
  <div class="container site-header__inner">
    <a class="brand" href="#hero" aria-label="Itera Collectives - back to top">
      <img class="brand__logo" src="assets/img/logo.webp" width="48" height="48" alt="Itera Collectives - Photobooth logo">
    </a>
    <nav class="nav" id="site-nav" aria-label="Primary" data-nav>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu" data-nav-toggle data-sfx="pen">
        <span class="visually-hidden">Menu</span>
        <span class="nav__toggle-bar" aria-hidden="true"></span>
      </button>
      <ul class="nav__menu" id="nav-menu" data-nav-menu>
        <li class="nav__item"><a class="nav__link" href="#about" data-sfx="pen">About</a></li>
        <li class="nav__item"><a class="nav__link" href="#packages" data-sfx="pen">Packages</a></li>
        <li class="nav__item"><a class="nav__link" href="#layouts" data-sfx="pen">Layouts</a></li>
        <li class="nav__item"><a class="nav__link" href="#gallery" data-sfx="pen">Gallery</a></li>
        <li class="nav__item"><a class="nav__link" href="#events" data-sfx="pen">Events</a></li>
        <li class="nav__item"><a class="nav__link" href="#where" data-sfx="pen">Find us</a></li>
        <li class="nav__item"><a class="nav__link" href="#faq" data-sfx="pen">FAQ</a></li>
        <li class="nav__item nav__item--cta"><a class="btn btn--primary nav__cta" href="#inquiry" data-sfx="flash">Book now</a></li>
      </ul>
    </nav>
    <div class="site-header__tools">
      <button class="sfx-toggle" id="sfx-toggle" type="button" aria-pressed="true" aria-label="Sound effects" data-sound-toggle data-sfx="none">
        <svg class="icon sfx-toggle__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#speaker-on"></use></svg>
      </button>
    </div>
  </div>
</header>
```

- The mute toggle is OUTSIDE the collapsible menu so it is visible on phones. `aria-pressed="true"` means "sound effects are ON". sfx.js corrects `aria-pressed` and the `<use href>` (`#speaker-on` / `#speaker-off`) on init (e.g. reduced-motion default is OFF) and on every toggle. Accessible name stays constant ("Sound effects"); sfx.js also updates `title` ("Sound effects on" / "Sound effects off").
- Logo: `.brand__logo` is the real `logo.png` maroon square badge, `border-radius: var(--radius-sm)`, 48x48 (40x40 when `.is-scrolled`, animation engineer's shrink). Wordmark text is NOT repeated next to it. Header states (core owns colors, section 8.3): default NO-JS = solid `--color-maroon` bg, cream links. With `html.js`: transparent over the dark hero with cream links; `.site-header.is-scrolled` (class set by animations.js) = cream translucent bg, ink links, maroon CTA. Mobile open menu panel = cream background, ink links, in every state.
- `<svg><use href="#id">` icons resolve against the sprite that doodles.js injects inline at the start of `<body>` (section 5.4). `.icon` is styled by doodles.css (1.5em square, `stroke: currentColor; fill: none`).

### 4.3 Hero (exact)

```html
<section class="hero hero--dark has-doodles" id="hero" aria-labelledby="hero-title" data-section data-scene-hit>
  <div class="container hero__inner">
    <div class="hero__content" data-scene-avoid>
      <img class="hero__logo" src="assets/img/logo.webp" width="112" height="112" alt="Itera Collectives - Photobooth logo" decoding="async" fetchpriority="high">
      <p class="hero__chip" data-hero-fade>Now open &middot; inside BlueMoon, Alangilan</p>
      <h1 class="hero__title" id="hero-title" data-hero-title>
        <span class="hero__line hero__script" data-hero-line="script">Elevated</span>
        <span class="hero__line hero__bold" data-hero-line="bold" data-split="chars">PHOTOBOOTH</span>
        <span class="hero__line hero__outline" data-hero-line="outline" data-text="EXPERIENCE">EXPERIENCE</span>
      </h1>
      <p class="hero__tagline" data-hero-fade>Your moments, beautifully captured &mdash; over and over again</p>
      <div class="hero__actions" data-hero-fade>
        <a class="btn btn--light" href="#inquiry" data-sfx="flash">Book your date</a>
        <a class="btn btn--outline-light" href="#layouts">See our layouts</a>
      </div>
      <ul class="hero__meta" data-hero-fade>
        <li class="hero__meta-item">Inside BlueMoon, Alangilan, Batangas City</li>
        <li class="hero__meta-item">Opened May 1</li>
      </ul>
    </div>
    <span class="doodle doodle--tr doodle--md-up doodle-draw" data-doodle="swirl-1" data-doodle-delay="3000" aria-hidden="true"></span>
    <span class="doodle doodle--bl doodle--md-up doodle-draw" data-doodle="sparkle" data-doodle-delay="3300" aria-hidden="true"></span>
    <span class="doodle doodle--under-title doodle-draw" data-doodle="underline-1" data-doodle-delay="2800" aria-hidden="true"></span>
  </div>
  <a class="hero__scroll" href="#about" aria-label="Scroll to About" data-sfx="pen">
    <svg class="icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#chevrons"></use></svg>
  </a>
</section>
```

- The h1's accessible text must read "Elevated PHOTOBOOTH EXPERIENCE". animations.js handles split spans per 8.2 (hidden original text + `aria-hidden` generated spans); the 3 `data-hero-line` spans remain plain text in the markup (works with no JS).
- `.hero__outline` final state: filled cream. Implementation (animation engineer): `-webkit-text-stroke: 1.5px var(--color-cream); color: transparent` for the outline stage, and `::after { content: attr(data-text); position:absolute; inset:0; color: var(--color-cream); -webkit-text-stroke: 0; opacity: 0 -> 1 }` for the fill stage (opacity only). No-JS/no-anim/reduced-motion: show filled text immediately.
- Core styles: hero `min-height: 100svh`, content max-width 36rem on md+ left-aligned (strips live on the right), centered on phones. Scrim (core): `.hero__content::before` radial/linear gradient from `rgba(74,12,16,0.62)` (center) to transparent, min alpha 0.55 behind the text block, so cream text stays AA over any scene frame. Hero text colors: cream (`--color-cream`), script word `--color-blush`.
- Doodle placement modifiers used above are defined in 5.3. `.doodle--under-title` is positioned by core relative to `.hero__title` (core defines its geometry; doodles.css provides only color/pointer-events/svg fill).
- The hero has no `<img>` other than the logo badge. Do NOT embed `cover.png` in the page (it duplicates the hero lockup); it is only used as the og:image source.

### 4.4 About, packages, included

```html
<section class="section about has-doodles" id="about" aria-labelledby="about-title" data-section>
  <div class="container">
    <header class="section__header">
      <p class="section__eyebrow" data-reveal>About Itera</p>
      <h2 class="section__title" id="about-title" data-split="words">Why <span class="accent">Itera</span></h2>
      <span class="doodle doodle--under doodle-draw" data-doodle="underline-2" data-doodle-delay="600" aria-hidden="true"></span>
      <p class="section__lead" data-split="lines">...</p>
    </header>
    <div class="about__grid">
      <figure class="photo about__photo" data-zoom data-tilt data-develop data-reveal="left" data-full="assets/img/booth-bluemoon-lg.webp" data-caption="...">
        <a class="photo__frame" href="assets/img/booth-bluemoon-lg.webp" target="_blank" rel="noopener" aria-label="View larger: ...">
          <img class="photo__img" src="assets/img/booth-bluemoon.webp" width="517" height="720" loading="lazy" decoding="async" alt="...">
        </a>
        <figcaption class="photo__caption">...</figcaption>
      </figure>
      <div class="about__text"> <p data-reveal>...</p> </div>
      <ul class="about__specs" data-stagger="pop">
        <li class="spec"> <svg class="icon spec__icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#camera"></use></svg>
          <h3 class="spec__title">DSLR camera setup</h3><p class="spec__text">...</p></li>
        <!-- 4 specs: camera / sparkle / star / strip-4 icons, in the order listed in 9. -->
      </ul>
    </div>
  </div>
</section>
```

Rules reused everywhere:
- Section header pattern: `.section__header` (NOT itself `data-reveal`) containing eyebrow (`data-reveal`), `h2.section__title` (`data-split="words"`), underline doodle, lead (`data-split="lines"`, at most 4 such leads on the page: about, packages, layouts, where). All other lead paragraphs use `data-reveal`.
- The underline doodle is a SIBLING after the h2 inside `.section__header` (never inside the h2). Core positions `.section__header { position: relative }` and gives `.doodle--under` inside `.section__header` the geometry (width ~ 40% of title, centered under the h2, `top: 100%`). Section title `text-align:center`.
- Photo figure pattern (`.photo`) is exactly section 4.12. Every `<figure>` image uses it.
- Packages: `section.section.section--alt.packages`; `.packages__grid` with exactly TWO `article.tier[data-reveal]` ids `tier-two-hour`, `tier-three-hour`, each with `data-placeholder` + comment, `h3.tier__name`, `p.tier__price` text `&#8369; &mdash; TBA` with a `.badge-placeholder` text "Placeholder - price TBA", `ul.tier__features`, and CTA `a.btn.btn--primary.btn--block.tier__cta[href="#inquiry"][data-session-cta="two-hour|three-hour"][data-sfx="flash"]`. Then `.packages__addons` (`h3.packages__addons-title`, `ul.addons[data-stagger="pop"]` with `li.addon`: magnetic strips, one-hour extension, each with price `&#8369; &mdash; TBA`, `data-placeholder`). Then aside `figure.photo.packages__photo` with `book-us-booth`. A `.packages__note[data-placeholder]` line.
- Included: `section.section.included`; header; `ul.included__list[data-stagger="pop"]` containing six `li.included__item` (`svg.icon.included__icon` + `span.included__label`), plus `figure.photo.included__photo` (`curated-inclusions`).

### 4.5 Layouts (preview UI keeps v1 hooks; frame counts change)

```html
<section class="section section--alt layouts has-doodles" id="layouts" aria-labelledby="layouts-title" data-section>
  <div class="container">
    <header class="section__header"> ... </header>
    <div class="layouts__ui" data-layouts>
      <div class="layouts__tabs" role="tablist" aria-label="Photo strip layout">
        <button class="layouts__tab is-selected" type="button" role="tab" id="tab-2-frame" aria-selected="true" aria-controls="panel-2-frame" data-layout-tab="2-frame" data-sfx="pen">2-frame</button>
        <button class="layouts__tab" type="button" role="tab" id="tab-4-frame" aria-selected="false" aria-controls="panel-4-frame" tabindex="-1" data-layout-tab="4-frame" data-sfx="pen">4-frame</button>
      </div>
      <div class="layouts__stage">
        <div class="layouts__panel" role="tabpanel" id="panel-2-frame" aria-labelledby="tab-2-frame" data-layout-panel="2-frame">
          <div class="printer" data-printer>
            <span class="printer__slot" aria-hidden="true"></span>
            <div class="printer__strip">
              <div class="strip strip--2-frame" data-strip data-theme="maroon">
                <div class="strip__frames">
                  <div class="strip__frame"><span class="strip__frame-num" aria-hidden="true">1</span></div>
                  <div class="strip__frame"><span class="strip__frame-num" aria-hidden="true">2</span></div>
                </div>
                <p class="strip__caption" data-strip-caption>Your moments</p>
              </div>
            </div>
          </div>
          <p class="layouts__desc">...</p>
        </div>
        <div class="layouts__panel" ... id="panel-4-frame" data-layout-panel="4-frame" hidden> <!-- same, 4 .strip__frame, .strip--4-frame --> </div>
      </div>
      <div class="layouts__controls"> <!-- v1 fieldset of 3 swatch buttons (data-strip-theme, data-sfx="pen") + caption input (data-strip-caption-input) --> </div>
    </div>
    <p class="layouts__note" data-placeholder>...</p>
  </div>
</section>
```

`.strip--2-frame` has exactly 2 `.strip__frame`; `.strip--4-frame` has exactly 4. Both are vertical photo strips (cream/blush/maroon themes via `data-theme`). Core styles the strips and `.printer` geometry basics (`.printer` = `position:relative; overflow:hidden; padding-bottom` so a strip is clipped by the slot); animations.css only supplies the slide-out transform (8.3). `.printer__slot` is a dark rounded bar across the top (core styles). A panel switched from `hidden` triggers its printer when it first becomes visible (IntersectionObserver naturally handles this).

### 4.6 Gallery

`ul.gallery__grid` (3 columns md+, 1 phone... core), three `li.gallery__item` each containing a `figure.photo` (4.12) with `data-zoom data-tilt data-develop data-reveal="up"` for the three real outputs (`output-strips-black`, `output-bw-grid`, `output-strips-duo`). Add `data-reveal-delay` 0/150/300. No placeholder tiles remain.

### 4.7 Events

`ul.events__list[data-stagger="pop"]` with eight `li.event-card` (each: `svg.icon.event-card__icon`, `h3.event-card__title`, `p.event-card__text`), plus `figure.photo.events__photo[data-reveal="right"]` with `events-popups`. Event names exactly as in section 9.7.

### 4.8 Where to find us

```html
<section class="section where has-doodles" id="where" aria-labelledby="where-title" data-section>
  <div class="container">
    <header class="section__header"> ... </header>
    <div class="where__grid">
      <div class="where__info" data-reveal>
        <address class="where__address"> ... </address>
        <p class="where__lead"> ... </p>
        <a class="btn btn--primary" href="https://m.me/iteracollectives.ph" target="_blank" rel="noopener noreferrer" data-sfx="shutter">Message us on Messenger</a>
      </div>
      <figure class="photo where__photo where__photo--booth" ...> booth-bluemoon </figure>
      <figure class="photo where__photo where__photo--opening" ...> is-opening-bluemoon </figure>
    </div>
    <div class="where__popup">
      <h3 class="where__popup-title">Where we've popped up</h3>
      <figure class="photo where__photo where__photo--flea" ...> flea-market-lf43 </figure>
      <p class="where__popup-text"> ... </p>
    </div>
  </div>
</section>
```

The flea market is PAST: never use future tense, never label it "upcoming", no "join us".

### 4.9 Process (maroon section)

```html
<section class="section section--maroon process has-doodles" id="process" aria-labelledby="process-title" data-section>
  <div class="container">
    <header class="section__header"> ... </header>
    <ol class="process__steps" data-stagger="up">
      <li class="step"><span class="step__num" aria-hidden="true">01</span><h3 class="step__title">...</h3><p class="step__text">...</p></li>
      <!-- 4 steps -->
    </ol>
    <span class="doodle process__line process__line--h doodle-draw doodle--md-up" data-doodle="process-line-h" aria-hidden="true"></span>
    <span class="doodle process__line process__line--v doodle-draw" data-doodle="process-line-v" aria-hidden="true"></span>
  </div>
</section>
```

Both `.process__line` spans are placed AFTER the `<ol>` and positioned absolutely by core inside `.container { position: relative }` behind the steps (z-index below `.step`); `--h` visible >= 48em, `--v` visible below 48em (core sets `display`; `.doodle--md-up` on `--h` is redundant but harmless). Line draws once when the `<ol>` area is 35% visible (doodles.js treats `.process__line` like any `.doodle-draw`, delay by data attribute, default `data-doodle-delay` 0).

### 4.10 FAQ

`div.faq__list[data-faq]` containing four `details.faq__item` (`summary.faq__question` with `data-sfx="pen"`, `div.faq__answer > p`). No placeholder tags (content is real). The FAQ poster image is NOT used. Core adds "one open at a time" JS (v1 4.5).

### 4.11 Inquiry, footer, sticky bar

```html
<section class="section section--alt inquiry has-doodles" id="inquiry" aria-labelledby="inquiry-title" data-section>
  <div class="container">
    <header class="section__header"> ... </header>
    <div class="inquiry__grid">
      <div class="inquiry__form-wrap" data-reveal="left">
        <!-- PLACEHOLDER: replace PLACEHOLDER_FORM_ID with a real Formspree (or compatible) form id -->
        <form class="form" id="inquiry-form" action="https://formspree.io/f/PLACEHOLDER_FORM_ID" method="POST" novalidate data-inquiry-form data-placeholder>
          <div class="form__field" data-field="name"> label[for=field-name] + input#field-name[name=name][required] + p.form__error#error-name[hidden] </div>
          <div class="form__field" data-field="email"> #field-email name=email type=email required </div>
          <div class="form__field" data-field="phone"> #field-phone name=phone type=tel optional </div>
          <div class="form__field" data-field="event-type"> select#field-event-type name=event_type required (options in 9.11) </div>
          <div class="form__field" data-field="event-date"> input#field-event-date name=event_date type=date optional </div>
          <div class="form__field" data-field="venue"> input#field-venue name=venue type=text required </div>
          <div class="form__field" data-field="session"> select#field-session name=session optional: "" Not sure yet / two-hour / three-hour </div>
          <fieldset class="form__field form__field--addons" data-field="addons"> checkboxes name=addons value=magnetic-strips | extension-hour </fieldset>
          <div class="form__field" data-field="message"> textarea#field-message name=message rows=5 maxlength=1000 optional </div>
          <div class="form__field form__field--trap" aria-hidden="true"> input#field-website name=_gotcha tabindex=-1 </div>
          <button class="btn btn--primary btn--block form__submit" id="form-submit" type="submit" data-submit data-sfx="flash">Send inquiry</button>
          <p class="form__status" id="form-status" role="status" aria-live="polite" data-state="idle" hidden></p>
          <p class="form__fallback">Prefer chat?
            <a class="form__fallback-link" id="form-messenger" href="https://m.me/iteracollectives.ph" target="_blank" rel="noopener noreferrer">Message us on Messenger</a> or
            <a class="form__fallback-link" id="form-fb-fallback" href="https://www.facebook.com/iteracollectives.ph" target="_blank" rel="noopener noreferrer">Facebook</a>.</p>
        </form>
      </div>
      <aside class="inquiry__contact" aria-label="Contact details" data-reveal="right"> ... contact + socials (9.11) ... </aside>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand">
      <img class="site-footer__logo" src="assets/img/logo.webp" width="96" height="96" loading="lazy" decoding="async" alt="Itera Collectives - Photobooth logo">
      <p class="site-footer__tagline">Your moments, beautifully captured &mdash; over and over again</p>
    </div>
    <nav class="site-footer__nav" aria-label="Footer"><ul class="site-footer__list"> About, Packages, Layouts, Gallery, Events, Find us, FAQ, Book now </ul></nav>
    <ul class="site-footer__contact"> Instagram, TikTok, phone, email, Messenger (exact links in 9.12) </ul>
    <p class="site-footer__legal">&copy; Itera Collectives. Inside BlueMoon, Alangilan, Batangas City, Philippines.</p>
  </div>
</footer>

<div class="sticky-bar" id="sticky-bar" data-sticky-bar>
  <a class="btn btn--light sticky-bar__book" href="#inquiry" data-sfx="flash">Book now</a>
  <a class="sticky-bar__call" href="tel:+639945755823" aria-label="Call Itera Collectives">Call</a>
</div>
```

Form mechanics (core): required = name, email, event_type, venue. Optional = phone, event_date (if given must be today or later, v1 `localDateString` kept), session, addons, message (max 1000). Add `venue` validator (2-120 chars). Remove v1 `package`/`field-package` and the `message` required rule. On submit: validate, `fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}})`. If `form.action` contains `PLACEHOLDER` -> do NOT fetch; show `data-state="error"` status: "The inquiry form is not connected yet. Please message us on Messenger or call 0994 575 5823." (honest, never fake success). Success -> `data-state="success"`, reset the form, move focus to status. Network/HTTP failure -> error state with same fallback text. `form-messenger` link remains visible always. Sticky bar rules unchanged from v1 4.3. Package CTA prefill: click on `[data-session-cta]` sets `#field-session` value to the attribute value (do not prevent default; anchor scroll still happens).

### 4.12 Photo figure pattern (exact; hover.js hooks on it; used for EVERY content image except logo badges)

```html
<figure class="photo gallery__photo" data-zoom data-tilt data-develop data-reveal="up"
        data-full="assets/img/output-bw-grid-lg.webp"
        data-caption="Four-frame black and white photo strip layout with the Itera logo">
  <a class="photo__frame" href="assets/img/output-bw-grid-lg.webp" target="_blank" rel="noopener"
     aria-label="View larger: Four-frame black and white photo strip layout" data-sfx="shutter">
    <img class="photo__img" src="assets/img/output-bw-grid.webp" width="800" height="1000"
         loading="lazy" decoding="async"
         alt="Four-frame black and white photo strip layout with the Itera logo on maroon corduroy">
  </a>
  <figcaption class="photo__caption">Four-frame, black and white</figcaption>
</figure>
```

- Exactly one `.photo__frame` (an `<a>`, so no-JS users open the large file) and one `.photo__img` inside each `[data-zoom]`. `href` equals `data-full`. `<figcaption>` is optional; when absent `data-caption` still supplies the lightbox caption.
- `data-tilt` only on strip/output/gallery images (tilt max 5deg). Omit on posters (flea market, is-opening, events-popups, curated-inclusions, book-us-booth) and the real booth photo.
- Ownership of selectors: hover.css owns `.photo`, `.photo__frame`, `.photo__img` BASE rules (display, overflow clip with `border-radius: var(--photo-radius)`, transforms, cursor). Core styles only the layout wrappers/modifier classes (`.gallery__photo`, `.about__photo`, widths/aspect, margins, box-shadow `var(--shadow-md)`, caption typography on `.photo__caption`) and must never set `transform`, `transition`, `overflow`, `cursor`, `filter` or `opacity` on `.photo*`.
- `data-develop` implies the image starts "undeveloped" (8.3). `data-reveal` on the figure reveals the figure (transform on `<figure>`); tilt transform lives on `.photo__frame`; zoom transform on `.photo__img`; develop filter on `.photo__img`. Three different elements, no property collisions.
- `loading="lazy"` on every `<img>` except the hero logo (and the header logo, which is eager). `width`/`height` must be the real intrinsic pixel size of the non-`-lg` file (section 6).

### 4.13 Hover-created DOM (JS builds these; class names fixed)

Custom cursor (hover.js appends to `<body>` once, only on fine pointers):
```html
<div class="itera-cursor" aria-hidden="true">
  <span class="itera-cursor__ring"></span>
  <span class="itera-cursor__label">view</span>
</div>
```
States: `.itera-cursor.is-visible` (pointer over a `.photo__frame`), `.itera-cursor.is-down` (pressed). Position via `transform: translate3d(x, y, 0)` set by JS (CSS custom props `--cx`, `--cy` on the element). Ring is a ~44px red-pen hand-drawn circle (SVG-ish border-radius blob or inline SVG built by hover.js) in `--color-pen`; label "view" in `--font-script`, cream pill background maroon text, 0.8rem. `html.has-itera-cursor .photo__frame { cursor: none; }` only.

Lightbox (hover.js builds on first open, appends to `<body>`, reuses afterwards):
```html
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
  <div class="lightbox__backdrop" data-lightbox-close></div>
  <figure class="lightbox__figure">
    <img class="lightbox__img" alt="" draggable="false">
    <figcaption class="lightbox__caption"></figcaption>
  </figure>
  <button class="lightbox__btn lightbox__close" type="button" aria-label="Close image viewer" data-sfx="pen"><svg class="icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#close"></use></svg></button>
  <button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image" data-sfx="pen"><svg class="icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#chevron-left"></use></svg></button>
  <button class="lightbox__btn lightbox__next" type="button" aria-label="Next image" data-sfx="pen"><svg class="icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#chevron-right"></use></svg></button>
  <p class="lightbox__count" aria-live="polite"></p>
</div>
```
State classes on `.lightbox`: `is-open`, `is-loading`, `is-zoomed`. While open: `html.lightbox-open { overflow: hidden }`, `inert` set on `[data-site-header]`, `main`, `.site-footer`, `.sticky-bar`, `.scene` (removed on close). Behavior in 8.5.

### 4.14 Sound toggle hook summary

Exactly one `[data-sound-toggle]` button (4.2). No other element may carry it.

---

## 5. Doodle sprite (`assets/doodles.svg`), owned by the doodle engineer

### 5.1 File format

`assets/doodles.svg` is a sprite: `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">` containing `<symbol id="..." viewBox="...">` children. Every symbol:
- contains one `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="N">` wrapping its paths (N from the table);
- every drawable `<path>` has `pathLength="1"` (so CSS dash animation is resolution independent); a symbol may contain several paths, each `pathLength="1"`. Use `<path>` only (convert circles/lines to paths) so `pathLength` works everywhere;
- hand-drawn look: slightly irregular bezier curves, no perfect geometry, loops at stroke ends; all strokes open (no filled shapes) so the draw-in effect reads as a pen.
- NO `<style>`, no hardcoded colors, no `<text>`.

### 5.2 Symbol list (ids are exact; viewBox, stroke width in viewBox units, intended use)

| id | viewBox | stroke-w | Intended use / description |
|---|---|---|---|
| `underline-1` | `0 0 200 20` | 3 | Single wobbly pen underline with a tiny flick at the right end (section title underline, hero) |
| `underline-2` | `0 0 200 24` | 3 | Double stroke underline (two overlapping swoops) |
| `underline-3` | `0 0 200 30` | 3 | Looping cursive underline (ends in a small loop), for accent words |
| `swirl-1` | `0 0 120 120` | 3 | Spiral swirl, margin ornament |
| `swirl-2` | `0 0 160 80` | 3 | S-shaped swirl with two curls |
| `circle-1` | `0 0 160 80` | 3 | Hand-drawn ellipse that overlaps its own start (circle around a word) |
| `circle-2` | `0 0 160 80` | 3 | Double-pass scribbled ellipse |
| `arrow-1` | `0 0 120 80` | 3 | Curved scribbled arrow pointing right-down |
| `arrow-2` | `0 0 120 80` | 3 | Curved arrow pointing left-down (mirror feel, not a flipped copy) |
| `arrow-3` | `0 0 80 120` | 3 | Looped arrow pointing down |
| `star` | `0 0 64 64` | 3 | Five-point star drawn in one continuous stroke |
| `sparkle` | `0 0 64 64` | 3 | Four-point sparkle plus two tiny ticks |
| `heart` | `0 0 64 64` | 3 | Single-stroke heart |
| `camera` | `0 0 96 80` | 3 | Camera sketch (body, lens, flash bump) |
| `strip-2` | `0 0 48 96` | 2.5 | Photo strip with 2 frames, sketch |
| `strip-4` | `0 0 48 144` | 2.5 | Photo strip with 4 frames, sketch |
| `flourish-1` | `0 0 240 60` | 3 | Logo-style flourish loop, left-to-right, ends in a curl |
| `flourish-2` | `0 0 240 60` | 3 | Mirrored-feel flourish with two loops (use at section header sides) |
| `wave-divider-1` | `0 0 1200 40` | 3 | Full-width wavy ink line (slow sine), `preserveAspectRatio="none"` applied by JS on the inline SVG |
| `wave-divider-2` | `0 0 1200 40` | 3 | Wavy line with small loops every ~200 units |
| `process-line-h` | `0 0 1000 60` | 3 | Horizontal hand-drawn line with 3 small hump/loops at 1/6, 1/2, 5/6 positions (connects 4 steps) |
| `process-line-v` | `0 0 60 1000` | 3 | Vertical version for phones |
| `speaker-on` | `0 0 48 48` | 3 | Doodle speaker with 2 sound-wave arcs |
| `speaker-off` | `0 0 48 48` | 3 | Doodle speaker with a scribbled X |
| `close` | `0 0 48 48` | 3 | Hand-drawn X (two crossing strokes) |
| `chevrons` | `0 0 48 48` | 3 | Double chevron pointing down (scroll hint) |
| `chevron-left` | `0 0 48 48` | 3 | Single chevron left (lightbox prev) |
| `chevron-right` | `0 0 48 48` | 3 | Single chevron right (lightbox next) |

That is 28 symbols (at least 18 required). Engineers must not reference a symbol id that is not in this table. Icons (`speaker-*`, `close`, `chevron*`, `camera`, `sparkle`, `star`, `strip-4`, `strip-2`, `heart`) are used via `<svg class="icon"><use href="#id">` (static, not animated). Decorative doodles (the rest) are used via `.doodle[data-doodle]` (animated).

### 5.3 Usage contract (HTML <-> doodles.css <-> doodles.js)

Decorative doodle markup (always empty, always `aria-hidden="true"`):
```html
<span class="doodle doodle--tr doodle--md doodle-draw" data-doodle="swirl-1" data-doodle-delay="400" aria-hidden="true"></span>
```
- `class="doodle"`: base. doodles.js fills the element with an inline `<svg class="doodle__svg" viewBox="<symbol viewBox>" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` whose children are a DEEP CLONE of the symbol's children (so CSS can animate the real `<path>` elements; the `<use>` shadow tree cannot be animated). Dividers and process lines use `preserveAspectRatio="none"`.
- `doodle-draw`: opt in to the draw-in animation. doodles.css (only under `html.js`): `.doodle-draw path { stroke-dasharray: 1; stroke-dashoffset: 1; }` and `.doodle-draw.is-drawn path { animation: doodle-draw var(--dur-draw) var(--ease-pen) var(--doodle-delay, 0ms) forwards; }` with `@keyframes doodle-draw { to { stroke-dashoffset: 0; } }`. A doodle WITHOUT `.doodle-draw` is shown fully drawn. Dividers and `.process__line` use `animation-duration: var(--dur-draw-long)`.
- `is-drawn`: added by doodles.js ONCE per element when it is >= 35% visible (IntersectionObserver, rootMargin `0px 0px -10% 0px`), then unobserved. Delay: doodles.js reads `data-doodle-delay` (ms) and sets `style.setProperty('--doodle-delay', n + 'ms')` (CSSOM, not an inline attribute in HTML). If IntersectionObserver is unavailable or reduced motion: add `is-drawn` immediately (reduced motion: CSS shows paths fully drawn, no animation).
- Placement modifiers (doodles.css; all `position:absolute; pointer-events:none; z-index: var(--z-doodle); display:block;` relative to the nearest `.has-doodles` ancestor, which core makes `position: relative`):
  `doodle--tl` `doodle--tr` `doodle--bl` `doodle--br` (corner of the `.has-doodles` box, offset into the page margin: `top/left/right/bottom: clamp(0.25rem, 2vw, 2rem)`), `doodle--ml` `doodle--mr` (vertically centered, hugging the left/right edge), `doodle--under` (centered below a heading, geometry owned by core inside `.section__header`; doodles.css only supplies color), `doodle--inline` (inline-block, sits in text flow beside an accent word; `width: 1.5em; vertical-align: -0.2em`), `doodle--around` (absolute, `inset: -0.25em -0.4em`, wraps a word inside a `position:relative` `.accent` span; used with `circle-1/2`), `doodle--divider` (block, `position:static`, full width, `height: 32px`, `margin-block: 0`, used for `wave-divider-*`; DOM position between sections or at a section's top edge).
  Size modifiers: `doodle--sm` (width 2.5rem), `doodle--md` (4.5rem), `doodle--lg` (7rem); phones use 70% of those values. Default (no size modifier) = `md`. `height:auto`. Do not combine a size modifier with `--divider/--under/--around/--inline/process-line`.
  Visibility modifiers: `doodle--md-up` (display none below 48em), `doodle--phone-only` (display none at 48em+). Content engineer marks AT LEAST half of all margin doodles `doodle--md-up` so phones show fewer. Max 2 doodles visible per section on phones.
- Colors: `.doodle, .icon { color: var(--doodle-color); }`; `.section--maroon .doodle, .hero--dark .doodle, .site-footer .doodle { color: var(--color-blush); }`. Maroon on maroon is forbidden.
- NEVER cover text: doodles are placed only in corners/margins or directly under headings (`--under`), around a single accent word (`--around`, stroke only, text remains readable and clickable since `pointer-events: none`), or between sections (`--divider`). Content engineer places them in `.header`/corner positions where the container has empty gutter; they must not sit over paragraphs, form fields, buttons or photos.
- Doodle count budget (content engineer): about 24 doodles total on desktop, >= 12 hidden on phones. Suggested placement in 9.

### 5.4 doodles.js responsibilities (module prefix `doodle`)

1. Obtain sprite markup: `fetch('assets/doodles.svg')` -> text. If fetch fails (e.g. `file://` or offline) use the EMBEDDED copy `SPRITE_FALLBACK` (a string constant in doodles.js that must be kept byte-identical in meaning to `assets/doodles.svg`; the engineer writes both).
2. Parse with `DOMParser('image/svg+xml')`, import the root, set `id="itera-sprite"`, `hidden`, `aria-hidden="true"`, `style` none (use the `hidden` attribute and `width=0 height=0 position absolute` via a CSS class `.doodle-sprite` in doodles.css), and insert it as the FIRST child of `<body>`. Then add `html.doodles-ready`.
3. Fill every `.doodle[data-doodle]` as in 5.3. Unknown ids: leave empty (no throw).
4. Observe `.doodle-draw` elements (5.3).
5. Resilience: runs on `DOMContentLoaded`-safe (script is deferred). No dependency on other modules.

Icons: after the sprite is inserted, `<use href="#id">` in the HTML resolves in-document. If the sprite never loads, icons are blank; the mute toggle and lightbox buttons still work because they have `aria-label`s and CSS borders (sfx.css/hover.css style them with a visible border so a blank icon is not a blank hole).

---

## 6. Images

`docs/asset-manifest.md` did not exist when this contract was written. Contract: the asset pipeline produces, for every original, `assets/img/<name>.webp` (display) and `assets/img/<name>-lg.webp` (lightbox), plus a `.jpg` fallback of each (`assets/img/<name>.jpg`) that HTML does NOT reference (HTML uses WebP only; every supported browser handles it). If `asset-manifest.md` appears later and differs, the manifest wins ONLY for width/height numbers; names and placement here still win.

| name (original) | display file / size (w x h) | lightbox file / size | alt text (use verbatim) | Used in |
|---|---|---|---|---|
| `logo` (assets/logo.png) | `assets/img/logo.webp` 256 x 256 (HTML width/height attrs: 48/112/96 as set per placement; always square) | `assets/img/logo-lg.webp` 512 x 512 (JSON-LD only) | `Itera Collectives - Photobooth logo` | header, hero, footer |
| `output-strips-black` | `assets/img/output-strips-black.webp` 800 x 1000 | `-lg.webp` 1600 x 2000 | `Two black four-frame photo strips against a red curtain backdrop on maroon corduroy` | gallery #1 |
| `output-bw-grid` | `assets/img/output-bw-grid.webp` 800 x 1000 | `-lg.webp` 1600 x 2000 | `Four-frame black and white photo grid with the Itera logo on maroon corduroy` | gallery #2 |
| `output-strips-duo` | `assets/img/output-strips-duo.webp` 800 x 1000 | `-lg.webp` 1600 x 2000 | `One black and white photo strip and one color photo strip on maroon corduroy` | gallery #3 |
| `booth-bluemoon` | `assets/img/booth-bluemoon.webp` 517 x 720 | `-lg.webp` 517 x 720 (same pixels; separate file) | `The Itera photobooth with a plum curtain and an easel sign reading Your elevated photobooth experience is now open, inside BlueMoon Alangilan` | about, where |
| `book-us-booth` | `assets/img/book-us-booth.webp` 800 x 1000 | `-lg.webp` 1600 x 2000 | `Illustration of the Itera photobooth with the lettering Your chance - book us` | packages |
| `events-popups` | `assets/img/events-popups.webp` 512 x 640 | `-lg.webp` 512 x 640 | `Maroon poster with a camera reading Events, pop-ups, book us now` | events |
| `flea-market-lf43` | `assets/img/flea-market-lf43.webp` 800 x 1000 | `-lg.webp` 1600 x 2000 | `Watercolor poster of the Itera booth at the L&F43 Flea Market, BlueMoon Alangilan, Aug 1 to 2, 1 to 11 PM` | where (popup) |
| `curated-inclusions` | `assets/img/curated-inclusions.webp` 512 x 640 | `-lg.webp` 512 x 640 | `Line-art poster listing the Itera photobooth specs, packages and inclusions` | included |
| `is-opening-bluemoon` | `assets/img/is-opening-bluemoon.webp` 512 x 640 | `-lg.webp` 512 x 640 | `Line-art poster announcing the Itera elevated photobooth experience opening on May 1, inside BlueMoon Alangilan` | where |
| `cover` (assets/cover.png) | `assets/img/og-cover.jpg` 1200 x 630 | none | (og:image only; never embedded in the page) | `<head>` |
| favicons from logo | `assets/favicon-32.png` 32 x 32, `assets/favicon-192.png` 192 x 192, `assets/apple-touch-icon.png` 180 x 180 | none | n/a | `<head>` |
| `booking-faq` | NEVER USED (wrong phone number) | | | nowhere |

Alt-text style: describes what is visible in one sentence, 60-140 characters, no "image of / picture of", no keyword stuffing, plain ASCII punctuation (no em dashes). Decorative doodles/strips/icons are `aria-hidden` with no alt. The `width`/`height` HTML attributes are always the display file's intrinsic size, and CSS sets `height: auto`.

Three.js textures (scene.js loads these exact same-origin files with `THREE.TextureLoader`; failure of any texture falls back to a plain colored strip): `assets/img/output-strips-black.webp`, `assets/img/output-bw-grid.webp`, `assets/img/output-strips-duo.webp`.

---

## 7. JS module boundaries, events, storage

### 7.1 Responsibilities (a module never does another module's job)

| File | Does | Does NOT |
|---|---|---|
| `main.js` | mobile nav toggle/close, active-section nav highlight, sticky Book-now bar, layout tabs/theme/caption preview, FAQ one-open, form validation + submit + Messenger fallback + session prefill | reveal, scroll header class, sound, zoom, doodles |
| `doodles.js` | inject sprite, fill `.doodle`, draw triggers | text splitting, reveals |
| `animations.js` | `html.anim-ready`, header `is-scrolled`, hero sequence, `data-split`, `data-reveal`, `data-stagger`, `data-printer`, `data-develop` triggers, reduced-motion final states | doodle drawing, hover |
| `sfx.js` | Web Audio SFX, mute toggle, white flash overlay, dispatching `itera:click`/`itera:flash` | any visuals other than the overlay |
| `hover.js` | image hover zoom/tilt, custom cursor, lightbox | sound (it only declares `data-sfx` on its buttons and may dispatch `itera:sfx`) |
| `scene.js` | Three.js scene, fallback switch | page layout |

### 7.2 CustomEvents (all dispatched on and listened for on `document`; `bubbles: false`; payload in `detail`; unknown listeners are harmless)

| Event | Dispatched by | `detail` | Listened by | Meaning |
|---|---|---|---|---|
| `itera:click` | sfx | `{ type: 'shutter' \| 'pen', x: number, y: number }` (viewport px of the click) | scene (small pulse) | A sound-eligible click happened (fired regardless of mute) |
| `itera:flash` | sfx | `{ x: number, y: number }` | scene (big pulse) | A `data-sfx="flash"` click happened (fired regardless of mute). sfx also shows the white overlay |
| `itera:sfx` | any module | `{ type: 'shutter' \| 'pen' \| 'flash' }` | sfx | Request a sound with no click (e.g. hover.js lightbox swipe). Respects mute. Does NOT trigger scene pulses |
| `itera:mute-change` | sfx | `{ muted: boolean, source: 'user' \| 'init' }` | anyone (none required) | Sound state changed |
| `itera:lightbox-open` | hover | `{ src: string, index: number, count: number }` | scene (pause rendering) | Lightbox opened |
| `itera:lightbox-close` | hover | `{}` | scene (resume) | Lightbox closed |

For one click, sfx dispatches EXACTLY ONE of `itera:click` or `itera:flash` (flash type -> `itera:flash` only). scene.js ALSO listens to `pointerdown` on elements inside `[data-scene-hit]` that are not inside `a, button, input, select, textarea, label, summary, [data-sfx]`, producing a big pulse with no sound.

No other cross-module events exist. main.js dispatches none.

### 7.3 Shared state without globals

- Sound state is published on `<html>` as the attribute `data-sound="on"` or `data-sound="off"` by sfx.js (anyone may read it; only sfx writes).
- Reduced motion: every module reads `window.matchMedia('(prefers-reduced-motion: reduce)')` itself (copy a 3-line helper; do not share it).
- Pointer type: hover.js and scene.js read `(hover: hover) and (pointer: fine)` and `(max-width: 47.99em)` themselves.

### 7.4 localStorage keys (all reads/writes wrapped in try/catch; failure = behave as if unset, never throw, never block)

| Key | Owner | Values |
|---|---|---|
| `itera.sfx.muted` | sfx | `"1"` (muted) / `"0"` (sound on). Absent = default (on, unless reduced motion -> off) |

No other module writes storage. No cookies. No sessionStorage.

### 7.5 Global namespace policy

No `window.*` assignments by any module. Each file is an IIFE (scene.js: a module scope, top-level `async function init()`), `'use strict'`. Exports none.

---

## 8. Motion, progressive enhancement, per-module behavior

### 8.1 Global progressive-enhancement rules

1. Every hidden/initial animation state is written as `html.js .selector { ... }` AND is cancelled by `html.no-anim`, `html.reduced-motion`, and `@media (prefers-reduced-motion: reduce)`. With JS off, nothing is hidden.
2. Animate only `transform` and `opacity`, with these explicit exceptions, each on the element named: `stroke-dashoffset` (doodle paths); `clip-path` (hero "Elevated" pen-write and `.printer` mask only); `filter` (gallery develop on `.photo__img` only); `backdrop-filter` + `opacity` (header blur layer); `-webkit-text-stroke` is static, never animated. Never animate width/height/top/left/margin.
3. Play once: IntersectionObserver unobserves after the first trigger; no reverse on scroll-up. Exceptions (continuous): scene.js, hover tilt/zoom.
4. Use `will-change: transform` only during an active animation and remove it after (class toggle), never globally.
5. IntersectionObserver unsupported -> final state immediately.
6. Fonts: animations.js waits for `document.fonts.ready` (max 1200 ms) before splitting text and starting the hero sequence, so metrics are final.

### 8.2 Text splitting (animations.js)

- `data-split="words"|"chars"|"lines"`: JS replaces the element's text with generated spans while keeping nested inline elements (e.g. `.accent`) intact (clone their wrapper, split their text). Elements/children with `data-doodle` or `.doodle` or `<svg>` are NOT split and are kept in place.
- Generated classes: `.split-word` (inline-block, `overflow: hidden`, vertical-align bottom, padding-bottom 0.12em, padding-top 0.05em for script ascenders) wrapping `.split-word__inner` (the transform target); `.split-char` (inline-block); `.split-line` (block, overflow hidden) wrapping `.split-line__inner`. Each generated unit gets the CSS custom property `--i` (0-based index; set via `style.setProperty`). Final state class `.is-revealed` on the original element.
- Accessibility: prepend `<span class="visually-hidden">ORIGINAL TEXT</span>` and set `aria-hidden="true"` on every generated span. For `chars` on `.hero__bold` the visually-hidden copy is the full word.
- `lines` split measures rendered lines once after fonts are ready; after the reveal completes (`animationend` of the last line, or a safety timeout of `--dur-reveal + lines*--stagger-line + 200ms`) the original DOM is RESTORED (unsplit) to avoid breakage on resize. Not applied under reduced motion.
- Timings: words `--dur-word`, delay `calc(var(--i) * var(--stagger-word))`, from `translateY(110%)`; chars from `translateY(110%) rotate(4deg)`, `--dur-char`, delay `calc(var(--i) * var(--stagger-char))` in the hero; lines `translateY(0.8em)` + opacity, `--dur-reveal`, `--stagger-line`. Easing `--ease-out`.

### 8.3 animations.js / animations.css behavior and property ownership

- Trigger for every `data-reveal`, `data-stagger`, `data-split` (non-hero), `data-printer`, `data-develop`: IntersectionObserver `threshold: 0.2`, `rootMargin: '0px 0px -8% 0px'`, adds `.is-revealed` (printer: `.is-printed`; develop: `.is-developed`) once, then unobserves. Elements already in view on load are revealed on the first IO callback.
- `data-reveal`: `up` (default) from `translateY(24px)` + opacity 0; `fade` opacity only; `left`/`right` from `translateX(-32px/32px)`; `pop` from `scale(0.92)`. Duration `--dur-reveal`, `--ease-out`, optional `data-reveal-delay`.
- `data-stagger`: each direct child gets `--i`; child starts hidden (`up`: translateY(20px); `pop`: `scale(0.7)` + opacity, `--ease-spring`); delay `calc(var(--i) * var(--stagger-item))`. Container receives `.is-revealed` to release all.
- Header: animations.js toggles `.is-scrolled` on `[data-site-header]` when `window.scrollY > 24` (passive scroll listener, rAF throttled; also evaluated once on init). animations.css supplies a `::before` layer: `opacity 0 -> 1`, `backdrop-filter: blur(10px)`, `background: rgba(251, 244, 241, 0.82)`, and shrinks the logo/inner via `transform: scale(0.85)` with `transform-origin: left center` on `.brand`. Core owns the colors/solid fallback of the header and nav links (section 4.2); animations.css never sets `color`, `background` of links, `height`, or `padding` on the header.
- Hero sequence (starts after fonts ready; `html.js` states; `.hero--ready` is added by animations.js to `.hero` to start; timeline from t=0): (1) t=0.2 s `.hero__script` pen-writes: `clip-path: inset(-0.2em 100% -0.3em 0)` -> `inset(-0.2em 0 -0.3em 0)` over `--dur-script` with `--ease-pen` (left to right like a pen; plus a short opacity 0 -> 1 in the first 15%); (2) t=1.0 s `.hero__bold` characters (`data-split="chars"`) rise from `translateY(110%)` with `--stagger-char`; (3) t=1.9 s `.hero__outline` stroke appears (opacity 0 -> 1, 0.6 s), then at t=2.5 s its `::after` fill fades in (opacity, 0.8 s); (4) t=2.8 s `[data-hero-fade]` items fade up in DOM order with `--stagger-line` (chip first, then tagline, actions, meta); (5) hero doodles (their own delays in the HTML: 2800-3300 ms) draw via doodles.js. Total ~ 3.6 s. Skippable: any `pointerdown`/`keydown` before completion jumps all hero elements to the final state.
- `data-printer`: `.printer__strip` `transform: translateY(-102%)` -> `0` over `--dur-print`, `--ease-out`; `.printer` clips with `clip-path: inset(0)` (static) / `overflow:hidden` from core. Slot `.printer__slot` is static. Final: `.is-printed`.
- `data-develop`: `.photo__img` under `html.js [data-develop]:not(.is-developed)`: `filter: blur(10px) grayscale(1) contrast(0.9); opacity: 0.55;` -> `.is-developed` runs an `animation: develop var(--dur-develop) var(--ease-out) forwards` to `filter: none; opacity: 1`. Uses ANIMATION (not transition) on `.photo__img` so it never collides with hover.css's `transition: transform`. hover.css must not set `filter` or `opacity` on `.photo__img` except in its reduced-motion hover (below), where it uses `.photo__frame:hover`'s own `::after` overlay instead (see 8.5).
- Property ownership summary on shared elements: `.photo` (figure) transform/opacity = animations (reveal); `.photo__frame` transform = hover (tilt); `.photo__img` transform/transform-origin/transition = hover, `filter`/`opacity`/animation = animations; `.site-header` colors/bg = core, `::before` layer + `.brand` transform = animations; `.hero__*` layout/colors/fonts = core, hero animation initial/final states (transform/opacity/clip-path) = animations; `.layouts__*`/`.strip*`/`.printer` geometry = core, `.printer__strip` transform = animations; `.doodle*` = doodles; `.sfx-toggle*` visuals = sfx.css (placement in header `.site-header__tools` = core).
- anim state safety: `html.no-anim` block as in 2.2. animations.js sets `html.anim-ready` as its first statement.

### 8.4 sfx.js / sfx.css behavior (module prefix `sfx`)

- Synthesis only, Web Audio API, no audio files. One lazily-created `AudioContext` (`window.AudioContext || window.webkitAudioContext`), created on the FIRST user gesture (`pointerdown`, `keydown`, `touchstart`, capture, passive, `{ once: true }` for creation) and `resume()`d on each click if suspended. Master `GainNode` at `MASTER_GAIN = 0.35`, every voice peak <= 0.12 (low volume).
- Sounds (envelopes are exponential ramps; implementer picks exact values within these bounds):
  - `shutter` (camera click, for buttons/links): two short noise bursts (open ~35 ms, close ~55 ms, ~45 ms apart) through a band-pass at ~2.4 kHz (Q ~1.2) + a ~170 Hz sine thunk (45 ms). Total <= 160 ms.
  - `pen` (soft tick, FAQ/nav/toggles/tabs/swatches/lightbox buttons): one 25 ms noise tick through high-pass 3 kHz plus a 1.1 kHz triangle blip (30 ms) at lower gain (<= 0.06). Total <= 70 ms.
  - `flash` (main CTA/submit): a 140 ms rising filtered-noise "zap" (high-pass sweep 1.5 -> 7 kHz) then the `shutter` voice starting at +70 ms. Total <= 300 ms. Also shows the white flash overlay (below).
- Click mapping (document-level `click` listener in capture phase, single delegated handler; works for mouse, touch taps and keyboard activation since those all produce `click`): find `el = event.target.closest('[data-sfx], a[href], button, summary, [role="button"], [role="tab"], label[for]')`. Skip (silent) when: no `el`; `el.matches('input, textarea, select')` or target inside a form field (`input, textarea, select, [contenteditable]`) except `button`/`summary`; `data-sfx="none"` on `el` or any ancestor chain up to the first match; `el.disabled` or `aria-disabled="true"`; `el.tagName === 'LABEL'` unless it wraps a button (labels never sound). Type: `data-sfx` value if present, else `summary`/`[role="tab"]`/`[aria-pressed]`/`.nav__link`/`.nav__toggle` -> `pen`, else `a`/`button` -> `shutter`.
- Throttle: ignore a second sound within 60 ms of the previous one (prevents double fire from nested elements). Clicks on `[data-sound-toggle]` are handled only by the toggle's own handler (it has `data-sfx="none"`).
- Mute toggle: `#sfx-toggle`. State key `itera.sfx.muted` (7.4). Default: ON, except when `prefers-reduced-motion: reduce` AND no stored value -> OFF. On init and every change: set `aria-pressed` (`"true"` = sound on), swap the `<use href>` between `#speaker-on` and `#speaker-off`, set `title`, set `html[data-sound]`, dispatch `itera:mute-change`. Toggling ON plays one `pen` tick (confirmation); toggling OFF is silent. Keyboard: native button (Enter/Space). Persist via try/catch.
- Flash overlay: on a `flash`-type click (even when muted, but NOT under reduced motion) sfx.js appends/reuses `<div class="sfx-flash" aria-hidden="true"></div>` to `<body>`; sfx.css: `position: fixed; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: var(--z-flash)`; class `.is-firing` runs a 280 ms animation opacity `0 -> 0.55 -> 0` (`--ease-out`). Under reduced motion: never shown.
- sfx.css also styles `.sfx-toggle`: 44x44 min target, `border: 1.5px solid currentColor`, round, transparent bg, color cream at top-state / ink when `.site-header.is-scrolled` and always ink inside the open mobile menu (use `color: var(--nav-fg, var(--color-ink))`; core defines `--nav-fg` on `.site-header` states), `:focus-visible` ring from core; `.sfx-toggle[aria-pressed="false"] .sfx-toggle__icon { opacity: 0.75; }`.
- Failure: if Web Audio is unavailable, the module still dispatches events and manages the toggle state, and plays nothing.

### 8.5 hover.js / hover.css behavior (module prefix `hover`)

Desktop (fine pointer, motion allowed):
- Targets: every `figure[data-zoom] .photo__frame`. On `pointerenter` -> `.photo.is-hovering`; on `pointermove` (rAF-throttled) compute the pointer position relative to the frame in percent and set CSS custom properties on the figure: `--ox`/`--oy` (0-100%, for `transform-origin`), and when `[data-tilt]`: `--rx`/`--ry` (tilt degrees, max 5, tilting toward the cursor). On `pointerleave` remove `.is-hovering` and reset vars (eases back).
- hover.css: `.photo__frame { display:block; overflow:hidden; border-radius: var(--photo-radius); transform: perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)); transition: transform var(--dur-base) var(--ease-out); }` `.photo__img { display:block; width:100%; height:auto; transform: scale(1); transform-origin: var(--ox,50%) var(--oy,50%); transition: transform var(--dur-base) var(--ease-out); }` `.photo.is-hovering .photo__img { transform: scale(1.18); }`. Zoom factor `ZOOM_SCALE = 1.18`, tilt `TILT_MAX_DEG = 5`.
- Custom cursor (4.13) enabled only when `(hover: hover) and (pointer: fine)`: JS adds `html.has-itera-cursor`, creates the element, follows the pointer with rAF lerp (factor 0.25; direct follow under reduced motion). Visible only while over a `.photo__frame` (`is-visible`), hidden over everything else (text, buttons, links, form fields, header) so the native cursor is always native there. Hidden while the lightbox is open.
- Click (any pointer): `click` on `.photo__frame` -> `preventDefault()`, open the lightbox at that image.
Touch / coarse pointer: no hover zoom, no tilt, no custom cursor. A tap opens the lightbox (same handler). Inside the lightbox: tap the image toggles `is-zoomed` (scale 2 about the tap point via `transform-origin` + `scale(2)`; drag to pan while zoomed); swipe left/right (>= 50 px horizontal, |dx| > |dy|) goes next/prev when not zoomed.
Lightbox (4.13): set = all `[data-zoom]` figures in document order; shows `data-full` (falls back to the img `src`), caption from `data-caption` (fallback `alt`), count "n / N". Open: save `document.activeElement`, remove `hidden`, add `is-open` next frame, set `html.lightbox-open`, `inert` on page regions (4.13), focus the close button. Keys: `Escape` closes, `ArrowLeft/ArrowRight` navigate (wrap around), `Tab`/`Shift+Tab` cycle among close/prev/next (focus trap), `Home/End` first/last. Backdrop click or `[data-lightbox-close]` closes. Close: remove `is-open`, after the fade (`--dur-base`) set `hidden`, remove `inert`/`lightbox-open`, restore focus to the trigger. Preload the neighbouring images. Dispatch `itera:lightbox-open/close` (7.2); swipe/arrow navigation dispatches `itera:sfx {type:'pen'}`. hover.css: `.lightbox { position: fixed; inset: 0; z-index: var(--z-lightbox); background: rgba(42, 20, 22, 0.92); opacity: 0; transition: opacity var(--dur-base) var(--ease-out); } .lightbox.is-open { opacity: 1; }`; image `max-width: min(92vw, 1100px); max-height: 82vh; object-fit: contain`; buttons 48x48 cream outlined, a visible border so a missing icon is not an empty hole; caption in cream, `--font-sans`.
prefers-reduced-motion: NO scale, NO tilt, NO cursor lerp, NO lightbox zoom animation. Hover = fade only: `.photo__frame::after` overlay (a maroon veil, `opacity: 0 -> 0.12`, `--dur-fast`) on `:hover`/`:focus-visible`. Lightbox opens/closes with an opacity fade only (<= 150 ms). Swipe/keys still function. `.photo__img` never transforms.
No-JS: `.photo__frame` is a normal link to the large image (new tab).

### 8.6 scene.js / scene.css behavior (module prefix `scene`)

Container/DOM: the existing `.scene[data-scene-canvas]` (4.2). scene.css: `.scene { position: fixed; inset: 0; z-index: var(--z-canvas); pointer-events: none; overflow: hidden; background: linear-gradient(180deg, var(--color-maroon-deep) 0%, var(--color-maroon) 55%, var(--color-maroon-dark) 100%); }`; `.scene__canvas { position:absolute; inset:0; width:100%; height:100%; display:block; opacity:0; transition: opacity 600ms var(--ease-out); }` and `html.scene-live .scene__canvas { opacity: 1; }`. `.scene__fallback` (always present, visible until `scene-live`): a layered CSS gradient curtain (repeating vertical soft stripes in maroon tones) with the five `.scene__strip--1..5` spans drawn as cream/blush rectangles (~4:1 aspect, three faint "frames" via gradient), absolutely positioned at the viewport edges, each rotated -8..10 deg, `opacity 0.8`, with a slow CSS float animation (`transform` only, 14-22 s alternate) that is removed under reduced motion. `html.scene-live .scene__fallback { opacity: 0; transition: opacity 600ms; }`. With JS disabled the fallback stays; `.scene-static` is set when WebGL/module/Three load fails.
Fallback triggers (any -> `html.scene-static`, no WebGL attempted or torn down): `prefers-reduced-motion: reduce`; no WebGL (`canvas.getContext('webgl2'|'webgl')` null); dynamic `import(THREE_URL)` rejects or exceeds 8000 ms; `webglcontextlost` event; any exception in init (try/catch around init).
Scene content: renderer `antialias: true` desktop / false mobile, `alpha: true`, `powerPreference: 'low-power'`; pixel ratio `Math.min(devicePixelRatio, 1.75)` desktop, `Math.min(devicePixelRatio, 1.0)` mobile (phone = `(max-width: 47.99em)` or coarse pointer). Background = full-screen plane (or `scene.background` via shader quad) with a velvet-curtain fold fragment shader: vertical sinus folds `sin(x * freq + noise)` with soft shading, slow drift (`uTime * 0.04`), palette maroon `#4A0C10` / `#6B1217` / `#8B1A1F` / highlight no lighter than `#A33036` in hero (so cream text keeps AA; see 4.3); uniform `uWash` blends toward blush/cream `#F4E6E3`/`#E8CFCF` as the page scrolls past the hero, and `uIntensity` scales strip opacity. Strips: instanced or individual meshes (thin rounded planes with 1-2 frame cells): 2-frame (aspect 1:2.4) and 4-frame (1:4.6) in cream `#FBF4F1`, blush `#E8CFCF`, maroon `#8B1A1F`; counts desktop 12 strips (4 textured with the three output photos, UV-cropped), mobile 6 (2 textured). Strips float with slow sin drift/rotation, lean toward the pointer (desktop only: rotation toward normalized cursor, max 0.35 rad, damped), camera drifts vertically with scroll (`camera.position.y = -scrollProgress * 2.5`, damped), no tilt on mobile. Strip placement avoids the `[data-scene-avoid]` rect (read its bounding rect on resize, convert to NDC, 6% padding) while `scrollY < hero height`; on phones where avoidance is impossible, strip opacity is capped at 0.45 inside the hero. Strips in the hero use `opacity <= 0.85`; below the hero everything renders at `opacity: var(--scene-faint)` where `SCENE_FAINT = 0.22` (applied to the canvas element's `style.opacity` after `scene-live`, ramped between scrollY 0.6 x heroHeight and 1.0 x heroHeight).
Click pulse: on `itera:flash` (big, strength 1.0), `itera:click` (strength 0.35 for `shutter`, 0.15 for `pen`), and hero empty-area `pointerdown`: a radial flash uniform `uFlash` from the click position (NDC) that decays over ~450 ms (additive white-cream), plus a quick strip scale kick (1.0 -> 1.08 -> 1.0). Under motion budget, no screen shake.
Performance/lifecycle: render loop via `requestAnimationFrame`, capped at 60 fps hero / 30 fps below hero; paused when `document.hidden`, when `itera:lightbox-open` is active, and when the hero is out of view AND `scrollProgress` indicates wash fully faint AND no pulse is active (then render at 15 fps or pause: engineer's choice, but must resume on scroll); IntersectionObserver on the hero. `visibilitychange` handled. Resize: debounced 150 ms (`ResizeObserver` on `document.documentElement` or `window.resize`). `pagehide`/`beforeunload`: cancel rAF, remove ALL listeners, dispose every geometry, material and texture, `renderer.dispose()`, `renderer.forceContextLoss()`, remove the canvas, clear references. Never log. Scene errors never affect page content.
scene.css must also supply `@media (prefers-reduced-motion: reduce) { .scene__strip { animation: none; } .scene__canvas { display: none; } }`.

### 8.7 Reduced-motion matrix (all must be honored; test with the OS setting)

| Module | `prefers-reduced-motion: reduce` behavior |
|---|---|
| core (styles/main) | no smooth scroll; no transitions beyond color/opacity <= 150 ms; layout preview/FAQ still work |
| doodles | all doodles shown fully drawn immediately (`is-drawn` set at init), no animation |
| animations | no splitting, no IO reveals, no hero sequence; ALL gated elements in final state at first paint (CSS under media query + `html.reduced-motion`); header `is-scrolled` still toggles but without transitions |
| sfx | default OFF (unless user stored `"0"`), no flash overlay; user may still turn sound on |
| hover | fade-only hover, no transforms, no tilt, no cursor lerp; lightbox opacity fade <= 150 ms |
| scene | no WebGL; static CSS fallback with its float animation disabled |

### 8.8 Phone behavior summary

Fewer/smaller doodles (`doodle--md-up` hidden, sizes x0.7, max 2 per section); scene: 6 strips, DPR <= 1, no pointer tilt; hover: no zoom/tilt/cursor, tap -> lightbox with swipe; sticky Book-now bar (v1) visible after the hero; `data-split="lines"` allowed; hero type uses the fluid tokens; animations unchanged but stagger values apply (list pops unchanged).

---

## 9. Content map (exact headings, copy, CTA labels). Em dashes are written here as `-`; in HTML write `&mdash;`. Currency: `&#8369;`.

Real facts only. Anything not in the client's facts is PLACEHOLDER and flagged. Never mention a year for the opening. Phone display `0994 575 5823` (`tel:+639945755823`), email `iteraphotobooth@gmail.com`.

### 9.1 Hero
- Chip: "Now open - inside BlueMoon, Alangilan"
- H1 lines: "Elevated" / "PHOTOBOOTH" / "EXPERIENCE"
- Tagline: "Your moments, beautifully captured - over and over again"
- CTAs: primary "Book your date" (`#inquiry`, flash); secondary "See our layouts" (`#layouts`)
- Meta: "Inside BlueMoon, Alangilan, Batangas City" ; "Opened May 1"
- Doodles: `swirl-1` (tr, md-up), `sparkle` (bl, md-up), `underline-1` (under title).

### 9.2 About - id `about`
- Eyebrow: "About Itera"
- H2: "Why Itera" (accent word: `Itera` as `<span class="accent">`)
- Lead: "Itera Collectives brings an elevated photobooth experience to Batangas City - your elevated photobooth experience, now open inside BlueMoon, Alangilan."
- Body (`p`, data-reveal): "Every detail is set up so your guests can simply step in and enjoy: great light, a great camera, and prints in your hands in moments."
- Photo: `booth-bluemoon` caption "Our booth inside BlueMoon, Alangilan"; `data-caption`: "The Itera photobooth with its plum curtain inside BlueMoon, Alangilan".
- Four specs (`h3` + `p`, icon in parentheses):
  1. (camera) "DSLR camera setup" - "Best picture quality, every time."
  2. (sparkle) "Triple light system" - "Every angle deserves perfect lighting."
  3. (star) "18.5-inch OLED touchscreen" - "Capturing memories should feel effortless."
  4. (strip-4) "Fast and effortless printing" - "Every moment deserves a smooth finish."
- Doodles: `flourish-1` (tl, md-up, sm), `star` (br, md-up, sm), `underline-2` under the H2.

### 9.3 Packages - id `packages` (section--alt)
- Eyebrow: "Packages"
- H2: "Choose your `<accent>`session`</accent>`"
- Lead: "Book a two-hour or three-hour session, then add what you need. Rates are being finalised - message us for the latest."  <!-- PLACEHOLDER: owner confirms wording once prices are set -->
- Tier 1 (`tier-two-hour`): h3 "Two-hour session"; price "&#8369; - TBA" + badge "Placeholder - price TBA"; features (all real automatic inclusions, no invented extras): "Unlimited prints for the booked duration", "2x6 or 4x6 print format", "On-site attendant", "QR digital copies"; CTA "Inquire about two hours" (`data-session-cta="two-hour"`).
- Tier 2 (`tier-three-hour`): h3 "Three-hour session"; same price/badge/features; CTA "Inquire about three hours" (`three-hour`); `tier--featured` modifier.
- Add-ons h3: "Add-ons"; items: "Magnetic strips" - "&#8369; - TBA"; "One-hour extension" - "&#8369; - TBA" (note: "Extensions can be added to your session" - plain statement of the real add-on, not a promise of availability).
- Note (`packages__note`, data-placeholder): "Prices are placeholders and will be updated by the owner. No online payment is taken on this site - a 50% down payment reserves your date once we confirm."
- Photo: `book-us-booth`, caption "Your chance - book us!".
- Doodles: `arrow-1` (ml, md-up) pointing at the tiers, `heart` (tr, sm), `underline-3` under H2.

### 9.4 What's included - id `included`
- Eyebrow: "Always included"
- H2: "Everything in `<accent>`every`</accent>` booking"
- Lead (`data-reveal`): "No fine print: these come with every Itera booking."
- Six items (label only): "Unlimited prints", "2x6 or 4x6 format", "On-site attendant", "QR digital copies", "Custom frame designs", "Choice of curtain color".
- Photo: `curated-inclusions`, caption "Our curated inclusions".
- Doodles: `sparkle` (tr), `swirl-2` (bl, md-up), `underline-1` under H2.

### 9.5 Layouts - id `layouts` (section--alt)
- Eyebrow: "Strip layouts"
- H2: "Two ways to `<accent>`frame it`</accent>`"
- Lead (`data-split="lines"`): "Pick a 2-frame or 4-frame photo strip. Try a color and type your own caption to see how it could look."
- Tabs: "2-frame", "4-frame". Descriptions: 2-frame "The 2-frame strip: two photos on one strip."; 4-frame "The 4-frame strip: four photos on one strip."
- Controls legend "Strip color" (swatches Maroon / Blush / Cream); caption label "Strip caption"; default caption "Your moments".
- Note (`layouts__note`, data-placeholder): "Preview is illustrative. Prints come in 2x6 or 4x6 format; frame designs are custom for your event."  <!-- PLACEHOLDER: confirm which layout is offered in which print format -->
- Doodles: `strip-2` (tl, sm, md-up), `strip-4` (br, sm, md-up), `circle-1` around the accent word "frame it" is NOT used (avoid long circles); use `underline-2` under H2.

### 9.6 Gallery - id `gallery`
- Eyebrow: "Gallery"
- H2: "Fresh off the `<accent>`printer`</accent>`"
- Lead (`data-reveal`): "A look at real Itera photo outputs."
- Captions: "Black strips, red curtain" (output-strips-black); "Four-frame, black and white" (output-bw-grid); "Black and white and color, side by side" (output-strips-duo).
- Doodles: `camera` (tr, md, md-up), `sparkle` (bl, sm), `wave-divider-1` at the top edge of the section.

### 9.7 Events - id `events` (section--alt)
- Eyebrow: "Events"
- H2: "Made for your `<accent>`celebration`</accent>`"
- Lead (`data-reveal`): "Birthdays, debuts, weddings and more - you name it, we'll bring the fun to your event."
- Eight cards, EXACT titles and one-line texts (texts are descriptive only, no factual claims beyond the list):
  1. "Birthdays" - "Fun poses and prints to take home."
  2. "Debuts" - "Frame the milestone night."
  3. "Weddings" - "A keepsake strip for you and your guests."
  4. "School functions and festivals" - "Photos for the whole campus crowd."
  5. "Corporate gatherings and team buildings" - "A polished moment for your team."
  6. "Product launches" - "Branded frames for your big reveal."
  7. "Pop-ups" - "Bring the booth to your pop-up."
  8. "Private events" - "Any celebration, big or small."
- Icons (decorative): heart, star, sparkle, camera, strip-2, strip-4, heart, sparkle (order as listed).
- Photo: `events-popups`, caption "Events and pop-ups - book us now".
- Doodles: `swirl-1` (tl, md-up), `arrow-2` (mr, md-up), `underline-1`.

### 9.8 Where to find us - id `where`
- Eyebrow: "Find us"
- H2: "Where to `<accent>`find us`</accent>`"
- Lead (`data-split="lines"`): "Our booth is inside BlueMoon in Alangilan, Batangas City. Look for the plum curtain and the easel sign."
- Address block: "Itera Collectives - Photobooth" / "Inside BlueMoon, Alangilan" / "Batangas City, Philippines" / "Opened May 1".
- Body (`p`): "Now open: your elevated photobooth experience is inside BlueMoon Alangilan. Want us at your own event? Send a message."
- CTA: "Message us on Messenger" (`https://m.me/iteracollectives.ph`, new tab, shutter).
- Photos: `booth-bluemoon` (caption "The booth, inside BlueMoon"), `is-opening-bluemoon` (caption "Opened May 1, inside BlueMoon Alangilan").
- Pop-up block h3: "Where we've popped up"; photo `flea-market-lf43`; text: "L&F43 Flea Market at BlueMoon Alangilan - Aug 1 to 2, 1 to 11 PM." (past tense in any extra sentence: "We popped up there with the booth.")
- Doodles: `arrow-3` (tr, md-up), `circle-1` around nothing (do NOT use), `wave-divider-2` at top edge, `sparkle` (bl, sm).

### 9.9 Process - id `process` (section--maroon)
- Eyebrow: "How it works"
- H2: "Four simple `<accent>`steps`</accent>`"
- Lead: "From first message to your finished strip."
- Steps (title / text):
  01 "Send us a message" / "Message any of our social pages with your event date, location and event type."
  02 "Book early" / "We recommend booking as early as possible to ensure availability."
  03 "Reserve with 50% down" / "A 50% down payment secures your date and time. Your booking is confirmed once our team receives it."
  04 "Pose and take it home" / "Strike a pose, collect your unlimited prints, and scan the QR code for your digital copies."
- Doodles: the two `process-line-*` spans; `star` (tr, sm, md-up).

### 9.10 FAQ - id `faq` (EXACT, `<details>`)
- Eyebrow: "FAQ"
- H2: "Good to `<accent>`know`</accent>`"
- Lead (`data-reveal`): "Quick answers before you book."
- Q1 summary: "How do I book Itera's photobooth for my private event?" Answer: "Simply send us a message to any of our social media pages with your event date, location, and event type! We recommend booking as early as possible to ensure availability!"
- Q2: "What type of events or bookings does Itera cater to?" Answer: "Birthdays, debuts, weddings, school functions and festivals, corporate gatherings and team buildings, product launches - you name it, we'll bring the fun to your event!"
- Q3: "What is included if we book your photobooth?" Answer: "We provide unlimited prints for the booked duration, 2x6 or 4x6 cut formats for your prints, up to two personalized templates and frames to suit your event, and digital copies!"
- Q4: "Do you require a down payment to reserve our date?" Answer: "Yes, a 50% down payment is required to secure your event date and time! Your booking will be confirmed once the payment has been received by our team."
- Doodles: `swirl-2` (tr, md-up), `underline-3` under H2.

### 9.11 Inquiry - id `inquiry` (section--alt)
- Eyebrow: "Inquiry"
- H2: "Book your `<accent>`date`</accent>`"
- Lead (`data-reveal`): "Tell us about your event and we'll get back to you. Prefer to chat? Message us on Messenger."
- Field labels (in order): "Full name *", "Email *", "Phone (optional)", "Event type *", "Event date (optional)", "Venue *" (hint "Where will your event be?"), "Session length (optional)", "Add-ons (optional)", "Message (optional)".
- Event type options (value / label): `""` "Choose an event type"; `birthday` "Birthday"; `debut` "Debut"; `wedding` "Wedding"; `school` "School function or festival"; `corporate` "Corporate gathering or team building"; `product-launch` "Product launch"; `pop-up` "Pop-up"; `private` "Private event"; `other` "Other".
- Session options: `""` "Not sure yet"; `two-hour` "Two-hour session"; `three-hour` "Three-hour session". Add-ons: `magnetic-strips` "Magnetic strips"; `extension-hour` "One-hour extension".
- Submit label: "Send inquiry"; status copy: sending "Sending your inquiry..."; success "Thank you! We got your inquiry and will message you soon."; error "We could not send that. Please message us on Messenger or call 0994 575 5823."; placeholder-endpoint error as in 4.11.
- Validation messages (core): name "Please enter your name."; email "Please enter a valid email address."; event type "Please choose an event type."; venue "Please tell us the venue."; date "Please choose today or a future date."; phone "Please enter a valid phone number."; message "Message is too long (1000 characters max)."
- Contact aside: h3 "Contact": Phone `0994 575 5823` (`tel:+639945755823`); Email `iteraphotobooth@gmail.com` (`mailto:`); Location "Inside BlueMoon, Alangilan, Batangas City, Philippines". h3 "Follow": Facebook `https://www.facebook.com/iteracollectives.ph` (label "Facebook" handle "Itera Collectives - Photobooth"), Instagram `https://www.instagram.com/iteracollectives.ph` (handle `iteracollectives.ph`), TikTok `https://www.tiktok.com/@iteracollectives.ph` (handle `iteracollectives.ph`), Messenger `https://m.me/iteracollectives.ph` (label "Messenger", handle "Itera Collectives - Photobooth"). All external links `target="_blank" rel="noopener noreferrer"`.
- Doodles: `flourish-2` (tl, md-up), `heart` (br, sm), `arrow-1` near contact (mr, md-up).

### 9.12 Footer and sticky bar
- Footer brand: logo badge image + tagline "Your moments, beautifully captured - over and over again".
- Footer nav: About `#about`, Packages `#packages`, Layouts `#layouts`, Gallery `#gallery`, Events `#events`, Find us `#where`, FAQ `#faq`, Book now `#inquiry`.
- Footer contact block (exactly these five, in this order): Instagram `iteracollectives.ph` (`https://www.instagram.com/iteracollectives.ph`); TikTok `iteracollectives.ph` (`https://www.tiktok.com/@iteracollectives.ph`); Phone `0994 575 5823` (`tel:+639945755823`); Email `iteraphotobooth@gmail.com` (`mailto:iteraphotobooth@gmail.com`); Messenger "Itera Collectives - Photobooth" (`https://m.me/iteracollectives.ph`).
- Legal line: "(c) Itera Collectives. Inside BlueMoon, Alangilan, Batangas City, Philippines." (use `&copy;`).
- Doodles in footer: `wave-divider-1` (divider, top), `flourish-1` (inline decorative, md-up) optional.
- Sticky bar: "Book now" -> `#inquiry` (flash); "Call" -> `tel:+639945755823`.

### 9.13 Section dividers
`doodle--divider` wave dividers (`wave-divider-1/2` alternating) sit as the FIRST child of: `#packages`, `#layouts`, `#events`, `#faq`, `#inquiry`. Color follows the previous section's bg contrast: they use `--doodle-color` (maroon on light, blush on maroon). Never between hero and about.

---

## 10. Cross-engineer checklist (each engineer verifies before finishing)

- Content: every class/attr in sections 2-4 and 9 present; placeholders tagged twice; no forbidden number; only real contact info; images with width/height/alt/lazy; scripts in 2.3 order; no inline styles/handlers.
- Core: all tokens in section 3 declared; layout for every class in section 4 (including `.photo` wrappers' sizing but not their motion); header default/no-JS/scrolled colors; `--nav-fg` custom property on `.site-header` states for sfx.css; form per 4.11; sticky bar; `.has-doodles { position: relative; }`; `.hero--dark` scrim; section backgrounds from tokens; no `[data-reveal]` hiding rules.
- Doodle: 28 symbols exact ids; `pathLength="1"`; JS fallback copy of the sprite; `.icon`, `.doodle-sprite` classes.
- Animation: `html.anim-ready` first; hero timeline; reveal/stagger/split/printer/develop; `html.no-anim` block; reduced-motion final states; header blur/shrink layer.
- SFX: all three voices; click mapping rules; toggle state/`aria-pressed`/storage; flash overlay; events per 7.2.
- Hover: figure pattern 4.12; cursor and lightbox DOM per 4.13; keys/focus trap/swipe/inert; reduced-motion fade only.
- Scene: dynamic import with pinned URL; fallback triggers; pulses; dispose; pause rules; text-safe hero; fallback CSS strips.
- Everyone: no `console.*`, no globals, no new events/keys/classes beyond this document, files < 800 lines.
