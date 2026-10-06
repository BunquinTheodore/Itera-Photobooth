# Itera Collectives Photobooth - BUILD CONTRACT (v1)

Three engineers (HTML, CSS, JS) build in parallel. This file is the only shared truth. If something is not here, do not invent a class, id, data- attribute or custom property; ask the architect. Names below are exact and case-sensitive.

## 0. Files and ownership

| File | Owner | Notes |
|---|---|---|
| `index.html` | HTML | Only file that contains markup, SEO tags, JSON-LD. No inline styles, no inline event handlers. One inline script allowed in `<head>` (see 2.1). |
| `css/styles.css` | CSS | Single file, section-commented. Mobile-first (`min-width` queries only). |
| `js/main.js` | JS | Single IIFE, `'use strict'`, no globals, no `console.*`, no frameworks. Loaded `<script src="js/main.js" defer>`. |
| `assets/favicon.svg` | HTML | Maroon rounded square, cream "I" with macron mark. |
| `assets/og-image.svg` | HTML | 1200x630, cream bg, maroon wordmark, blush strips. Marked placeholder. |

Rules for everyone: immutable style (never mutate inputs, build new values; `const` by default), functions under 50 lines, early returns, no magic numbers (named constants at top of JS), no external images, only external resources are Google Fonts (Cormorant Garamond, Montserrat).

Breakpoints (literal values in `@media (min-width: ...)`, cannot be variables): **40em** (sm), **48em** (md), **64em** (lg).

## 1. CSS custom properties (declared on `:root` in this exact form)

```css
:root {
  /* color */
  --color-maroon: #8B1A1F;
  --color-maroon-dark: #6B1217;
  --color-cream: #FBF4F1;
  --color-blush: #E8CFCF;
  --color-blush-soft: #F4E6E3;
  --color-blush-deep: #D9B3B4;
  --color-ink: #2A1416;
  --color-ink-muted: #5E4446;
  --color-white: #FFFFFF;
  --color-line: rgba(139, 26, 31, 0.25);
  --color-error: #A3121A;
  --color-success: #2F6B3F;
  --color-focus: #8B1A1F;

  /* semantic aliases */
  --bg-page: var(--color-cream);
  --bg-alt: var(--color-blush-soft);
  --text-body: var(--color-ink);
  --text-muted: var(--color-ink-muted);
  --text-accent: var(--color-maroon);

  /* fonts */
  --font-serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;
  --font-sans: "Montserrat", system-ui, -apple-system, "Segoe UI", sans-serif;

  /* type scale (fluid where noted) */
  --fs-xs: 0.8125rem;
  --fs-sm: 0.9375rem;
  --fs-base: 1rem;
  --fs-md: 1.125rem;
  --fs-lg: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  --fs-xl: clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem);
  --fs-2xl: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem);
  --fs-hero: clamp(2.5rem, 1.5rem + 5vw, 5rem);
  --lh-tight: 1.1;
  --lh-snug: 1.3;
  --lh-body: 1.65;
  --tracking-wide: 0.18em;
  --tracking-wider: 0.3em;

  /* spacing scale (4px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4.5rem;
  --space-9: 6rem;

  /* radii */
  --radius-sm: 4px;
  --radius-md: 12px;
  --radius-lg: 24px;
  --radius-pill: 999px;

  /* layout */
  --container-max: 72rem;
  --gutter: 1rem;               /* 16px mobile side gutter; raise to 2rem at 48em */
  --header-h: 4rem;
  --sticky-bar-h: 4rem;

  /* elevation / motion / layering */
  --shadow-sm: 0 1px 3px rgba(107, 18, 23, 0.12);
  --shadow-md: 0 8px 24px rgba(107, 18, 23, 0.14);
  --dur-fast: 150ms;
  --dur-base: 300ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --z-header: 100;
  --z-sticky-bar: 90;
  --z-skip: 200;
}
```

Contrast pairs that are pre-approved (AA): maroon on cream/blush-soft/white; cream/white on maroon and maroon-dark; ink on all light backgrounds; ink-muted on cream/white/blush-soft. Do NOT put maroon text on blush-deep or ink-muted on maroon.

Global CSS requirements: `html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + var(--space-4)); }` wrapped so smooth only applies inside `@media (prefers-reduced-motion: no-preference)`. A `@media (prefers-reduced-motion: reduce)` block must set `animation: none !important; transition: none !important;` on `*`. Focus: `:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }`, and on maroon surfaces (`.btn--primary`, `.section--maroon`, `.site-footer`, `.sticky-bar`) use `outline-color: var(--color-cream)`. `body { background: var(--bg-page); color: var(--text-body); font-family: var(--font-sans); line-height: var(--lh-body); }`. Headings use `--font-serif`; eyebrows, nav, buttons, labels use `--font-sans` uppercase with `--tracking-wide`. Italic serif accent class: `.accent` (italic, `--font-serif`, `--color-maroon`).

