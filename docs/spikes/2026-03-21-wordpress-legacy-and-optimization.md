# WordPress Legacy Removal & Site Optimization Spike

**Date:** 2026-03-21  
**Context:** Follow-up to the [2026-03-19 Lighthouse audit](./2026-03-19-lighthouse-audit.md), which
identified significant performance and accessibility issues rooted in the WordPress migration.

---

## Goal

Analyze the current state of the repository — assets, build pipeline, templates, and CI — and
produce a prioritised, actionable roadmap for completing the evolution from a WordPress export to a
clean, maintainable static site.

---

## Current State

### Repository at a glance

| Item | Value |
|------|-------|
| Pages | 8 HTML pages (built from Jinja2 templates) |
| Dynamic features | Google Calendar, WhatsApp gate, donate redirect (Netlify Functions / Edge Functions) |
| Total git-tracked files | 164 |
| `static/` directory size | 8.1 MB |
| `static/wordpress/` (legacy) | **3.5 MB** |
| `static/assets/images/` | 4.5 MB (39 JPEG, 3 PNG) |
| Custom CSS (`static/css/`) | 28 KB (main.css + custom.css) |
| Custom JS (`static/js/`) | 160 KB (including jQuery) |
| Build time | < 1 second |

### Build pipeline

```
templates/ + static/  ──[build.py (Jinja2)]──▶  public/
                                                   │
                              [optimize-css.mjs]◀──┘ (manual, mutates static/)
```

`build.py` does two things:
1. Copies every file from `static/` verbatim to `public/`
2. Renders Jinja2 templates from `templates/` into `public/`

`optimize-css.mjs` (PurgeCSS) is a separate manual step run with `pnpm optimize-css`. It **mutates
the source CSS files in `static/`** rather than writing to `public/`, which means the optimized
output is committed into the repository. This is an unusual but functional approach — it means the
build itself is always fast, but the `static/` CSS files are not the raw canonical source.

### What is still WordPress

The site still carries substantial WordPress artifacts that were never cleaned up after the
migration:

#### Legacy CSS — ~1 MiB loaded, ~991 KiB unused

| File (in `static/`) | Size on disk | Notes |
|---|---|---|
| `wordpress/wp-content/themes/cesis/style.css` | 36 KB (post-purge) | Main Cesis theme — ~99% unused |
| `wordpress/wp-content/themes/cesis/css/cesis_plugins.css` | 8 KB (post-purge) | Bootstrap-derived plugins CSS |
| `wordpress/wp-content/themes/cesis/css/cesis_media_queries.css` | 4 KB | Media queries |
| `wordpress/wp-content/themes/cesis/includes/fonts/cesis_icons/cesis_icons.css` | 4 KB | Icon font loader |
| `js/js_composer.min.css` | 5 KB (post-purge) | WP Visual Composer CSS — lodged in `js/` |

> **Note:** these are _post-PurgeCSS_ sizes (already committed after a previous `pnpm
> optimize-css` run). Lighthouse still flags ~991 KiB of unused CSS on the live site, suggesting
> the purge run may be out of date or the purged files have not been deployed.

#### Legacy JS — 9 files, ~204 KB unminified

All loaded unconditionally on every page, via `<script>` tags in `_layouts/base.html`:

| File | Size | Purpose |
|---|---|---|
| `cesis_collapse.js` | 8 KB | Bootstrap collapse (modal, accordion) |
| `cesis_countup.js` | 8 KB | Animated number counter |
| `cesis_easing.js` | 8 KB | jQuery easing curves |
| `cesis_fittext.js` | 4 KB | Responsive font sizing |
| `scrollmagic.js` | 96 KB | Scroll-triggered animations |
| `cesis_transition.js` | 4 KB | Page transition effects |
| `isotope.js` | 48 KB | Masonry / filtering layout |
| `waypoints.js` | 12 KB | Scroll waypoint triggers |
| `jquery.min.js` | 88 KB | jQuery (loaded for above plugins) |
| `jquery-migrate.min.js` | 16 KB | jQuery migration shim |
| `jquery/ui/effect.min.js` | 12 KB | jQuery UI effects |

