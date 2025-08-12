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

### Automated Deployment

The site is automatically built and deployed to Netlify on every push to the `main` branch.

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

## Project Structure

```
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml      # GitHub Actions workflow
├── templates/                        # Jinja2 templates
├── static/                           # Static assets (CSS, JS, images)
├── build.py                          # Site build script
├── pyproject.toml                    # Python project configuration
├── uv.lock                           # Dependency lock file
└── README.md                         # This documentation
```
