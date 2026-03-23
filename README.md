# Ukulele Tuesday Website

This project contains the source code and build process for the [Ukulele Tuesday website](https://www.ukuleletuesday.ie/), published on Netlify.

## Overview

The initial version of this site was created on WordPress.

After being exported from its WordPress install, it is now maintained as a static site built with [Jinja2](https://pypi.org/project/Jinja2/) for better performance, security, and cost-effectiveness.

The rare dynamic parts of the site are handled via:
* Netlify Forms for forms
* Netlify functions/edge functions for everything else.

## Prerequisites

- Python 3.12+ with [uv](https://github.com/astral-sh/uv) package manager
- Node.js with [pnpm](https://pnpm.io/) package manager — used as the primary task runner for building, linting, testing, and optimising assets

## Usage

### Building the Site

To build the static site from the Jinja templates:

```bash
pnpm build
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
ENABLE_CALENDAR=false pnpm build
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

Every pull request automatically runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) against the Netlify deploy preview, measuring performance, accessibility, best practices, and SEO.

**Viewing results:**

- A summary comment is posted to the PR with scores for each Lighthouse category
- The full Lighthouse report is uploaded as a GitHub Actions artifact (retained for 30 days) — find it in the **Actions** tab under the workflow run for your PR

**Configuration:**

Lighthouse CI is configured in `.lighthouserc.json` at the project root. The assertions are set to `warn` only, so the CI will not fail due to low Lighthouse scores — the results are informational. Thresholds can be tightened to `error` to enforce minimum scores.

## Development

### Pre-commit Hooks

This project uses `pre-commit` for code linting and formatting. The hooks are defined in `.pre-commit-config.yaml` and run automatically on every commit after they have been installed.

To install the hooks:

```bash
uvx pre-commit install
```

To run the hooks on all files at any time:

```bash
pnpm lint
```

### Visual Regression Testing

This project uses [Playwright](https://playwright.dev/) for visual regression testing. It takes screenshots of every page and compares them against baseline snapshots to prevent unintended visual changes. The test dependencies and scripts are managed with `pnpm`.

**Running Tests**

To execute the visual regression tests:

```bash
pnpm playwright test
```

The test suite includes two types of visual regression tests for each page:
- **Normal state tests**: Capture pages in their default appearance
- **Hover state tests**: Capture pages with all interactive elements (buttons, links, etc.) forced into their hover state

**Updating Snapshots**

If you make intentional changes to the UI, you will need to update the baseline snapshots. After verifying that the changes are correct, run:

```bash
pnpm playwright test --update-snapshots
```

If running under Windows, you should instead run:

```
powershell -ExecutionPolicy Bypass -File .\update-snapshots.ps1
```

And if running under a Linux distribution which has trouble with WebKit (e.g. KDE), use:

```
chmod +x update-snapshots.sh
./update-snapshots.sh
```

Commit the updated snapshot files in the `tests/snapshots.spec.ts-snapshots/` directory along with your code changes.

**Hiding Dynamic Content**

To ensure stable snapshots, dynamic or non-deterministic content (like embedded calendars or videos) can be hidden during tests. Any styles to be applied only during snapshot tests should be added to `tests/utils/snapshot.css`. This stylesheet is automatically injected into every page when a snapshot is taken.

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
pnpm build
```

**3. Start Netlify Dev:**

```bash
pnpm dev
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
- The site is not rebuilt automatically when template or static files change — re-run `pnpm build` after any source changes.

#### Fallback: Simple Static Server

If you only need to check static content (HTML, CSS, JS) without dynamic features, you can use the simpler built-in server instead:

```bash
pnpm build
pnpm serve
```

The site will be available at `http://localhost:8000`.

> **Note:** This server does **not** run Netlify Functions or Edge Functions, so features like the Events Calendar, WhatsApp gate, and donate redirects will **not** work.