## 2. Class naming (BEM)

`block`, `block__element`, `block--modifier`. State classes are global and prefixed `is-`: `is-open`, `is-active`, `is-visible`, `is-invalid`, `is-revealed`, `is-selected`. JS only ever toggles `is-*` classes, ARIA attributes, `hidden`, and `data-*` values; CSS owns every visual consequence. No ID selectors in CSS except none (ids are for anchors/ARIA/JS only). No utility-class soup beyond those listed in 2.2.

### 2.1 Head script (HTML engineer, verbatim)

```html
<script>document.documentElement.classList.add('js');</script>
```
CSS gates reveal animations behind `.js`, so no-JS users see everything.

### 2.2 Shared utilities and components (CSS must implement; HTML may use)

| Class | Purpose |
|---|---|
| `.container` | max-width `--container-max`, `margin-inline:auto`, padding-inline `--gutter` |
| `.visually-hidden` | standard SR-only |
| `.skip-link` | first element in body; off-screen until focused; `z-index: var(--z-skip)` |
| `.section` | vertical padding `--space-8` (mobile) / `--space-9` (md+) |
| `.section--alt` | `--bg-alt` background |
| `.section--maroon` | maroon background, cream text |
| `.section__header` | centered header block (eyebrow + title + lead) |
| `.section__eyebrow` | small uppercase sans label |
| `.section__title` | h2, serif `--fs-xl`/`--fs-2xl` |
| `.section__lead` | intro paragraph, `--text-muted`, max-width 40rem |
| `.accent` | italic serif accent span |
| `.btn` | base button/link button, min-height 48px, pill radius, sans uppercase |
| `.btn--primary` | maroon bg, cream text |
| `.btn--ghost` | transparent, 2px maroon border, maroon text |
| `.btn--light` | cream bg, maroon text (for maroon surfaces) |
| `.btn--block` | full width |
| `.badge-placeholder` | small pill "Placeholder" (blush-soft bg, maroon text, dashed maroon border) |
| `[data-placeholder]` | attribute selector styled with a dotted underline/outline (`1px dashed var(--color-blush-deep)`) so editable content is visibly marked |
| `[data-reveal]` | with `.js` on `<html>`: initially `opacity:0; transform: translateY(16px)`; `.is-revealed` transitions to normal. Reduced-motion: always visible. |

## 3. HTML skeleton (exact)

Document order inside `<body>`: skip link, header, `<main id="main">` containing the 9 sections in order, footer, sticky bar, script tag. Every section carries `data-section` (JS uses it for nav highlighting) and `aria-labelledby` pointing to its heading id. All placeholder content gets BOTH `data-placeholder` on the element and an HTML comment `<!-- PLACEHOLDER: ... -->` above it.

### 3.1 `<head>`

- `<html lang="en">`, charset, viewport, `<title>Itera Collectives Photobooth | Elevated Photobooth Experience in Batangas City</title>`.
- `<meta name="description" content="Itera Collectives is a photobooth service in Batangas City, Philippines. Book elevated photobooth experiences for weddings, debuts, birthdays, corporate events and pop-ups.">`
- `<meta name="theme-color" content="#8B1A1F">`
- `<link rel="canonical" href="https://example.com/">` with comment `<!-- PLACEHOLDER: replace with real domain -->`
- Open Graph: `og:type=website`, `og:title`, `og:description`, `og:url` (placeholder domain), `og:image` = `assets/og-image.svg` (comment: replace with PNG/JPG 1200x630 before launch; some scrapers ignore SVG), `og:site_name=Itera Collectives`, `og:locale=en_PH`; Twitter `summary_large_image`.
- `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`
- Google Fonts: preconnect to fonts.googleapis.com and fonts.gstatic.com (crossorigin), stylesheet `family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Montserrat:wght@400;500;600&display=swap`.
- `<link rel="stylesheet" href="css/styles.css">`, head script from 2.1.
- JSON-LD `<script type="application/ld+json">` `LocalBusiness`: `name` "Itera Collectives - Photobooth", `description`, `telephone` "+63 994 575 5823", `email` "iteraphotobooth@gmail.com", `url` placeholder domain, `image` placeholder, `address` {`@type` PostalAddress, `addressLocality` "Batangas City", `addressRegion` "Batangas", `addressCountry` "PH"}, `sameAs` [the three social URLs in 3.11]. NO ratings, reviews, priceRange, geo, or opening hours (not known).