None of the templates contain markup or calls that would actually trigger isotope, scrollmagic,
waypoints, countup, fittext, or easing. The `cesis_collapse.js` and `cesis_transition.js` may be
providing minor UI behaviour, but this has not been audited. The `mobile-menu.js` custom script
(1.2 KB) currently depends on jQuery; eliminating jQuery would require a small rewrite.

#### Legacy fonts — ~1.6 MB on disk (unused)

| Path | Files | Total size |
|---|---|---|
| `cesis_icons/fonts/` | tticons.woff, .eot, .ttf (no .woff2) | ~1 MB |
| `lg/` | lg.ttf, .woff (lightGallery) | 8 KB |
| `admin/redux-extensions/.../fontawesome/` | .woff2, .ttf, .eot, .woff | ~500 KB |

The FontAwesome fonts in `admin/` are never referenced by any template or CSS selector in use —
they were part of the WordPress admin area. The Cesis icon font (`tticons`) is referenced by
`cesis_icons.css` and is used by the social icon links in the header/footer (`<a class="fa
fa-instagram">`).

#### Legacy images — 4 files

| File | Notes |
|---|---|
| `includes/images/loading.gif` | WordPress lightGallery spinner |
| `includes/images/video-play.png` | WordPress video overlay |
| `includes/images/vimeo-play.png` | WordPress Vimeo overlay |
| `includes/images/youtube-play.png` | WordPress YouTube overlay |

#### Body class — WordPress markup leaking into HTML

`_layouts/base.html` line 100 still carries a WordPress-generated `<body>` class string:

```html
<body class="wp-singular page-template-default page page-id-247 wp-theme-cesis
             wp-child-theme-cesis_child_theme header_sticky cesis_menu_use_dda
             cesis_has_header no-touch cesis_parent_highlight cesis_lightbox_lg
             wpb-js-composer js-comp-ver-6.9.0 vc_responsive">
```

This adds no functionality and exposes implementation details to public HTML.

#### External Google Fonts CDN dependency

```html
<link href="//fonts.googleapis.com" rel="dns-prefetch">
<link href="//fonts.gstatic.com" rel="preconnect" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700
             &family=Pattaya:wght@400&family=Quicksand:wght@500;600;700
             &family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
```

Four font families are requested (Poppins, Pattaya, Quicksand, Roboto) across multiple weights.
This is a render-blocking external request added latency to FCP. Only a subset of these families
and weights are likely used by the current custom CSS.

---

## Problem Areas

### P1 — Performance (directly blocks Lighthouse targets)

**a) Unused CSS (~991 KiB)**  
Lighthouse reports ~991 KiB of unused CSS. The `optimize-css.mjs` PurgeCSS script exists and works,
but:
- It is a **manual** step (not wired into CI build)
- It **mutates `static/` source files** rather than producing build-time output — whoever last ran
  it determines what ships
- If any template changes are made without re-running the script, the shipped CSS drifts from the
  HTML it serves

The WordPress CSS files (`cesis/style.css`, `cesis_plugins.css`, `js_composer.min.css`) are still
present as real files in `static/` with their full WordPress-era content, even though they were
previously purged down to a few KB. This implies either a git revert or a new clone since the last
purge run.

**b) Images served as JPEG with no modern formats**  
Every content image is a JPEG. Lighthouse estimates ~435–617 KiB savings available via WebP/AVIF.
Images also lack `width` and `height` attributes on `<img>` tags, preventing LCP preloading and
creating CLS risk.

**c) No LCP preload**  
The hero/banner image is the Largest Contentful Paint element but is not `<link rel="preload">`'d.
It is discovered only after the render-blocking CSS chain resolves (~8–10 s).

