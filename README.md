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

The site supports an optional promotional banner that appears at the very top of every page. This banner can be configured using the `PROMO_BANNER` environment variable during the build process.

**To display a promo banner:**

```bash
PROMO_BANNER='&#127926; Event Name &mdash; Description &mdash; <a href="https://example.com" target="_blank" rel="noopener"><strong>Call to Action</strong></a>' uv run python build.py
```

**To hide the banner (default):**

```bash
uv run python build.py
```

The banner accepts HTML content and will be rendered with the `| safe` filter to allow formatting, links, and special characters. If the `PROMO_BANNER` variable is empty or not set, the banner element will not be rendered at all (no empty container).

**Styling:** The banner uses the `.promo-bar` CSS class defined in `static/css/custom.css` with the site's maroon color scheme (#66023c).

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

Commit the updated snapshot files in the `tests/snapshots.spec.ts-snapshots/` directory along with your code changes.

### Running Locally

To run the website locally, use the following command:

```
uv run python -m http.server -d public/
```