### 3.2 Skip link and header

```html
<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header" data-site-header>
  <div class="container site-header__inner">
    <a class="brand" href="#hero" aria-label="Itera Collectives - back to top">
      <span class="brand__wordmark">ITERA&#772;</span>   <!-- renders ITERA with macron; use the literal character A-macron -->
      <span class="brand__script">Collectives</span>
    </a>
    <nav class="nav" id="site-nav" aria-label="Primary" data-nav>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu" data-nav-toggle>
        <span class="visually-hidden">Menu</span>
        <span class="nav__toggle-bar" aria-hidden="true"></span>
      </button>
      <ul class="nav__menu" id="nav-menu" data-nav-menu>
        <li class="nav__item"><a class="nav__link" href="#about">About</a></li>
        <li class="nav__item"><a class="nav__link" href="#packages">Packages</a></li>
        <li class="nav__item"><a class="nav__link" href="#layouts">Layouts</a></li>
        <li class="nav__item"><a class="nav__link" href="#gallery">Gallery</a></li>
        <li class="nav__item"><a class="nav__link" href="#events">Events</a></li>
        <li class="nav__item"><a class="nav__link" href="#process">How it works</a></li>
        <li class="nav__item"><a class="nav__link" href="#faq">FAQ</a></li>
        <li class="nav__item nav__item--cta"><a class="btn btn--primary nav__cta" href="#inquiry">Book now</a></li>
      </ul>
    </nav>
  </div>
</header>
```
Nav behavior (CSS): below 64em the menu is a full-width panel under the header, hidden by default (`display:none`), shown when `.nav.is-open`. At 64em+ it is an inline horizontal list and `.nav__toggle` is `display:none`. The toggle's three-bar icon is drawn with `.nav__toggle-bar` + `::before`/`::after`; `.nav.is-open` morphs it to an X. Header is `position: sticky; top: 0; z-index: var(--z-header)`, cream bg at 95% with bottom 1px `--color-line`. The `.nav__link.is-active` state: maroon text + 2px maroon underline.

### 3.3 `#hero`

```html
<section class="hero" id="hero" aria-labelledby="hero-title" data-section>
  <div class="container hero__inner">
    <div class="hero__content">
      <p class="hero__eyebrow">Itera Collectives &middot; Photobooth</p>
      <h1 class="hero__title" id="hero-title">Elevated <span class="accent">Photobooth</span> Experience</h1>
      <p class="hero__tagline">Your moments, beautifully captured &mdash; over and over again.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#inquiry">Book your date</a>
        <a class="btn btn--ghost" href="#layouts">See strip layouts</a>
      </div>
      <ul class="hero__meta">
        <li class="hero__meta-item">Batangas City, Philippines</li>
        <li class="hero__meta-item">Now in soft opening</li>
      </ul>
    </div>
    <div class="hero__art" aria-hidden="true">
      <div class="strip strip--4-frame strip--decor" data-theme="blush"> ...8 .strip__frame ... </div>
      <div class="strip strip--2-frame strip--decor" data-theme="maroon"> ...4 .strip__frame ... </div>
    </div>
  </div>
</section>
```
Hero art is decorative (strip markup per 3.6 minus JS hooks and without `data-strip`). Hero background cream with a blush radial/gradient wash; min-height roughly `calc(100svh - var(--header-h))` on md+.

### 3.4 Generic section header (used by every section except hero)

```html
<section class="section [section--alt|section--maroon] <name>" id="<id>" aria-labelledby="<id>-title" data-section>
  <div class="container">
    <header class="section__header" data-reveal>
      <p class="section__eyebrow">...</p>
      <h2 class="section__title" id="<id>-title">... <span class="accent">...</span></h2>
      <p class="section__lead">...</p>
    </header>
    ...section body...
  </div>
</section>
```
`<name>` is the root class: `about`, `packages`, `layouts`, `gallery`, `events`, `process`, `faq`, `inquiry`. Backgrounds alternate: about (none), packages (`--alt`), layouts (none), gallery (`--alt`), events (none), process (`--maroon`), faq (none), inquiry (`--alt`).

### 3.5 `#about` - body