**d) WordPress JS loaded unconditionally (~204 KB, 9 requests)**  
scrollmagic.js alone is 96 KB. None of these libraries appear to be doing anything on the current
pages.

**e) jQuery still required (88 KB + 16 KB migrate)**  
The only custom code that uses jQuery is `mobile-menu.js`. All WordPress JS plugins depend on it.
Eliminating the WordPress JS would make jQuery removable too.

**f) Mixpanel (~811 KiB, production only)**  
`mixpanel.module.js` is loaded from CDN on production (`ENABLE_ANALYTICS=true`). Lighthouse flags
it as the single largest unused-JS payload. The module bundle is loaded at page load and blocks
time-to-interactive. Lazy loading or switching to the slim Mixpanel build would cut this
substantially.

**g) Google Fonts render-blocking (4 families, multiple weights)**  
`display=swap` is already set, but the request still adds latency. Subsetting or self-hosting the
fonts would eliminate the external dependency.

---

### P2 — Accessibility (fails Lighthouse target of ≥90 on all pages)

| Issue | Pages affected | Fix |
|---|---|---|
| Social icon links have no accessible name (`fa fa-instagram`, etc.) | All pages (footer + header) | Add `aria-label` to each `<a>` |
| Hero CTA buttons: insufficient colour contrast | Home | Check contrast ratio, adjust colours |
| Link colour not distinguishable without colour | All pages | Add underline or other non-colour indicator |
| Google Maps `<iframe>` missing `title` | Tuesday Session | Add `title="Map"` to `<iframe>` |
| Heading hierarchy skip (`<h5>` before `<h2>`) | Tuesday Session | Fix heading structure |

All accessibility issues are template-level fixes (HTML changes in `templates/`) — no new
dependencies needed.

---

### P3 — Maintainability & developer experience

**a) `static/wordpress/` directory is confusing and bloated**  
New contributors see a 3.5 MB WordPress theme directory and have no clear picture of what is
actually in use vs. legacy. Documenting (or eliminating) this is important for future maintainers.

**b) `optimize-css.mjs` mutates committed source files**  
This is unintuitive. Re-cloning the repo or reverting `static/` will undo any previous PurgeCSS
run. A better approach is to run PurgeCSS at build time and write the output to `public/` only,
keeping `static/` as the canonical unmodified source.

**c) No asset fingerprinting / cache-busting**  
CSS and JS are referenced with paths like `/css/main.css` (except `custom.css?v=2`). The Netlify
`Cache-Control` headers are set to `max-age=300` (5 minutes), which is intentionally short to allow
updates. Long-lived cache with content-hash filenames (e.g. `main.abc123.css`) would be the
standard approach for a build pipeline.

**d) WordPress class names in templates**  
`cesis_container`, `cesis_col-lg-4`, `cesis_menu_button`, etc. are used extensively in the HTML
templates but are defined in the WordPress theme CSS. If the goal is to remove `cesis/style.css`,
these class names would need to be replaced with equivalents in `main.css` / `custom.css` first.

**e) `js_composer.min.css` is in the `js/` directory**  
This is a CSS file (`static/js/js_composer.min.css`). It was presumably placed here because that
is where WordPress originally served it from. It should be in `static/css/` for clarity, or removed
entirely once its rules are confirmed unused.

**f) No image pipeline**  
Images are committed as-is (WordPress-exported JPEGs with their original filenames including
WordPress image-size suffixes: `-300x200`, `-500x334`, `-768x512`). There is no build-time
conversion, resizing, or optimization. A script or CI step to produce WebP/AVIF variants would
significantly reduce image payload.

**g) Google Fonts CDN loads 4 families**  
`Poppins`, `Pattaya`, `Quicksand`, `Roboto` are all loaded. An audit of which families are actually
referenced in `main.css` / `custom.css` may reveal that not all are needed. Self-hosting the
used subsets would eliminate the external blocking request.

---

## What Can Be Safely Removed Right Now

The following have no references in any template, JS, or CSS file that is actually in use:

