# Itera Website - Implementation Plan

Inputs: `docs/superpowers/specs/2026-10-06-itera-website-design.md`, `docs/build-contract.md` (authoritative for names and markup).

## Phase 1 - Parallel build (three engineers, no shared files)

1. HTML engineer: `index.html`, `assets/favicon.svg`, `assets/og-image.svg`. Follow contract sections 3, 5, 6. All placeholders marked.
2. CSS engineer: `css/styles.css`. Tokens (section 1), utilities/components (2.2), then per-section styles in page order, then responsive and reduced-motion blocks. All `is-*` states from section 4 styled.
3. JS engineer: `js/main.js`. Init functions per section 4.1-4.8, validation table verbatim, constants for thresholds.

## Phase 2 - Integration check

- Run contract section 7 matrix: grep ids and data- hooks in `index.html` against `main.js` selectors and `styles.css` classes. Fix mismatches in the owning file only.
- Grep for `console.`, `http` image URLs, missing `data-placeholder` on price/FAQ/gallery.

## Phase 3 - Verification in browser

- Serve statically (`npx serve` or `python -m http.server`), test 360/768/1280 widths, keyboard pass, nav, sticky bar, layout preview, FAQ, form states (empty, invalid, placeholder endpoint, stubbed success/failure).
- Lighthouse accessibility and SEO; fix findings.

## Phase 4 - Review and hand-off

- Code review pass (quality + accessibility), fix CRITICAL/HIGH.
- Hand-off checklist for the owner: replace Formspree id, canonical and OG domain, OG image as PNG/JPG, packages and prices, gallery images, FAQ answers, about copy; remove placeholder badges.

## Risks

- Contract drift between parallel builders: mitigated by Phase 2 matrix.
- Formspree not configured at launch: guarded by endpoint check and Facebook fallback.
- SVG OG image ignored by some scrapers: flagged for replacement.