```html
<div class="about__grid">
  <div class="about__text" data-reveal>
    <!-- PLACEHOLDER: draft about copy, owner to rewrite -->
    <p data-placeholder>[Draft copy] Itera Collectives is a Batangas City photobooth service ... (generic, no unverifiable claims)</p>
    <blockquote class="about__quote">
      <p>&ldquo;A little color, a little bloom, and a lot worth remembering.&rdquo;</p>
    </blockquote>
  </div>
  <ul class="about__points" data-reveal>
    <li class="about__point"><h3 class="about__point-title">Private events</h3><p class="about__point-text">...</p></li>
    <li class="about__point"> Pop-ups ...</li>
    <li class="about__point"> Bookings &amp; reservations ...</li>
  </ul>
</div>
```
The quote is a real Facebook post (not a testimonial); do not attribute it to a person.

### 3.6 `#layouts` - body (strip markup is the shared pattern)

Strip pattern:
```html
<div class="strip strip--2-frame" data-strip data-theme="maroon">
  <div class="strip__frames">
    <div class="strip__frame"><span class="strip__frame-num" aria-hidden="true">1</span></div>
    <!-- 4 frames total for 2-frame (2x2 grid); 8 frames for 4-frame (2x4 grid) -->
  </div>
  <p class="strip__caption" data-strip-caption>Your moments</p>
</div>
```
- `data-theme` values: `maroon` (maroon outline on cream), `blush` (blush fill), `cream` (white fill, maroon outline). CSS defines each via `.strip[data-theme="..."]` setting `--strip-bg`, `--strip-line`, `--strip-ink` locally.
- `.strip--2-frame .strip__frames`: `grid-template-columns: repeat(2, 1fr)` with 2 rows (square-ish frames, `aspect-ratio: 1`), strip aspect about 2:3.
- `.strip--4-frame .strip__frames`: `repeat(2, 1fr)` columns with 4 rows (`aspect-ratio: 1`), strip aspect about 1:3. Strips outlined 2px in `--strip-line`, radius `--radius-sm`, frames outlined 1.5px with `--strip-bg` fill and a faint blush inner gradient, caption in script serif italic at the bottom.

Section body:
```html
<div class="layouts__ui" data-layouts>
  <div class="layouts__tabs" role="tablist" aria-label="Photo strip layout">
    <button class="layouts__tab is-selected" type="button" role="tab" id="tab-2-frame" aria-selected="true"  aria-controls="panel-2-frame" data-layout-tab="2-frame">2-frame <span class="layouts__tab-sub">2&times;2 grid</span></button>
    <button class="layouts__tab" type="button" role="tab" id="tab-4-frame" aria-selected="false" aria-controls="panel-4-frame" tabindex="-1" data-layout-tab="4-frame">4-frame <span class="layouts__tab-sub">2&times;4 grid</span></button>
  </div>
  <div class="layouts__stage">
    <div class="layouts__panel" role="tabpanel" id="panel-2-frame" aria-labelledby="tab-2-frame" data-layout-panel="2-frame"> [strip--2-frame + description p.layouts__desc] </div>
    <div class="layouts__panel" role="tabpanel" id="panel-4-frame" aria-labelledby="tab-4-frame" data-layout-panel="4-frame" hidden> [strip--4-frame + description] </div>
  </div>
  <div class="layouts__controls">
    <fieldset class="layouts__themes">
      <legend class="layouts__legend">Strip color</legend>
      <button class="layouts__swatch layouts__swatch--maroon is-selected" type="button" aria-pressed="true"  data-strip-theme="maroon"><span class="visually-hidden">Maroon</span></button>
      <button class="layouts__swatch layouts__swatch--blush" type="button" aria-pressed="false" data-strip-theme="blush"><span class="visually-hidden">Blush</span></button>
      <button class="layouts__swatch layouts__swatch--cream" type="button" aria-pressed="false" data-strip-theme="cream"><span class="visually-hidden">Cream</span></button>
    </fieldset>
    <div class="layouts__caption-field">
      <label class="layouts__label" for="strip-caption-input">Strip caption</label>
      <input class="layouts__input" id="strip-caption-input" type="text" maxlength="30" value="Your moments" data-strip-caption-input autocomplete="off">
    </div>
  </div>
</div>
<p class="layouts__note" data-placeholder><!-- PLACEHOLDER --> Preview is illustrative. Custom designs: TBA.</p>
```
`.layouts__ui` lays out stage and controls stacked on mobile, side by side at 48em.

### 3.7 `#packages` - body