| Asset | Reason safe to remove |
|---|---|
| `static/wordpress/.../admin/` | FontAwesome fonts for WP admin panel — never served to visitors |
| `static/wordpress/.../includes/images/` | WordPress lightGallery / video overlay images |
| `static/wordpress/.../includes/fonts/lg/` | lightGallery font (no lightGallery in use) |
| WordPress JS: `isotope.js`, `scrollmagic.js`, `waypoints.js`, `cesis_countup.js`, `cesis_easing.js`, `cesis_fittext.js`, `cesis_transition.js` | No template markup triggers these |
| `jquery-migrate.min.js` | Only needed for jQuery 1.x → 3.x upgrades; not needed if jQuery is also removed |
| `jquery/ui/effect.min.js` | jQuery UI effects — not referenced in templates or custom JS |

The following **require a code change** before they can be removed:

| Asset | Blocker |
|---|---|
| `cesis/style.css`, `cesis_plugins.css`, `cesis_media_queries.css` | ~116 CSS class names from these files are used in HTML templates (e.g. `cesis_container`, `cesis_col-*`). These rules must be extracted to `main.css` / `custom.css` first. |
| `cesis_icons.css` + `tticons.*` fonts | Social icon links use `fa fa-instagram` etc., which are rendered by the Cesis icon font. Must switch to inline SVGs or Font Awesome 6 Free first. |
| `cesis_collapse.js` | Used for hamburger menu collapse (also partially served by `mobile-menu.js`). Needs audit. |
| `jquery.min.js` | `mobile-menu.js` calls `$(...)`. Rewrite in vanilla JS first. |
| `js_composer.min.css` | Purged version already tiny (5 KB); may be fully removable after final audit. |

---

## Recommended Roadmap

### Phase 1 — Quick wins (low risk, high impact)

These can be done independently as small PRs:

1. **Fix accessibility issues in templates** (1–2 hours)  
   - Add `aria-label` to all icon-only social links in `_partials/header.html` and
     `_partials/footer.html`
   - Add `title` attribute to the Google Maps `<iframe>` in `tuesday-session/index.html`
   - Fix heading hierarchy on Tuesday Session page
   - Fix colour contrast on hero CTA buttons  
   *Expected gain: Accessibility score 73–89 → ≥90 on all pages*

2. **Add `width`/`height` to all `<img>` tags** (1 hour)  
   Prevents CLS and enables LCP preload.

3. **Add `<link rel="preload">` for the LCP hero images** (30 minutes)  
   Put a preload hint in the `<head>` for the above-the-fold image on each page that has a hero
   banner.  
   *Expected gain: FCP/LCP improvement of 3–5 s*

