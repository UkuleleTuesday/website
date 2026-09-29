# Ukulele Tuesday Website: Agent Instructions

This file steers every coding agent working in this repository (Claude Code, GitHub Copilot, Codex and others). `CLAUDE.md` imports it and `.github/copilot-instructions.md` points to it, so it is the only agent instructions file to maintain.

**Rely on these instructions first.** Fall back to searching the code or running commands only when something here doesn't match what you find, and then report the mismatch rather than editing this file.

## Rules for this file

- **Don't change `AGENTS.md` unless a human explicitly asks you to.** If something here looks wrong or out of date, say so in your reply or pull request description and leave the edit to them. The same applies to `CLAUDE.md` and `.github/copilot-instructions.md`, which only point here.
- **This file is only for steering agents.** Anything people would find useful too, such as what the site is, how it works, or how to build, test and deploy it, belongs in `README.md` or under `docs/`, and this file only links to it. If a human asks you to add something like that here, propose the README or `docs/` instead.

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
| push, or look into a CI failure | [CI and Deployment](README.md#ci-and-deployment) |
| work out why a build, test run or local server fails | [Troubleshooting](README.md#troubleshooting) |

If a README command is wrong or missing, fix the README in the same pull request rather than working around it here.

The build takes under a second, the pre-commit hooks about 24 seconds on their first run and the functional tests a few minutes. Let them finish: don't cancel them, and give test runs a timeout of 300 seconds or more.

GitHub Copilot's cloud environment is prepared by `.github/workflows/copilot-setup-steps.yml` (uv, Node, pnpm, dependencies and Playwright browsers). Elsewhere, install what [Prerequisites](README.md#prerequisites) lists.

## Before you open a pull request

1. Build the site without errors.
2. Run the pre-commit hooks; CI runs them on every file.
3. Run the functional tests that cover what you changed.
4. Look at the change in a browser, at phone width as well as desktop: pages load without 404s, styling and scripts work, the mobile menu opens, images scale. Use Netlify Dev when the page depends on the calendar, the donate redirects or the WhatsApp gate.
5. Update `README.md` or `docs/` if the change affects anything they describe. If this file should change too, say so in the pull request description instead of editing it.

## Pull request conventions

When you write a pull request description:

- Use concise English.
- Explain why the change is made rather than how.
- Keep it to 200 words at most.
- Don't repeat what a reader can find by reading the diff.

## Issue tracker conventions

When opening or editing issues, use the repo's canonical templates and labels; don't invent your own:

- **Template:** pick the matching one in `.github/ISSUE_TEMPLATE/` (Task, Bug report, or Discussion) and fill in its sections; it declares its own type label.
- **Labels:** apply only those in `.github/labels.yml`, verbatim: one type (the template sets it) and zero or more `area:*`. New labels go in that file (synced by `.github/workflows/sync-labels.yml`), not onto GitHub directly.
- **Never set or change a readiness label** (`ready-to-pull` / `needs-detail` / `needs-shaping`), `quickfix` or `possibly-stale`. They are the triage verdict, written only by the `issue-triager` agent (`.github/agents/issue-triager.md`) or a human. Leave `needs-triage` on a new issue so it gets picked up.
- **Sub-issues:** when an issue is too broad for one pull request, split it into sub-issues (one deliverable each) linked to the parent.