```html
<div class="packages__grid">
  <!-- PLACEHOLDER: tier names, prices, inclusions -->
  <article class="tier" data-reveal data-placeholder>
    <p class="badge-placeholder">Placeholder</p>
    <h3 class="tier__name">Package One <span class="accent">(name TBA)</span></h3>
    <p class="tier__price">&#8369; &mdash; TBA</p>
    <ul class="tier__features"><li class="tier__feature">Inclusion TBA</li> ...x4</ul>
    <a class="btn btn--ghost btn--block tier__cta" href="#inquiry" data-package="package-1">Inquire about this</a>
  </article>
  <article class="tier tier--featured" ...> data-package="package-2" </article>
  <article class="tier" ...> data-package="package-3" </article>
</div>
<p class="packages__note" data-placeholder>Rates are being finalised. Message us for a custom quote.</p>
```
`.tier--featured` = maroon border 2px + subtle raised shadow + a `.tier__flag` is NOT used (no claims of "popular"). Grid: 1 col mobile, 3 cols at 64em.

### 3.8 `#gallery`, `#events`, `#process`, `#faq`

Gallery:
```html
<ul class="gallery__grid" data-gallery>
  <!-- PLACEHOLDER: replace each .gallery__ph with a real <img> -->
  <li class="gallery__item" data-reveal data-placeholder>
    <figure class="gallery__figure">
      <div class="gallery__ph gallery__ph--1" role="img" aria-label="Photo placeholder"> <svg ...inline blush camera/heart glyph, aria-hidden="true"/> </div>
      <figcaption class="gallery__caption">Photo placeholder</figcaption>
    </figure>
  </li>
  ...8 items, ph modifiers --1 to --4 repeating for tone variety (blush, blush-soft, blush-deep, cream+maroon line)
</ul>
```
Grid: 2 cols mobile, 4 cols at 48em; aspect ratios vary via `:nth-child` (mix of 1/1 and 4/5).

Events:
```html
<ul class="events__list">
  <li class="event-card" data-reveal>
    <svg class="event-card__icon" aria-hidden="true" viewBox="0 0 24 24" ...></svg>
    <h3 class="event-card__title">Weddings</h3>
    <p class="event-card__text">...</p>
  </li>
  <!-- Debuts, Birthdays, Corporate, Pop-ups -->
</ul>
```
Exactly five cards in the order: Weddings, Debuts, Birthdays, Corporate, Pop-ups. 1 col mobile, 2 at 40em, 3 at 64em. Short descriptions are generic and non-factual.

Process:
```html
<ol class="process__steps">
  <li class="step" data-reveal><span class="step__num" aria-hidden="true">01</span><h3 class="step__title">Inquire</h3><p class="step__text">...</p></li>
  <!-- 02 Confirm, 03 Set up, 04 Enjoy -->
</ol>
```
On maroon bg: titles cream serif, numbers blush. Vertical list mobile, 4 columns at 64em with a thin connecting line.

FAQ:
```html
<div class="faq__list" data-faq>
  <!-- PLACEHOLDER: replace every answer -->
  <details class="faq__item" data-placeholder>
    <summary class="faq__question">How far in advance should I book?</summary>
    <div class="faq__answer"><p>Answer TBA.</p></div>
  </details>
  ...5 items: advance booking; coverage area; how long is the session/ how many hours; what is included/prints; deposits and payment
</div>
```
Questions are fine, answers must be "TBA" style placeholders (no invented policies). `summary` gets a custom marker via `::after` (+ / minus) and `list-style: none` plus hiding `::-webkit-details-marker`. Must remain keyboard operable (native).

### 3.9 `#inquiry` - body