4. **Add `aria-label` to iframe** (already covered in #1)

5. **Add `font-display: swap`** to all `@font-face` rules in `cesis_icons.css` and `main.css`
   (15 minutes)

6. **Clean WordPress body class** (15 minutes)  
   Replace the 200-character WordPress class string on `<body>` with just the page-relevant classes
   actually needed (`header_sticky`, etc.).

7. **Remove clearly unused WordPress admin and plugin assets** (30 minutes)  
   Delete `static/wordpress/.../admin/`, `includes/images/`, `includes/fonts/lg/` as they are
   never referenced.

8. **Audit and remove unused WordPress JS** (1–2 hours)  
   Remove `isotope.js`, `scrollmagic.js`, `waypoints.js`, `cesis_countup.js`, `cesis_easing.js`,
   `cesis_fittext.js`, `cesis_transition.js` from `static/` and their `<script>` tags from
   `_layouts/base.html`. Remove `jquery-migrate.min.js` and `jquery/ui/effect.min.js`.  
   *Expected gain: ~170 KB less JS per page, fewer HTTP requests*

---

### Phase 2 — CSS consolidation (medium effort, high impact)

9. **Audit which Cesis CSS rules are actually used** (2–4 hours)  
   The `optimize-css.mjs` PurgeCSS output shows the post-purge content. Review what remains in
   `cesis/style.css` after purging and move any needed rules into `main.css` / `custom.css` with
   clear, meaningful class names. This is the prerequisite for deleting `static/wordpress/`.

10. **Replace Cesis icon font with inline SVGs or Font Awesome 6 Free** (2–3 hours)  
    The five social icon links (Instagram, Facebook, WhatsApp, TripAdvisor, YouTube) are the only
    usage of the Cesis icon font (`tticons`). Switching to inline SVGs or a CDN-hosted Font Awesome
    6 (which is MIT licensed, unlike the older WP-bundled version) removes 1 MB of font files and
    gives each icon a proper accessible label.

11. **Move CSS optimization into the build** (1–2 hours)  
    Rather than mutating `static/` source files, run PurgeCSS as a build step that writes to
    `public/` only. Add it to `build.py` or as a post-build `package.json` script wired into CI.
    Keep the canonical un-purged CSS in `static/` so re-cloning always gives a predictable state.
    Remove the committed PurgeCSS output from `static/`.

12. **Audit and trim Google Fonts request** (1 hour)  
    Check which of Poppins, Pattaya, Quicksand, Roboto, and which weights, are actually referenced
    in `main.css`/`custom.css`. Remove unused families and weights from the `fonts.googleapis.com`
    request, or self-host just the used glyphs.  
    *Expected gain: Reduced external blocking requests, faster FCP*

---

### Phase 3 — Image pipeline (medium effort, high impact)

13. **Convert images to WebP/AVIF** (2–4 hours)  
    Add a build-time step (e.g. `sharp` npm package, or `squoosh-cli`) that converts every image in
    `static/assets/images/` to WebP and generates an AVIF variant. Update `<img>` tags to use
    `<picture>` with appropriate `<source>` elements, keeping JPEG as fallback.  
    *Expected gain: ~435–617 KiB per page with hero images*

14. **Remove WordPress-style responsive image duplicates** (1 hour)  
    Each photo is stored in four sizes (`-300x200`, `-500x334`, `-768x512`, full). These were
    generated by WordPress's media library and are already referenced in templates with appropriate
    `srcset`. However, the sizes and format strategy should be re-evaluated — the naming convention
    can be simplified and WebP conversion can replace the JPEG variants.

15. **Lazy-load below-the-fold images** (1 hour)  
    Add `loading="lazy"` to all images that are not the LCP element.

---

### Phase 4 — JavaScript modernization (medium–high effort)

16. **Rewrite `mobile-menu.js` in vanilla JS** (1–2 hours)  
    This is a small script (1.2 KB). Removing the jQuery dependency makes it possible to drop
    `jquery.min.js` (88 KB) entirely.

17. **Remove jQuery after Phase 2 WordPress JS cleanup** (already covered above)  
    Once `cesis_collapse.js` is removed and `mobile-menu.js` is rewritten, jQuery can be dropped.
    *Expected gain: 88–104 KB less JS per page (jQuery + migrate), 2 fewer HTTP requests*

18. **Lazy-load or replace Mixpanel** (1–2 hours, production only)  
    Options in order of preference:
    - Evaluate whether Mixpanel data is being actively used; if not, remove it
    - Switch to the Mixpanel slim build (much smaller)
    - Lazy-load `mixpanel.module.js` on `requestIdleCallback` or after first user interaction
    *Expected gain: Up to 811 KiB deferred on production*

---

### Phase 5 — Build pipeline improvements (lower priority)

19. **Add cache-busting hashes to CSS/JS filenames** (2–3 hours)  
    Update `build.py` to fingerprint CSS/JS assets and rewrite `<link>`/`<script>` `src`/`href`
    attributes. This would allow long-lived `Cache-Control: immutable` headers for CSS/JS, reducing
    repeat-visit load times.

20. **Tighten Lighthouse CI thresholds** (15 minutes)  
    `.lighthouserc.json` assertions are currently `warn` only. After Phase 1 and 2 fixes, change
    Performance to `error` at ≥80, Accessibility to `error` at ≥90 to enforce regressions in CI.

21. **Evaluate Spotify embed / third-party cookies** (1 hour)  
    The Spotify embed on the Songbook page sets third-party cookies (`sp_t`, `sp_landing`) that
    Chrome DevTools flags. Consider lazy-loading the embed (load iframe only on user click) to
    avoid the cookie issue affecting Best Practices score.

---

## Priority Matrix

| # | Task | Effort | Impact | Risk |
|---|---|---|---|---|
| 1 | Fix accessibility issues (aria-label, iframe title, contrast) | Low | High (A11y score ≥90) | None |
| 2 | Add width/height + preload for LCP images | Low | High (FCP/LCP) | Low |
| 8 | Remove unused WordPress JS (7 scripts) | Low | High (–170 KB JS) | Low |
| 7 | Remove WordPress admin/plugin assets (never served) | Low | Medium (–500 KB repo) | None |
| 5 | Add `font-display: swap` | Low | Low | None |
| 6 | Clean WordPress body class | Low | Low | None |
| 10 | Replace icon font with inline SVGs | Medium | High (–1 MB fonts) | Low |
| 9 | Audit & migrate needed Cesis CSS rules | Medium | High (enables WP removal) | Medium |
| 11 | Move CSS optimization into build pipeline | Medium | Medium (maintainability) | Medium |
| 12 | Audit / trim Google Fonts | Low | Medium (FCP) | Low |
| 13 | Convert images to WebP/AVIF | Medium | High (–435+ KiB images) | Low |
| 15 | Add `loading="lazy"` to below-fold images | Low | Medium | None |
| 16 | Rewrite `mobile-menu.js` in vanilla JS | Medium | Medium (enables jQuery removal) | Low |
| 17 | Remove jQuery | Low (after 16) | High (–104 KB JS) | Low |
| 18 | Lazy-load / replace Mixpanel | Medium | High (–811 KB prod JS) | Low |
| 19 | Asset fingerprinting / long cache | High | Medium (repeat visits) | Medium |
| 20 | Tighten Lighthouse CI thresholds | Low | Medium (regression prevention) | None |
| 21 | Lazy-load Spotify embed | Low | Low (Best Practices) | None |

---

## Expected Outcome After All Phases

Based on current Lighthouse baseline (Performance 55–57, Accessibility 73–89) and the Lighthouse
audit findings:

| Metric | Current | Expected after all phases |
|---|---|---|
| Performance | 55–57 | ≥80 (target met) |
| Accessibility | 73–89 | ≥90 on all pages |
| Best Practices | 77–96 | ≥90 on all pages |
| SEO | 100 | 100 (maintained) |
| Page weight (CSS) | ~1 MiB | < 20 KB |
| Page weight (JS, excl. Mixpanel) | ~375 KB | < 15 KB |
| Image payload (per page) | 617–1,200 KB | < 200 KB (WebP) |

---

## Suggested Next Steps

1. **Create a GitHub Project board** (or use issues + labels) to track each phase as a set of
   discrete, reviewable PRs. Each task above is small enough to be a single PR.

2. **Start with Phase 1** — all items have no dependencies and can land immediately. The
   accessibility fixes alone will unblock the Lighthouse CI target of ≥90 for every page.

3. **Spike the CSS consolidation** (item 9) before committing to Phase 2, because the scope of
   Cesis CSS usage in the templates is the biggest unknown. A quick `grep -r "cesis_" templates/`
   audit will surface the full list of class names that need to be retained in `main.css`.

4. **Consider whether WordPress CSS classes should be renamed** as part of Phase 2. Using `cesis_`
   prefixed class names in a non-WordPress project makes the HTML harder to understand. Renaming
   to semantic names (e.g. `site-container`, `col-4`) during the CSS migration would improve
   long-term maintainability.
