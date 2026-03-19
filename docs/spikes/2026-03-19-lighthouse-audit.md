# Lighthouse Audit Spike

**Date:** 2026-03-19  
**Tool versions:** Lighthouse 13.0.3 · Netlify CLI 24.3.0 · Node 24.14.0  
**Environment:** Netlify Dev (localhost:8889), static site built with `BASE_URL=https://ukuleletuesday.ie`

## How this was run

1. Built the static site (the `BASE_URL` env var defaults to `https://ukuleletuesday.ie` in `build.py`):
   ```
   uv run python build.py
   ```
2. Started Netlify Dev (includes edge functions for `/donate`, `/donate-qr`, `/support-us`):
   ```
   ./node_modules/.bin/netlify dev --port 8889 --no-open
   ```
3. Ran Lighthouse headlessly against four pages:
   ```
   npx lighthouse <url> --chrome-flags="--no-sandbox --headless" \
     --only-categories=performance,accessibility,best-practices,seo \
     --output=json --output-path=<file>
   ```

---

## Summary scores

| Page               | Performance | Accessibility | Best Practices | SEO |
|--------------------|:-----------:|:-------------:|:--------------:|:---:|
| `/` (Home)         | 55          | 80            | 96             | 100 |
| `/concerts/`       | 57          | 89            | 92             | 100 |
| `/songbook/`       | 56          | 81            | 77             | 100 |
| `/tuesday-session/`| 56          | 73            | 96             | 100 |

**Target thresholds** (from `.lighthouserc.json`): Performance ≥ 80 · Accessibility ≥ 90 · Best Practices ≥ 80 · SEO ≥ 80

All pages **fail** the Performance target. Accessibility falls short on most pages. Songbook fails Best Practices. SEO passes on all pages (100) once canonical URLs are absolute.

---

## Performance

### Core Web Vitals (Home page)

| Metric                     | Value    | Rating   |
|----------------------------|----------|----------|
| First Contentful Paint     | 10.7 s   | 🔴 Poor  |
| Largest Contentful Paint   | 13.7 s   | 🔴 Poor  |
| Total Blocking Time        | 100 ms   | 🟡 Needs improvement |
| Cumulative Layout Shift    | 0        | 🟢 Good  |
| Speed Index                | 10.7 s   | 🔴 Poor  |
| Time to Interactive        | 13.7 s   | 🔴 Poor  |

*(Concerts page: FCP 8.4 s, LCP 16.2 s, TBT 0 ms, CLS 0.011)*

The dominant issue is a very high initial paint time caused by a combination of heavy legacy CSS files, unoptimised images, and the absence of any modern asset pipeline.

### Biggest opportunities (home page)

| Opportunity                  | Estimated saving |
|------------------------------|-----------------|
| Reduce unused CSS            | ~991 KiB        |
| Improve image delivery (format/size) | ~435 KiB |
| Reduce unused JavaScript     | ~158 KiB        |
| Minify CSS                   | ~90 KiB         |
| Minify JavaScript            | ~6 KiB          |

### Root causes

**Legacy WordPress CSS is enormous and nearly entirely unused**  
The site still loads the original WordPress theme CSS files unchanged:

| File                                                     | Transfer size | Unused |
|----------------------------------------------------------|:-------------:|:------:|
| `js/js_composer.min.css`                                 | 478 KiB       | 475 KiB|
| `wordpress/wp-content/themes/cesis/style.css`            | 369 KiB       | 358 KiB|
| `wordpress/wp-content/themes/cesis/css/cesis_plugins.css`| 105 KiB       | 102 KiB|
| `css/main.css`                                           | 79 KiB        | 56 KiB |

Combined: ~1 MiB of CSS of which >991 KiB is unused.

**Large unoptimised images**  
- `ukulele-tuesday-showcase-01.jpg` — 617 KiB (JPEG, no WebP/AVIF equivalent served)
- Hero images (~135 KiB + 67 KiB) loaded without `width`/`height` attributes (causes layout instability risk and prevents LCP preloading)

**No resource preloading / render-blocking hints**  
The LCP image is not `<link rel="preload">`'d from the HTML; it is discovered only after the render-blocking CSS chain resolves, costing ~8.4 s to FCP.

**Large font file**  
`tticons.ttf` — 345 KiB custom icon font (WordPress legacy). `font-display: swap` is not set, contributing a further ~10 ms font-block.

---

## Accessibility

### Failures by page

#### Home (`/`) — Score: 80

| Audit                                      | Severity |
|--------------------------------------------|----------|
| Color contrast too low (hero CTA buttons)  | Serious  |
| Links rely on color alone to be distinguishable (partner links in content) | Serious |
| Social-media icon links have no discernible name (`fa fa-instagram`, `fa fa-facebook`, `fa fa-whatsapp`, `fa fa-tripadvisor`, `fa fa-youtube`) | Serious |

#### Concerts (`/concerts/`) — Score: 89

| Audit                                      | Severity |
|--------------------------------------------|----------|
| Color contrast (some text elements)        | Serious  |
| Links rely on color to be distinguishable  | Serious  |
| Social icon links have no accessible name  | Serious  |

#### Songbook (`/songbook/`) — Score: 81

Same issues as above plus the Spotify embed contributes third-party cookies (see Best Practices section).

#### Tuesday Session (`/tuesday-session/`) — Score: 73

| Audit                                      | Severity |
|--------------------------------------------|----------|
| Color contrast (white text on coloured backgrounds) | Serious |
| `<iframe>` (Google Maps) has no `title` attribute | Serious |
| Heading order is not sequential (`<h5>` appears before `<h2>` context) | Moderate |
| Links rely on color to be distinguishable  | Serious  |
| Social icon links have no accessible name  | Serious  |