```html
<div class="inquiry__grid">
  <div class="inquiry__form-wrap">
    <form class="form" id="inquiry-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST" novalidate data-inquiry-form>
      <!-- PLACEHOLDER: replace YOUR_FORM_ID with real Formspree (or compatible) form id -->
      <div class="form__field" data-field="name">
        <label class="form__label" for="field-name">Full name <span class="form__req" aria-hidden="true">*</span></label>
        <input class="form__input" id="field-name" name="name" type="text" autocomplete="name" required aria-describedby="error-name">
        <p class="form__error" id="error-name" hidden></p>
      </div>
      <!-- field-email  (type=email, name=email, autocomplete=email, required, error-email) -->
      <!-- field-phone  (type=tel, name=phone, autocomplete=tel, optional label "(optional)", error-phone) -->
      <!-- field-event-type (select, name=event_type, required, error-event-type; options: "" "Choose an event type", wedding, debut, birthday, corporate, pop-up, other) -->
      <!-- field-event-date (type=date, name=event_date, optional, error-event-date) -->
      <!-- field-package (select, name=package, optional, error-package; options: "" "Not sure yet", package-1, package-2, package-3) -->
      <!-- field-message (textarea rows=5, name=message, required, maxlength=1000, error-message) -->
      <div class="form__field form__field--trap" aria-hidden="true"> <!-- honeypot -->
        <label for="field-website">Leave this empty</label>
        <input class="form__input" id="field-website" name="_gotcha" type="text" tabindex="-1" autocomplete="off">
      </div>
      <button class="btn btn--primary btn--block form__submit" id="form-submit" type="submit" data-submit>Send inquiry</button>
      <p class="form__status" id="form-status" role="status" aria-live="polite" data-state="idle" hidden></p>
      <p class="form__fallback">
        Prefer chat? <a class="form__fallback-link" id="form-fb-fallback" href="https://www.facebook.com/iteracollectives.ph" target="_blank" rel="noopener noreferrer">Message us on Facebook</a>
      </p>
    </form>
  </div>
  <aside class="inquiry__contact" aria-label="Contact details">
    <h3 class="contact__title">Contact</h3>
    <ul class="contact__list">
      <li class="contact__item"><span class="contact__label">Phone</span><a class="contact__link" href="tel:+639945755823">0994 575 5823</a></li>
      <li class="contact__item"><span class="contact__label">Email</span><a class="contact__link" href="mailto:iteraphotobooth@gmail.com">iteraphotobooth@gmail.com</a></li>
      <li class="contact__item"><span class="contact__label">Location</span><span class="contact__text">Poblacion, Batangas City, Philippines</span></li>
    </ul>
    <h3 class="contact__title">Follow</h3>
    <ul class="socials">
      <li><a class="socials__link" href="https://www.facebook.com/iteracollectives.ph" target="_blank" rel="noopener noreferrer">Facebook <span class="socials__handle">@iteracollectives.ph</span></a></li>
      <li><a class="socials__link" href="https://www.instagram.com/iteracollectives.ph" target="_blank" rel="noopener noreferrer">Instagram <span class="socials__handle">@iteracollectives.ph</span></a></li>
      <li><a class="socials__link" href="https://www.tiktok.com/@iteracollectives.ph" target="_blank" rel="noopener noreferrer">TikTok <span class="socials__handle">@iteracollectives.ph</span></a></li>
    </ul>
  </aside>
</div>
```
Honeypot `.form__field--trap` is positioned off-screen via CSS (NOT `display:none`, so bots fill it; it is also `aria-hidden`, `tabindex=-1`). Error ids follow `error-<field-key>` where key is the `data-field` value: `name`, `email`, `phone`, `event-type`, `event-date`, `package`, `message`. Input ids follow `field-<key>`. `.form__error` uses `--color-error`, `--fs-sm`, with a leading "!" via `::before`. `.form__field.is-invalid .form__input` gets 2px `--color-error` border. Inputs: 48px min height, 16px min font size (prevents iOS zoom), white bg, 1.5px `--color-line` border, radius `--radius-md`. `.form__status[data-state="success"]` uses success color on a pale background with left border; `[data-state="error"]` uses error color; `[data-state="sending"]` neutral.

### 3.10 Footer and sticky bar

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand"><span class="brand__wordmark">ITERA&#772;</span><span class="brand__script">Collectives</span></div>
    <nav class="site-footer__nav" aria-label="Footer"><ul class="site-footer__list"> links to #about #packages #layouts #events #faq #inquiry </ul></nav>
    <p class="site-footer__tagline">Your moments, beautifully captured &mdash; over and over again.</p>
    <p class="site-footer__legal">&copy; 2026 Itera Collectives. Batangas City, Philippines. Soft opening: site content is being finalised.</p>
  </div>
</footer>

<div class="sticky-bar" id="sticky-bar" data-sticky-bar>
  <a class="btn btn--light sticky-bar__book" href="#inquiry">Book now</a>
  <a class="sticky-bar__call" href="tel:+639945755823" aria-label="Call Itera Collectives">Call</a>
