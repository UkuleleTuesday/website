# Contributing to the Ukulele Tuesday website

Thanks for contributing! This guide focuses on one thing: **writing issues that are
"ready-to-pull"** — scoped well enough that a contributor or coding agent can take them
straight to a mergeable PR without a round of clarifying questions.

> For the engineering conventions (build, pre-commit, Playwright tests, Netlify Dev,
> CI stages), see [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
> For what belongs on the site at all — pages, menu items, copy, what a first-timer
> needs to see — see the **Purpose** section of [`README.md`](README.md). This file is
> only about how to file good issues.

## What makes an issue "ready-to-pull"

An issue is **ready-to-pull** when someone could open a mergeable PR from it without
asking a question. Aim for all five:

1. **Single, bounded deliverable.** One page, one bug, one redirect, one partial. The
   title names one change — not a bundle, not "and also…".
2. **States the problem _and_ the desired outcome.** What's wrong or wanted; for bugs,
   observed-vs-expected. Enough that "done" is unambiguous.
3. **A path to the fix.** Either an explicit approach (steps, named files, invariants to
   preserve) **or** a change so self-evident the fix is obvious. Concrete file paths
   (`templates/index.html`, `static/css/custom.css`, `netlify/edge-functions/donate.js`)
   help enormously.
4. **No unresolved _blocking_ design or content questions.** "Nice-to-figure-out" notes
   are fine; a decision that must be made _before any code_ is not — settle it first.
   For copy, navigation or page structure, that means the change already squares with
   the README's Purpose section.
5. **Unblocked, or explicitly sequenced.** No dependency on unmerged work, a missing
   asset (a photo, final copy, a fact only the committee knows), or an analytics export
   nobody has yet — or the dependency is ordered ("after #NNN"), not open-ended.

### Disqualifiers (any one means "not ready yet")

- It's an idea or exploration (the `discussion` template / label, or a title like
  _Explore / Notes / Investigate / Spike / RFC_).
- The body is dominated by open questions, "not committed", or "possible next steps".
- It bundles multiple distinct problems — **split it** into one issue per deliverable.

## Split fuzzy issues into scoped children

Capturing rough thinking is welcome — file it as a **Discussion / idea** issue. But
exploration isn't actionable on its own. When a direction firms up, break it into
**Task** or **Bug** issues, each a single deliverable, and let those be the work that
gets picked up. (For example, "notes from walking through the site on a phone" becomes
several scoped bug issues — those scoped children are what ship.)

## Issue templates

When you open an issue you'll be offered:

- **Task / implementation** — a scoped change to ship as one PR (`enhancement`).
- **Bug report** — observed vs expected, one problem (`bug`).
- **Discussion / idea / exploration** — the not-ready bucket for thinking-in-progress
  (`discussion`).

Pick the one that fits, fill in the sections, and you're set. New issues start with the
`needs-triage` label; the issue-triager agent (or a maintainer) replaces it with a
readiness label — `ready-to-pull`, `needs-detail` or `needs-shaping` — and tags the
areas the change touches. The full label set lives in
[`.github/labels.yml`](.github/labels.yml).
