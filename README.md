# Ukulele Tuesday Website

This project contains the source code and build process for the [Ukulele Tuesday website](https://www.ukuleletuesday.ie/), published on Netlify.

## Purpose

Ukulele Tuesday runs a free weekly play-along session in Dublin and performs as a band at concerts and festivals. The site follows Gerry McGovern's [Top Tasks](https://gerrymcgovern.com/top-tasks/) method: it is built around the tasks visitors come to do, ranked by how often they come up and what each is worth to us. A year of Search Console data and our own experience of running the group put five at the top: come to a session, use the songbook, book us, support us, join the community. The evidence and reasoning are in the [top-tasks review](docs/spikes/2026-09-27-top-tasks-review.md).

Do:

- Give every page and menu item one of those tasks to serve; anything else (story, governance, press) goes on an About page ([what belongs there](https://www.nngroup.com/articles/about-us-information-on-websites/)) or into the footer.
- Weigh value as well as frequency: event organisers are a tiny share of visits and by far the most valuable, so their needs count more than their numbers.
- Make each top task reachable in one tap from the homepage, and answer the first-timer's questions (when, where, is it free, is it on this week) in its first screen, as facts rather than prose.
- Write titles, headings, menu labels and meta descriptions in the words people search for; keep the playful voice for body copy.
- Put proof next to the decision it supports ([social proof](https://www.nngroup.com/videos/social-proof-ux/)), FAQs and policies likewise, and use the footer for what every page needs: contact, Code of Conduct, WhatsApp, session time and venue.
- Design for a phone in the pub first; organisers, on desktop, are the exception.
- Judge a change by whether more visitors complete their task, not by page views.

Don't:

- Add a page, section or menu item because the content exists.
- Greet or be clever where a visitor needs a literal answer: the H1, a page title, a button label.

## Design system

[`docs/design-system/`](docs/design-system/README.md) describes how the site should look and sound: the voice and copy rules, colour, type, spacing, the eight components, and the decisions that still need someone to make them. It describes the target, not the current templates: where a template disagrees, the design system wins. Read it before changing styles, copy or markup, and check its [Retired](docs/design-system/retired.md) list before copying anything from an existing page.

## Overview

The initial version of this site was created on WordPress.

After being exported from its WordPress install, it is now maintained as a static site built with [Jinja2](https://pypi.org/project/Jinja2/) for better performance, security, and cost-effectiveness. The WordPress-style URL structure is kept for SEO, and image files keep their WordPress names, flattened out of the date hierarchy. The legacy theme and plugin files were removed in [#147](https://github.com/UkuleleTuesday/website/pull/147); nothing under `static/` comes from WordPress any more.

The rare dynamic parts of the site are handled via:
* Netlify Forms for forms
* Netlify functions/edge functions for everything else.

The songbook itself is a separate site, `songbooks.ukuleletuesday.ie`, built weekly from [UkuleleTuesday/songbooks](https://github.com/UkuleleTuesday/songbooks); this site only links to it.

## Prerequisites

- Python 3.12+ with [uv](https://github.com/astral-sh/uv) package manager
- Node + `pnpm` to run the regression test suite.

## Usage

### Building the Site

To build the static site from the Jinja templates:

```bash
uv run python build.py
```

This will generate the static HTML files in the `public/` directory.

* Files in `./templates/` are processed as jinja2 templates before being copied to `public/`
* Files in `./static/` are copied as is to `public/`

### Configuration

#### Promo Banner

The site supports an optional promotional banner that appears at the very top of every page. This banner's content is controlled by the file `templates/_partials/promo_banner.html`.

**To display a promo banner:**

Edit `templates/_partials/promo_banner.html` and add your desired HTML content.

**To hide the banner:**

Remove all content from `templates/_partials/promo_banner.html`, or comment it out.

**Styling:** The banner uses the `.promo-bar` CSS class defined in `static/css/custom.css` with the site's maroon color scheme (#66023c).

#### Events Calendar

The homepage features a dynamic calendar that displays upcoming events like our regular Tuesday play-along sessions, concerts, and festival appearances. Events are fetched from the "Ukulele Tuesday Public Events" Google Calendar using the Google Calendar API.

To add or edit events, Executive Committee members have been granted edit access to the "Ukulele Tuesday Public Events" Google Calendar. Events are automatically displayed on the homepage once added to the calendar.

**Enabling/disabling the calendar:**

The calendar is enabled by default. To disable it (e.g. for local development where the Netlify function is not available), set the `ENABLE_CALENDAR` environment variable to `false` before building:

```bash
ENABLE_CALENDAR=false uv run python build.py
```

When disabled, the calendar section and its JavaScript are completely omitted from the built HTML, so no calendar-related errors will appear in the browser console.

**Technical details:**
- The calendar data is fetched via a Netlify function (`netlify/functions/calendar.js`) which uses the Google Calendar API with an API key stored in environment variables
- The API request uses field filtering to reduce payload size by ~80-85% (from ~15KB to ~2-3KB for 10 events), requesting only the fields actually used by the frontend
- The function returns up to 50 upcoming events; the JavaScript client (`static/js/calendar.js`) lists the first 10 under "All Upcoming Events" and uses the rest to find the next gig
- The calendar automatically updates as new events are added to the Google Calendar (with a 2-minute cache)
- The `GOOGLE_CALENDAR_API_KEY` environment variable must be set in Netlify (or GitHub repository secrets) for the calendar to work
- **Event descriptions can be viewed by clicking/tapping on events** - descriptions are initially hidden and toggle on/off when the event is clicked or activated with keyboard (Enter/Space)
- Events with descriptions display a cursor pointer and support keyboard navigation for accessibility

**Event Classification:**
Events are automatically color-coded by type using hashtags in the event description or title:
- **#jam** or **#playalong** → Play-Along (orange border)
- **#concert** → Concert (maroon border)
- anything else → Other (teal border), for example community group practices

To classify an event, add the appropriate hashtag to the event description when creating or editing events in Google Calendar.

**Next session and next gig:**
The same calendar data answers "is it on this Tuesday?" and "where can I see you next?" without scrolling ([#187](https://github.com/UkuleleTuesday/website/issues/187)):
- A pill under the homepage heading and a card at the top of "Play Along With Us" show the next routine session. A routine session is a play-along (`#jam` or `#playalong`) whose location mentions the Stag's Head. The wording follows the calendar: "Tonight from 8pm", "On now until 10:30pm", "Next session: Tuesday 6 October, 8pm", or "No session this Tuesday" when the calendar has no session on the coming Tuesday. **To cancel a week, either delete that week's occurrence in Google Calendar, or keep it and put "Cancelled" (or "No session") in its title, or add `#cancelled` to its description.** The site then says so and gives the next date. A gig marked the same way is skipped for the "Next gig" line, and any cancelled event is marked as cancelled in the page's structured data so search results don't advertise it.
- A "Next gig" line in "See Us Live" shows the next `#concert` event: its date, title and the first part of its location. It stays hidden when no concert is in the calendar.
- Without the calendar (disabled, or the function failing) the slots keep their built-in "Every Tuesday from 8pm" text.
- Times are shown in Dublin time whatever the visitor's device is set to.

To add or edit events, Executive Committee members have been granted edit access to the "Ukulele Tuesday Public Events" Google Calendar. Event colour-coding is not supported, since it is visible only to those logged into
the Ukulele Tuesday Google account (see https://github.com/UkuleleTuesday/website/issues/107).

#### Analytics (Mixpanel)

Mixpanel is only included in production builds (`ENABLE_ANALYTICS=true`, set by CI for deploys from `main`). It is the standard integration: Mixpanel's loader snippet in `static/js/mixpanel.js` (an unmodified copy of `mixpanel-browser/dist/mixpanel-jslib-snippet.min.js`) followed by `mixpanel.init(...)` with the project token and options, plus the two proxy settings Mixpanel documents, so the browser never talks to Mixpanel's own domains (tracking protection and ad blockers block them, which logged a CORS error on every page, see [#125](https://github.com/UkuleleTuesday/website/issues/125)):

- `MIXPANEL_CUSTOM_LIB_URL = '/mp-lib/mixpanel-2-latest.min.js'`: the SDK is fetched from our origin; `netlify.toml` proxies `/mp-lib/*` to `https://cdn.mxpnl.com/libs/`.
- `api_host: '/mp'`: events are sent to our origin; `netlify.toml` proxies `/mp/*` to Mixpanel's EU ingestion API (`https://api-eu.mixpanel.com`).

The init also sets `disable_persistence: true`, on purpose: Mixpanel then stores nothing on the visitor's device, so the site needs no cookie consent banner. The cost is that it cannot follow a visitor from one page to the next: page views and clicks are counted, but there are no sessions, journeys or funnels.

Neither proxy exists on the local static server, so `tests/analytics.spec.ts` and `tests/console-errors.spec.ts` stub them and serve the SDK from the `mixpanel-browser` dev dependency (its only use). To upgrade the snippet, copy `node_modules/mixpanel-browser/dist/mixpanel-jslib-snippet.min.js` over the snippet part of `static/js/mixpanel.js`.

#### YouTube embeds

YouTube videos are embedded with [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed) (`<lite-youtube>`, v0.3.4, copied unmodified to `static/vendor/lite-youtube-embed/` together with its licence). The page shows only the video's poster and a play button; the real player is created on the privacy-enhanced `youtube-nocookie.com` domain when the visitor presses play. A full YouTube player costs about 1 MB of third-party JavaScript per video and logs a stream of console warnings before anyone has pressed play ([#125](https://github.com/UkuleleTuesday/website/issues/125)). Use the `youtube_video(video_id, title)` macro from `templates/_macros/video.html` and include the library's stylesheet and script on the page (see the `extra_head` and `extra_scripts` blocks of `templates/book-us/index.html`). Without JavaScript the play button is a plain link to the video on YouTube. To upgrade the library, copy `src/lite-yt-embed.js`, `src/lite-yt-embed.css` and `LICENSE` from the new release and update the version here. If a video really has to autoplay, use a plain `<iframe>` on `https://www.youtube-nocookie.com/embed/...` as on the Play-Along Session page.

### CI and Deployment

GitHub Actions (`.github/workflows/ci.yml`) runs these stages:

1. **Build:** the pre-commit hooks on all files, `build.py`, then CSS and image optimisation
2. **Test:** the functional Playwright tests in three browser projects, on pull requests (see [Running the Tests](#running-the-tests))
3. **Deploy Preview:** a Netlify preview for each pull request, linked in a comment
4. **Lighthouse:** Lighthouse CI against the built site, on pull requests (see below)
5. **Deploy Production:** every push to `main` is built and deployed to Netlify

The visual regression sweep runs on demand only (see [Visual Regression Testing](#visual-regression-testing-on-demand)).

### Lighthouse CI

Every pull request automatically runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) against the built site, measuring performance, accessibility, best practices, and SEO.

**Configuration:**

Lighthouse CI is configured in `.lighthouserc.json` at the project root. The accessibility assertion is set to `error` (minimum score 0.9) and will fail CI if a PR regresses accessibility. Performance, best-practices, and SEO assertions are `warn` only — informational, since performance scores are noisy on shared CI runners.

## Development

### Pre-commit Hooks

This project uses `pre-commit` for code linting and formatting. The hooks are defined in `.pre-commit-config.yaml` and run automatically on every commit after they have been installed.

To install the hooks:

```bash
uvx pre-commit install
```

To run the hooks on all files at any time:

```bash
uvx pre-commit run --all-files
```

### Running the Tests

The functional [Playwright](https://playwright.dev/) suites in `tests/` cover SEO data, mobile navigation, the calendar, the donate flow, YouTube embeds, analytics and a console-errors check on every page. CI runs them on every pull request in three projects: `chromium`, `Android (Chrome, Pixel 7)` and `iOS (Mobile Safari, iPhone 13)`.

They test the built site in `public/`, so build it the way CI does first:

```bash
pnpm install                  # also installs the Playwright browsers
uv run python build.py
node optimize-images.mjs
pnpm playwright test
```

`optimize-images.mjs` generates the AVIF and WebP variants the pages ask for; without them the console-errors and analytics tests fail on 404s. Playwright serves `public/` on port 8000 itself (see `playwright.config.ts`), or reuses a server already running there.

To run one project, one file or one page:

```bash
pnpm playwright test --project="chromium" tests/seo.spec.ts --grep "index.html"
```

A full run takes a few minutes. It does not include the visual regression suite, described next.

### Visual Regression Testing (on demand)

The [Playwright](https://playwright.dev/) suite in `tests/snapshots.spec.ts` takes full-page screenshots of every page and compares them against the baselines in `tests/snapshots.spec.ts-snapshots/`. It is **not part of pull request CI**: `playwright.config.ts` ignores it unless `VRT=1` is set, so `pnpm playwright test` only runs the functional suites (SEO, navigation, calendar, donate).

**Running it**

The suite runs on demand via **Actions → Visual Regression** (`.github/workflows/visual-regression.yml`), which builds the site exactly like CI:

- mode `check` runs the sweep against the committed baselines and reports — useful before merging a CSS or template refactor.
- mode `update` regenerates every baseline and pushes a `chore: update visual regression baselines` commit to the selected branch. Review the changed PNGs like any other change. The push uses `GITHUB_TOKEN`, which does not retrigger the branch's CI checks.

Baselines must be generated on Linux with the pinned Playwright browser builds, so always update them through the workflow. A local run is only useful for a quick look, and its snapshots must not be committed:

```bash
VRT=1 pnpm playwright test tests/snapshots.spec.ts
```

**Hiding Dynamic Content**

To keep snapshots stable, dynamic or non-deterministic content (like embedded calendars or videos) is hidden during screenshots by `tests/utils/snapshot.css`, which Playwright injects into every page when a snapshot is taken.

### Running Locally

[Netlify Dev CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/local-development/) replicates the full Netlify production environment locally, including Functions, Edge Functions, redirects, and custom headers. This is the recommended way to run the site locally.

**1. Set up environment variables:**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with the required API keys (ask a team member for secret values). The `BMC_URL` and `BMC_DEFAULT_UTMS` variables already have sensible defaults in the example file.

**2. Build the site:**

```bash
uv run poe build
```

**3. Start Netlify Dev:**

```bash
netlify dev
```

The site will be available at `http://localhost:8888`.

**What Netlify Dev provides:**

- ✅ Netlify Functions served at `/.netlify/functions/` (powers the Events Calendar)
- ✅ Edge Functions at their configured paths (`/donate`, `/donate-qr`, `/support-us`)
- ✅ Environment variables from `.env` loaded automatically
- ✅ Netlify redirect rules applied
- ✅ Custom response headers applied

**Limitations and caveats:**

- Edge Functions run in a Deno runtime; minor behavioural differences from production are possible.
- The site is not rebuilt automatically when template or static files change — re-run `uv run poe build` after any source changes.

#### Fallback: Simple Static Server

If you only need to check static content (HTML, CSS, JS) without dynamic features, you can use the simpler built-in server instead:

```bash
uv run poe build
uv run poe serve
```

The site will be available at `http://localhost:8000`.

> **Note:** This server does **not** run Netlify Functions or Edge Functions, so features like the Events Calendar, WhatsApp gate, and donate redirects will **not** work.

### Troubleshooting

- **Tests fail with 404s for `.avif` or `.webp` images:** the image variants weren't generated; run `node optimize-images.mjs` after the build (see [Running the Tests](#running-the-tests)).
- **Tests or the local server can't find pages:** `public/` is missing or stale; rebuild the site.
- **Pre-commit fails:** run `uvx pre-commit run --all-files` to see the formatting issues; the djLint hook reformats templates in place.
- **Server won't start:** check that port 8888 (Netlify Dev) or 8000 (static server) is free.
- **Netlify Dev: calendar not loading:** set `GOOGLE_CALENDAR_API_KEY` in `.env` and check the browser console for errors from `/.netlify/functions/calendar`.