</div>
<script src="js/main.js" defer></script>
```
Footer: maroon-dark bg, cream text. Body gets `padding-bottom: var(--sticky-bar-h)` below 48em so the bar never covers content.
Sticky bar CSS: `position: fixed; inset: auto 0 0 0; height: var(--sticky-bar-h); background: var(--color-maroon); z-index: var(--z-sticky-bar); padding-bottom: env(safe-area-inset-bottom);` Default (hidden): `transform: translateY(100%); visibility: hidden;` `.sticky-bar.is-visible`: `transform: none; visibility: visible;` transition on transform, and visibility delayed by `--dur-base` when hiding. At 48em+: `display: none`.

## 4. JS contract (`js/main.js`)

Structure: one IIFE; constants block; pure helpers (`validateField(name, value)` returns `{ valid, message }`, never mutating input); `init*` functions, each begins with a guard that returns silently if its root hook is missing; a single `DOMContentLoaded`-safe bootstrap at the bottom (script is `defer`, so the DOM is ready). No `console.*`, no `alert`, no `eval`, no `innerHTML` with dynamic data (use `textContent`).

### 4.1 Mobile nav toggle

- Hooks: `[data-nav]` (root `.nav`), `[data-nav-toggle]`, `[data-nav-menu]`.
- Click toggle: flip `aria-expanded` on toggle; add/remove `is-open` on `[data-nav]`.
- Close (remove `is-open`, `aria-expanded="false"`) when: any `.nav__link` or `.nav__cta` is clicked; `Escape` pressed (and return focus to toggle if the menu was open); viewport grows to 64em+ (`matchMedia('(min-width: 64em)')` change listener); click outside `[data-nav]`.

### 4.2 Active-section nav highlight

- `IntersectionObserver` on every `[data-section]` with `rootMargin: '-45% 0px -50% 0px'`. On intersect, the matching `.nav__link[href="#<id>"]` gets `is-active` and `aria-current="true"`; all others lose both. Hero and sections without a nav link clear all.

### 4.3 Sticky "Book now" bar

- Hooks: `[data-sticky-bar]`, `#hero`, `#inquiry`.
- Visible (`is-visible`) when the hero is NOT intersecting (user scrolled past it) AND `#inquiry` is NOT intersecting. Hidden otherwise. Implemented with one IntersectionObserver over `#hero` and `#inquiry` tracking a small immutable state object `{ heroVisible, inquiryVisible }` (replace the object each update, do not mutate). Also set `aria-hidden` to `"true"` when hidden, remove it when visible. If `IntersectionObserver` is unsupported, add `is-visible` permanently.

### 4.4 Layout preview

- Hooks: `[data-layouts]` root; tabs `[data-layout-tab="2-frame|4-frame"]`; panels `[data-layout-panel="2-frame|4-frame"]`; theme buttons `[data-strip-theme="maroon|blush|cream"]`; caption input `[data-strip-caption-input]`; strips `[data-strip]` with caption `[data-strip-caption]`.
- Tab click: set `aria-selected="true"` + `is-selected` + `tabindex="0"` on the chosen tab and the inverse on others; set `hidden` on non-matching panels, remove it from the matching panel. Arrow Left/Right/Home/End move selection and focus between tabs (roving tabindex).
- Theme button click: set `data-theme` attribute on EVERY `[data-strip]` inside `[data-layouts]` to the button's value; update `aria-pressed` and `is-selected` on the buttons.
- Caption input `input` event: set `textContent` of every `[data-strip-caption]` to the trimmed value, falling back to `"Your moments"` if empty. Input is maxlength 30.
- Never touches the decorative hero strips (they lack `data-strip`).

### 4.5 FAQ accordion

- Hook: `[data-faq]` containing `details.faq__item`. Native `<details>` provides the toggle; JS adds "one open at a time": on a `toggle` event (use capture or per-item listeners) where `details.open` is true, close every other `details` in the same `[data-faq]`. No JS means multiple may stay open (acceptable).

### 4.6 Package CTA prefill

- Hook: `[data-package]` anchors. On click, set `#field-package` value to the attribute value (allowed: `package-1`, `package-2`, `package-3`). Default link navigation to `#inquiry` proceeds; do not call `preventDefault`.

### 4.7 Scroll reveal

- Hook: `[data-reveal]`. Observe with threshold 0.15; add `is-revealed` once and unobserve. If `matchMedia('(prefers-reduced-motion: reduce)').matches` or no IntersectionObserver, add `is-revealed` to all immediately.

### 4.8 Inquiry form validation and submission

- Hooks: `form[data-inquiry-form]` (`#inquiry-form`), `[data-field]` wrappers, `[data-submit]` (`#form-submit`), `#form-status`, `#form-fb-fallback`.
- Validate on `submit` (always `preventDefault` first), and per-field on `blur` (after first touch) and on `input` (to clear an existing error once valid).
- Rules (return the exact message strings):

| Field | Rule | Message |
|---|---|---|
| name | trimmed length 2-80 | "Please enter your name (at least 2 characters)." |
| email | `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` | "Please enter a valid email address." |
| phone | optional; if present `/^[0-9+()\-\s]{7,20}$/` | "Please enter a valid phone number." |
| event-type | non-empty | "Please choose an event type." |
| event-date | optional; if present must be today or later (compare `YYYY-MM-DD` strings in local time) | "Event date can't be in the past." |
| package | optional, no rule | |
| message | trimmed length 10-1000 | "Please tell us a bit more (at least 10 characters)." |

