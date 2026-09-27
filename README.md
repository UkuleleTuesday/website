# Ukulele Tuesday Website

This project contains the source code and build process for the [Ukulele Tuesday website](https://www.ukuleletuesday.ie/), published on Netlify.

## Purpose and strategy

Ukulele Tuesday runs a free weekly ukulele play-along session in Dublin and performs as a band at concerts and festivals. The site exists to get five things done. In rough order of how often visitors need them (to be confirmed by a visitor poll, [#179](https://github.com/UkuleleTuesday/website/issues/179)):

1. **Come to a session**: is it on this Tuesday, when and where, is it free, is it for beginners.
2. **Use the songbook**: regulars open it at the session, on their phones.
3. **Book us**: event and festival organisers deciding whether to hire the group.
4. **Support us**: donate, and see what the money funds.
5. **Join the community**: WhatsApp group, Code of Conduct, volunteering.

Two rules follow from that list:

- **Every page and menu item earns its place by serving one of these tasks.** Content that serves none of them (press coverage, history, governance) goes one level down or into the footer rather than competing for attention. Taking the Press page out of the menu ([#174](https://github.com/UkuleleTuesday/website/issues/174)) was the first application of this rule.
- **Value counts, not just traffic.** Organisers are a tiny share of visits and by far the most valuable, so their needs weigh more than their numbers. Copy aimed at them must describe what actually turns up: an amplified band, with ukuleles through line-in and effects, further instrumentation and layered vocal harmonies, not an acoustic ukulele ensemble. It should also say that play-along jam sessions and workshops can be booked alongside a set. Getting this wrong misleads the organiser and their sound engineer alike ([#178](https://github.com/UkuleleTuesday/website/issues/178)).

**Writing convention.** The playful voice belongs in body copy. Page titles, headings, menu labels and meta descriptions use the literal words people search for, because many visitors arrive from a search with a specific question.

### Pages and what each is for

| Page | Task it serves |
|---|---|
| `/` | Hub: route each visitor to their task in one tap, plus upcoming events from the public Google Calendar |
| `/tuesday-session/` | Come to a session: practical details, FAQ, what to expect |
| `/songbook/` | Use the songbook. The songbook itself lives on the microsite below; how the two should relate is tracked in [#180](https://github.com/UkuleleTuesday/website/issues/180) |
| `/concerts/`, `/contact-us/` | Book us: what you get, proof it works, enquiry form (Netlify Forms) |
| `/support-us`, `/donate`, `/donate-qr` | Support us: edge-function redirects to Buy Me a Coffee, also behind the QR codes used at sessions |
| `/whatsapp/`, `/code-of-conduct/` | Join the community |
| `/testimonials/` | Press quotes. Out of navigation and search while it is folded into other pages ([#174](https://github.com/UkuleleTuesday/website/issues/174)) |

### Related properties

- `www.ukuleletuesday.ie` is this site; the apex host redirects to it (`netlify.toml`).
- `songbooks.ukuleletuesday.ie` is a separate GitHub Pages microsite, rebuilt weekly with the latest songbook. It is not in this repository.
- The community lives on WhatsApp (joined through `/whatsapp/`), Instagram, Facebook, YouTube and the group's Tripadvisor listing. The site is the hub that points to them.

### How we measure

- **Mixpanel** (`static/js/mixpanel.js`) runs autocapture with persistence disabled. It counts page views and clicks but sets no cookies and cannot follow a visitor from one page to the next, so there are no sessions, journeys or funnels. It is only included in production builds (`ENABLE_ANALYTICS=true`).
- **Task completions** are recorded elsewhere: booking enquiries arrive as Netlify Forms submissions, the donate redirect sends a `Donate link opened` event to Mixpanel with its UTM source (QR code, menu or direct), and WhatsApp joins are not recorded at all.
- **Google Search Console** has a Domain property for `ukuleletuesday.ie`, covering the apex host, `www` and the songbooks microsite. Exports and the scripts that analyse them live under [`docs/spikes/data/`](docs/spikes/data/).

### Where the plan lives

- [#176](https://github.com/UkuleleTuesday/website/issues/176) is the live tracker for the site restructure; its sub-issues hold status and decisions. New ideas get the `needs-triage` label.
- [`docs/spikes/`](docs/spikes/) holds dated, point-in-time studies. They are snapshots of the evidence and reasoning at the time, not maintained documents. The [2026-09-27 top-tasks review](docs/spikes/2026-09-27-top-tasks-review.md) sets out the strategy above in full.

## Overview

The initial version of this site was created on WordPress.

After being exported from its WordPress install, it is now maintained as a static site built with [Jinja2](https://pypi.org/project/Jinja2/) for better performance, security, and cost-effectiveness.

The rare dynamic parts of the site are handled via:
* Netlify Forms for forms
* Netlify functions/edge functions for everything else.

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
- The JavaScript client (`static/js/calendar.js`) renders the next 20 upcoming events returned by the API
- The calendar automatically updates as new events are added to the Google Calendar (with a 5-minute cache)
- The `GOOGLE_CALENDAR_API_KEY` environment variable must be set in Netlify (or GitHub repository secrets) for the calendar to work
- **Event descriptions can be viewed by clicking/tapping on events** - descriptions are initially hidden and toggle on/off when the event is clicked or activated with keyboard (Enter/Space)
- Events with descriptions display a cursor pointer and support keyboard navigation for accessibility

**Event Classification:**
Events are automatically color-coded by type using hashtags in the event description:
- **#jam** → Play-Along Session (orange border)
- **#concert** → Concert (teal border)

For backwards compatibility, events without hashtags are classified by detecting some basic keywords ("play-along", "jam", → Play-Along Session Session; otherwise → Concert) but it's very easy to trip this up, we don't recommend relying on this approach.

To reliably classify an event, add the appropriate hashtag to the event description when creating or editing events in Google Calendar.

To add or edit events, Executive Committee members have been granted edit access to the "Ukulele Tuesday Public Events" Google Calendar. Event colour-coding is not supported, since it is visible only to those logged into
the Ukulele Tuesday Google account (see https://github.com/UkuleleTuesday/website/issues/107).

### Automated Deployment

The site is automatically built and deployed to Netlify on every push to the `main` branch. Preview environments are also created for every pull request.

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
