# Ukulele Tuesday Website: Agent Instructions

This file is the one set of instructions for every coding agent working in this repository (Claude Code, GitHub Copilot, Codex and others). `CLAUDE.md` imports it and `.github/copilot-instructions.md` points to it, so change instructions here, not there.

The site is static: Python 3.12+ renders Jinja2 templates into `public/`, which Netlify serves, with a few Netlify Functions and Edge Functions for the dynamic parts. It started as a WordPress export.

**Rely on these instructions first.** Fall back to searching the code or running commands only when something here doesn't match what you find, and then fix this file.

## Always read the README section first

`README.md` is the source of truth for what the site is for and for how to build and test it. Before each of these tasks, read the linked section, every time: don't work from memory or from commands copied elsewhere, which go stale.

| Before you… | Read |
|---|---|
| change copy, navigation or page structure | [Purpose](README.md#purpose) |
| build the site | [Building the Site](README.md#building-the-site) |
| lint or format | [Pre-commit Hooks](README.md#pre-commit-hooks) |
| run the tests | [Running the Tests](README.md#running-the-tests) |
| update or check screenshot baselines | [Visual Regression Testing](README.md#visual-regression-testing-on-demand) |
| check a change in a browser, or work on the calendar, donate redirects or WhatsApp gate | [Running Locally](README.md#running-locally) |
| change the promo banner, calendar, analytics or YouTube embeds | [Configuration](README.md#configuration) |

If a README command is wrong or missing, fix the README in the same pull request rather than working around it here.

The build takes under a second, the pre-commit hooks about 24 seconds on their first run and the functional tests a few minutes. Let them finish: don't cancel them, and give test runs a timeout of 300 seconds or more.

GitHub Copilot's cloud environment is prepared by `.github/workflows/copilot-setup-steps.yml` (uv, Node, pnpm, dependencies and Playwright browsers). Elsewhere, install what [Prerequisites](README.md#prerequisites) lists.

## Before you open a pull request

1. Build the site without errors.
2. Run the pre-commit hooks; CI runs them on every file.
3. Run the functional tests that cover what you changed.
4. Look at the change in a browser, at phone width as well as desktop: pages load without 404s, styling and scripts work, the mobile menu opens, images scale. Use Netlify Dev when the page depends on the calendar, the donate redirects or the WhatsApp gate.
5. Update `README.md` if the change affects anything it describes, and this file if it changes how agents should work.

## Issue tracker conventions

When opening or editing issues, use the repo's canonical templates and labels; don't invent your own:

- **Template:** pick the matching one in `.github/ISSUE_TEMPLATE/` (Task, Bug report, or Discussion) and fill in its sections; it declares its own type label.
- **Labels:** apply only those in `.github/labels.yml`, verbatim: one type (the template sets it) and zero or more `area:*`. New labels go in that file (synced by `.github/workflows/sync-labels.yml`), not onto GitHub directly.
- **Never set or change a readiness label** (`ready-to-pull` / `needs-detail` / `needs-shaping`), `quickfix` or `possibly-stale`. They are the triage verdict, written only by the `issue-triager` agent (`.github/agents/issue-triager.md`) or a human. Leave `needs-triage` on a new issue so it gets picked up.
- **Sub-issues:** when an issue is too broad for one pull request, split it into sub-issues (one deliverable each) linked to the parent.

## CI/CD

`.github/workflows/ci.yml` runs these stages:

1. **Build:** pre-commit hooks on all files, `build.py`, then CSS and image optimisation
2. **Test:** the functional Playwright tests in three browser projects (pull requests only)
3. **Deploy Preview:** a Netlify preview for each pull request, linked in a comment
4. **Lighthouse:** Lighthouse CI against the built site; the accessibility score is enforced
5. **Deploy Production:** deploys `main` to Netlify

The visual regression sweep and baseline regeneration run on demand only, via the **Visual Regression** workflow (`.github/workflows/visual-regression.yml`); they are not part of pull request CI.

Check that your change passes these stages locally before you push.

## Troubleshooting

- **Tests fail with 404s for `.avif` or `.webp` images:** the image variants weren't generated; see [Running the Tests](README.md#running-the-tests).
- **Tests or the local server can't find pages:** `public/` is missing or stale; rebuild the site.
- **Pre-commit fails:** run `uvx pre-commit run --all-files` to see the formatting issues; the djLint hook reformats templates in place.
- **Server won't start:** check that port 8888 (Netlify Dev) or 8000 (static server) is free.
- **Netlify Dev: calendar not loading:** set `GOOGLE_CALENDAR_API_KEY` and check the browser console for errors from `/.netlify/functions/calendar`.

## Legacy notes

The site originated from a WordPress export. The WordPress-style URL structure is kept for SEO and image files keep their WordPress names, flattened out of the date hierarchy. The legacy theme and plugin files were removed in #147; nothing under `static/` comes from WordPress any more.