- Invalid state: add `is-invalid` to the `[data-field]` wrapper, set `aria-invalid="true"` on the control, put message into `#error-<key>` via `textContent` and remove its `hidden`. Valid state: reverse all four. On submit with errors: focus the first invalid control, set status to error state with "Please fix the highlighted fields." and stop.
- Honeypot: if `#field-website` has a value, behave as if success (render success, do not send).
- Endpoint guard: if `form.action` contains `YOUR_FORM_ID`, do NOT send. Show error status: "Online sending isn't switched on yet. Please message us on Facebook or call 0994 575 5823." and add `is-highlighted` to `#form-fb-fallback`.
- Send: `fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })`. While pending: `#form-submit` gets `disabled` + `aria-busy="true"`, label text becomes "Sending...", status `data-state="sending"` text "Sending your inquiry...". Restore the original label afterwards (store original in a const, not by reading mutated DOM state).
- Success (`response.ok`): `form.reset()`, clear all errors, status `data-state="success"`, text "Thank you! Your inquiry has been sent. We'll get back to you soon.", move focus to status element (give it `tabindex="-1"` at runtime).
- Failure (non-ok or network error): status `data-state="error"`, text "Sorry, we couldn't send that. Please try again or message us on Facebook.", add `is-highlighted` to `#form-fb-fallback`.
- Status element: remove `hidden` when showing; set `data-state`; always set text via `textContent`.
- State classes on the fallback link CSS must style: `.form__fallback-link.is-highlighted` (button-like emphasis: maroon background, cream text, padding).

### 4.9 Misc

- Footer year is static text; no JS date code.
- `html.js` is set by the head script; JS must not add it.

## 5. Placeholder policy (all engineers)

1. Anything not in the confirmed business facts is placeholder: prices, package names/inclusions, gallery images, FAQ answers, about-copy beyond the tagline, canonical domain, form endpoint, OG image file type.
2. Each placeholder element has `data-placeholder` and a preceding `<!-- PLACEHOLDER: what to replace -->` comment. Prices use the literal string `&#8369; &mdash; TBA`.
3. No testimonials, reviews, client names, "popular" badges, years in business, awards, or numbers of events served.
4. Confirmed facts that may be stated: name, Batangas City (Poblacion), tagline, headline, soft opening, services (bookings, private events, inquiries, pop-ups, reservations), phone, email, handles/URLs, 2-frame (2x2) and 4-frame (2x4) strip layouts, the Facebook post quote.

## 6. Accessibility checklist (all engineers)

- Landmarks: `header`, `nav` (labelled), one `main`, `aside` (labelled), `footer`. One `h1`; each section `h2`; cards `h3`.
- Skip link visible on focus. Every interactive element has a visible `:focus-visible` style. Tap targets at least 44px (use 48px).
- Decorative SVG/art: `aria-hidden="true"`. Meaningful placeholders: `role="img"` + `aria-label`.
- Do not rely on color alone for errors (icon/text prefix). Respect `prefers-reduced-motion`. AA contrast using only the pre-approved pairs in section 1.
- Links with `target="_blank"` carry `rel="noopener noreferrer"`.

## 7. Cross-engineer verification matrix

- Every selector in section 4 must exist in the HTML (HTML engineer) and every `is-*` state used in section 4 must have CSS (CSS engineer).
- Id list that must exist exactly once: `hero about packages layouts gallery events process faq inquiry`, `main`, `site-nav`, `nav-menu`, `tab-2-frame tab-4-frame panel-2-frame panel-4-frame`, `strip-caption-input`, `inquiry-form`, `field-name field-email field-phone field-event-type field-event-date field-package field-message field-website`, `error-name error-email error-phone error-event-type error-event-date error-package error-message`, `form-submit`, `form-status`, `form-fb-fallback`, `sticky-bar`, and `<id>-title` for each section heading.
- Data-attribute list (exhaustive): `data-section`, `data-reveal`, `data-placeholder`, `data-site-header`, `data-nav`, `data-nav-toggle`, `data-nav-menu`, `data-layouts`, `data-layout-tab`, `data-layout-panel`, `data-strip`, `data-theme`, `data-strip-theme`, `data-strip-caption`, `data-strip-caption-input`, `data-gallery`, `data-faq`, `data-package`, `data-inquiry-form`, `data-field`, `data-submit`, `data-state`, `data-sticky-bar`.
