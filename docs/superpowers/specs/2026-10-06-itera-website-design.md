# Itera Collectives Photobooth - Website Design Spec

Date: 2026-10-06. Status: approved design, ready to build. Companion: `docs/build-contract.md` (exact names and markup).

## 1. Purpose

A fast, elegant, mobile-first marketing and booking site for Itera Collectives - Photobooth (Batangas City, Philippines), currently in soft opening. Goals: (1) communicate the "Elevated Photobooth Experience" brand, (2) let visitors preview strip layouts, (3) convert visitors into inquiries by form, phone, email or Facebook message.

## 2. Confirmed facts vs assumptions

Confirmed (from the business Facebook page): name; Batangas City (Poblacion); tagline "Your moments, beautifully captured - over and over again"; banner headline "Elevated Photobooth Experience"; soft opening; services (bookings, private events, inquiries, pop-ups, reservations); phone 0994 575 5823; email iteraphotobooth@gmail.com; handle iteracollectives.ph on Facebook, Instagram, TikTok (@iteracollectives.ph); 2-frame (2x2) and 4-frame (2x4) strip layouts; post "A little color, a little bloom, and a lot worth remembering"; palette maroon ~#8B1A1F, cream ~#FBF4F1, blush ~#E8CFCF.

Assumptions (all PLACEHOLDER and visibly marked): package names, prices, inclusions; gallery images; FAQ answers; descriptive copy beyond confirmed facts; canonical domain; Formspree form id; OG image format. No fabricated reviews, client names, counts, awards or policies.

Other assumptions: English-only; single page; hosted on any static host; the owner will edit HTML directly.

## 3. Sections (single scrolling page, sticky nav)

1. `hero` - headline, tagline, two CTAs (Book your date, See strip layouts), location and soft-opening line, decorative CSS strips.
2. `about` - short draft copy (placeholder), the Facebook post as a pull quote, three service points.
3. `packages` - three placeholder tiers (name TBA, price "PHP - TBA", inclusions TBA), each CTA prefills the inquiry form.
4. `layouts` - interactive preview of 2-frame (2x2) and 4-frame (2x4) strips built in CSS; tabs, three color themes, live caption.
5. `gallery` - 8-tile placeholder grid in blush tones with inline SVG glyphs.
6. `events` - Weddings, Debuts, Birthdays, Corporate, Pop-ups.
7. `process` - Inquire, Confirm, Set up, Enjoy.
8. `faq` - five questions, `<details>` accordion, placeholder answers.
9. `inquiry` - validated form (Formspree-style endpoint), contact details, socials, "Message us on Facebook" fallback.
10. `footer` - brand, links, tagline, legal line.

Cross-cutting: mobile sticky "Book now" bar (appears after hero, hides at inquiry).

## 4. Visual language

- Palette: maroon #8B1A1F primary, maroon-dark #6B1217, cream #FBF4F1 page, blush #E8CFCF and blush-soft #F4E6E3 surfaces, ink #2A1416 text.
- Type: Cormorant Garamond for display and italic accents (echoes the script "Collectives"); Montserrat wide-tracked uppercase for eyebrows, nav, buttons, labels ("PHOTOBOOTH" feel). Wordmark: "ITERA" (with macron) over script "Collectives".
- Shapes: soft radii (12px cards, pill buttons), thin maroon outlines (matches the banner's maroon-outline strips), gentle shadows, generous whitespace.
- Motifs: photo strips as the recurring graphic; blush radial washes; italic serif accent word per heading.
- Motion: subtle reveal on scroll, nav/sticky transitions; all disabled under prefers-reduced-motion.
- Imagery: none external; CSS and inline SVG only.

## 5. Technology

Static HTML, CSS, vanilla JS. No build step, no frameworks, no npm. Files: `index.html`, `css/styles.css`, `js/main.js`, `assets/favicon.svg`, `assets/og-image.svg`. Google Fonts only external dependency. Mobile-first CSS with custom properties; BEM naming; JS as a single guarded IIFE with immutable-style state, no console output. SEO: title, meta description, canonical (placeholder), Open Graph and Twitter tags, LocalBusiness JSON-LD (no ratings, price range or hours). Accessibility: landmarks, skip link, focus-visible styles, reduced motion, AA contrast, labelled form controls, aria-live status.

## 6. Non-goals

No CMS, backend, payments, online calendar or availability checking, multi-page routing, blog, analytics or cookie banner, real photography, i18n, or live social feeds. No claims beyond confirmed facts.

## 7. Testing and verification

- Static checks: HTML validates (no duplicate ids; every id/data hook in contract section 7 present); no `console.` in JS; no external image URLs; all placeholders carry `data-placeholder` plus comment.
- Manual/browser (Chrome devtools): widths 360, 768, 1280 with no horizontal scroll; nav toggle open/close/Escape; active link highlight; sticky bar shows after hero and hides at inquiry; tabs, themes and caption update strips; FAQ one-open behavior; form: empty submit shows all required errors and focuses first, valid submit with placeholder endpoint shows the "not switched on" message with highlighted Facebook link, honeypot path, success and failure paths (stub fetch).
- Accessibility: keyboard-only pass, Lighthouse accessibility and SEO at or above 95, contrast spot checks, reduced-motion emulation.
- Cross-check: JS selectors versus HTML (contract section 7 matrix).
