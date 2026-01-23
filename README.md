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

The homepage features a dynamic calendar that displays upcoming events like our regular Tuesday jam sessions, concerts, and festival appearances. Events are fetched from the "Ukulele Tuesday Public Events" Google Calendar using the Google Calendar API.

To add or edit events, Executive Committee members have been granted edit access to the "Ukulele Tuesday Public Events" Google Calendar. Events are automatically displayed on the homepage once added to the calendar.

**Technical details:**
- The calendar data is fetched via a Netlify function (`netlify/functions/calendar.js`) which uses the Google Calendar API with an API key stored in environment variables
- The JavaScript client (`static/js/calendar.js`) renders the next 20 upcoming events returned by the API
- The calendar automatically updates as new events are added to the Google Calendar (with a 5-minute cache)
- The `GOOGLE_CALENDAR_API_KEY` environment variable must be set in Netlify (or GitHub repository secrets) for the calendar to work

**Event Classification:**
Events are automatically color-coded by type using hashtags in the event description:
- **#jam** → Jam Session (orange border)
- **#concert** → Concert (teal border)

For backwards compatibility, events without hashtags are classified using keywords ("play-along", "jam", "session" → Jam Session; otherwise → Concert).

To reliably classify an event, add the appropriate hashtag to the event description when creating or editing events in Google Calendar.

To add or edit events, Executive Committee members have been granted edit access to the "Ukulele Tuesday Public Events" Google Calendar. Event colour-coding is not supported, since it is visible only to those logged into
the Ukulele Tuesday Google account (see https://github.com/UkuleleTuesday/website/issues/107).

### Automated Deployment

The site is automatically built and deployed to Netlify on every push to the `main` branch. Preview environments are also created for every pull request.

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

First, build the site:

```bash
uv run poe build
```

Then, to serve the website locally, use the following command:

```bash
uv run poe serve
```

The site will be available at `http://localhost:8000`.
