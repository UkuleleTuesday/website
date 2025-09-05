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