### Common fix: social icon links

All pages share the same footer with icon-only social links, e.g.:

```html
<a class="fa fa-instagram" href="..." target="_blank"></a>
```

These need `aria-label` attributes:

```html
<a class="fa fa-instagram" href="..." target="_blank" aria-label="Ukulele Tuesday on Instagram"></a>
```

---

## Best Practices

### Home & most pages — Score: 96
One minor issue: browser console errors (see note below).

### Songbook — Score: 77

The embedded Spotify playlist iframe sets **third-party cookies** (`sp_t`, `sp_landing`), which Chrome now flags in the DevTools Issues panel. This drops the score by ~15 points. No direct fix without removing the Spotify embed or using a `data-src` lazy-load approach with a user consent gate.

---

## SEO

All pages score **100**. Canonical URLs are now absolute (`https://ukuleletuesday.ie/…`) because `build.py` defaults `BASE_URL` to `https://ukuleletuesday.ie`, and the base template now prepends `{{ base_url }}` to every page's canonical path.

---

## Browser Console Errors

The calendar Netlify function returns HTTP 500 because `GOOGLE_CALENDAR_API_KEY` is not set in the local dev environment (only a placeholder value was used). This is expected in local dev without real credentials.

```
Failed to load resource: 500 (Internal Server Error)
/.netlify/functions/calendar
Error fetching calendar: Error: HTTP error! status: 500
```

This does not affect production.

---

## Prioritised recommendations

### 🔴 High impact — Performance

1. **Audit and remove unused WordPress CSS** (`js_composer.min.css`, `cesis/style.css`, `cesis_plugins.css`). These three files account for nearly 1 MiB of blocking CSS with ~99% waste. Consider whether they can be removed entirely now that the site is static, or replaced with a minimal hand-crafted stylesheet.

2. **Convert and resize images to modern formats** (WebP/AVIF). The showcase image alone is 617 KiB as JPEG. Add explicit `width` and `height` attributes to all `<img>` tags to eliminate CLS risk and enable browser preloading.

3. **Preload the LCP hero image** with `<link rel="preload" as="image">` to cut several seconds off FCP/LCP.

4. **Add `font-display: swap`** to all `@font-face` rules to eliminate font-block time.

### 🟡 Medium impact — Accessibility

5. **Add `aria-label` to all icon-only links** (social icons, etc.) — affects every page, simple template fix.

6. **Fix colour contrast** on hero CTA buttons and on-image text. Check with a contrast analyser against the site's palette.

7. **Add `title` attribute to the Google Maps `<iframe>`** on the Tuesday Session page.

8. **Fix heading hierarchy** on the Tuesday Session page (headings must descend sequentially).

### 🟢 Low impact — Best Practices / misc

9. **Spotify embed / third-party cookies**: Evaluate whether the embed is still needed; if so, consider lazy-loading it behind a user interaction to avoid the cookie classification issue.

---

## Netlify Deploy Preview vs Local Dev

Lighthouse was also run against the Netlify deploy preview for this PR (`https://69bbf7ca4f9a1a16569864af--ukulele-tuesday-website.netlify.app/`).

### Score comparison

| Page               | Env     | Performance | Accessibility | Best Practices | SEO |
|--------------------|---------|:-----------:|:-------------:|:--------------:|:---:|
| `/` (Home)         | Local   | 55          | 80            | 96             | 100 |
| `/` (Home)         | Preview | 69          | 88            | 100            | 66  |
| `/concerts/`       | Local   | 57          | 89            | 92             | 100 |
| `/concerts/`       | Preview | 55          | 89            | 92             | 66  |
| `/songbook/`       | Local   | 56          | 81            | 77             | 100 |
| `/songbook/`       | Preview | 57          | 81            | 77             | 66  |
| `/tuesday-session/`| Local   | 56          | 73            | 96             | 100 |
| `/tuesday-session/`| Preview | 56          | 73            | 96             | 66  |

### Why SEO is 66 on the deploy preview (not a code bug)

Every Netlify deploy preview automatically receives an `X-Robots-Tag: noindex` HTTP response header. This is an intentional Netlify platform feature: it prevents staging/preview content from being indexed by search engines. Lighthouse's **"Page is blocked from indexing"** audit detects this header and marks the page as failing, which drops the SEO score by ~34 points.

This does **not** affect:
- The production site at `https://ukuleletuesday.ie` (no `noindex` header there)
- Local Lighthouse runs (no such header is emitted by Netlify Dev)

The SEO score of 100 reported from the local run correctly reflects what production would score.

### Why other scores differ between local and preview

- **Performance (home: 55 → 69):** Netlify serves assets from a global CDN with HTTP/2 and edge caching, which significantly reduces network transfer time. The local run uses a single-threaded local server over loopback, giving a pessimistic result.
- **Accessibility (home: 80 → 88):** Minor variation due to Lighthouse's simulated throttling model — both environments expose the same underlying issues (colour contrast, unlabelled icon links). The real score is somewhere in this range.
- **Best Practices (home: 96 → 100):** The calendar function returns HTTP 500 locally (no API key), which generates a console error and slightly penalises the local score. On the preview the function is not configured either but the error handling path differs.

---

## Netlify Dev observations

- Netlify Dev started cleanly and served the static site at `http://localhost:8889` as expected.
- Edge functions (`/donate`, `/donate-qr`, `/support-us`) are loaded and routed via the Deno runtime.
- The Netlify Function `calendar.js` fails with 500 locally (missing API key) — expected without real credentials.
- No issues with the redirects or headers configuration.
