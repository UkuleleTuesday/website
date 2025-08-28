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

### CI/CD Pipeline & Build Caching

The project uses GitHub Actions for continuous integration and deployment, with comprehensive build caching to improve performance:

#### Build Caching Strategy
- **uv/Python Dependencies**: Python dependencies and virtual environments are cached using `astral-sh/setup-uv@v4` with `enable-cache: true`
- **Pre-commit Hooks**: Pre-commit hook environments are cached in `~/.cache/pre-commit` to avoid re-downloading tools on every run
- **pnpm Dependencies**: Node.js dependencies are cached using the official `pnpm/action-setup@v4` action with pnpm store caching
- **Playwright Browsers**: Browser binaries are cached in `~/.cache/ms-playwright` and `~/.cache/playwright-browsers` to avoid re-downloading (~150MB) on each test run
- **npm Global Packages**: Global npm packages (like Netlify CLI) are cached in `~/.npm` for deploy jobs

#### Performance Benefits
- **Pre-commit hooks**: ~24 seconds saved on cache hits
- **Playwright browsers**: ~2.5 minutes saved on cache hits
- **Overall CI time**: Significantly reduced execution time, especially for test jobs

The caching configuration is designed to be safe with appropriate fallback keys to ensure builds can complete even if specific cache entries are unavailable.

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
