# Ukulele Tuesday Static Website

This project contains the source code and build process for the Ukulele Tuesday static website, published via Netlify.

## Overview

The initial version of this site was created from a static export of a WordPress site. It is now maintained as a static site built with Jinja2 for better performance, security, and cost-effectiveness.

## Prerequisites

- A Netlify account linked to this GitHub repository
- Python 3.12+ with [uv](https://github.com/astral-sh/uv) package manager

## Usage

### Building the Site

To build the static site from the Jinja templates:

```bash
uv run python build.py
```

This will generate the static HTML files in the `public/` directory.

* Files in `./templates/` are processed as jinja2 templates before being copied to `public/`
* Files in `./static/` are copied as is to `public/`

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

**Updating Snapshots**

If you make intentional changes to the UI, you will need to update the baseline snapshots. After verifying that the changes are correct, run:

```bash
pnpm playwright test --update-snapshots
```

Commit the updated snapshot files in the `tests/snapshots.spec.ts-snapshots/` directory along with your code changes.

### Font Management

This project uses a single canonical Google Fonts import to ensure consistent font loading and optimal performance.

**Canonical Font Import**

All Google Fonts are loaded via a single CSS2 endpoint in `templates/_layouts/base.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Pattaya:wght@400&family=Quicksand:wght@500;600;700&family=Roboto:wght@400;500;700;900&display=swap"
      id="canonical-google-fonts-css"
      media="all"
      rel="stylesheet"
      type="text/css">
```

**Font Families and Weights**

- **Poppins**: 300, 400, 500, 600, 700 (main body text, headings)
- **Pattaya**: 400 (decorative headings like "Welcome to Ukulele Tuesday")
- **Quicksand**: 500, 600, 700 (UI elements, author names)
- **Roboto**: 400, 500, 700, 900 (fallback font, specific UI components)

**Performance Benefits**

- Single HTTP request instead of multiple font imports
- Uses modern CSS2 endpoint with `display=swap` for better loading performance
- Eliminates duplicate font requests and malformed weights
- Consistent font rendering across all pages
