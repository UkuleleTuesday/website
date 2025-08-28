# Ukulele Tuesday Static Website

This repository contains a static website built with Python 3.12+, Jinja2 templates, and deployed via Netlify. It started as an export from a WordPress site and is now maintained as a fast, secure static site.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Essential Setup Commands
Run these commands in order to bootstrap your development environment:

1. **Install system dependencies (if needed):**
   ```bash
   sudo apt-get update && sudo apt-get install -y ripgrep
   ```

2. **Build the static site:**
   ```bash
   uv run python build.py
   ```
   - **TIMING: Takes <1 second** - this is extremely fast
   - Copies `static/` directory contents to `public/`
   - Renders Jinja2 templates from `templates/` into `public/`
   - Uses environment variables: `ENABLE_ANALYTICS=true` for production, `BASE_URL` for absolute URLs
   - **NEVER CANCEL** - command completes almost instantly

3. **Install pre-commit hooks:**
   ```bash
   uvx pre-commit install
   ```

4. **Run pre-commit hooks (linting/formatting):**
   ```bash
   uvx pre-commit run --all-files
   ```
   - **TIMING: Takes ~24 seconds on first run** (subsequent runs are much faster)
   - **NEVER CANCEL** - wait for completion as this is required for CI
   - Uses djLint to format Jinja2 templates in `templates/`

5. **Install JavaScript/testing dependencies:**
   ```bash
   pnpm install
   ```
   - **TIMING: Takes ~350ms** - very fast with existing lockfile

### Local Development Server
Start the local development server to test your changes:

```bash
python3 -m http.server -d public 8000
```
- **Serves site at:** http://localhost:8000
- **REQUIREMENT:** Must run `uv run python build.py` first to generate `public/` directory
- Server runs in foreground - use Ctrl+C to stop

### Testing Commands

**Install test browsers (may fail due to network issues):**
```bash
pnpm exec playwright install --with-deps
```
- **TIMING: Takes 5-10 minutes if successful**
- **KNOWN ISSUE:** Browser downloads may fail due to network restrictions
- **WORKAROUND:** Tests can still be written and validated once browsers are available

**Run all tests:**
```bash
pnpm playwright test
```
- **TIMING: Takes ~2.5 minutes when browsers are available**
- **REQUIREMENT:** Requires browsers to be installed first
- **TIMEOUT: Set to 300+ seconds** - NEVER CANCEL test runs
- Tests include SEO validation and visual regression testing

**Run specific test:**
```bash
pnpm playwright test --project="chromium" tests/snapshots.spec.ts --grep="visual regression for index.html"
```

## Validation Scenarios

**CRITICAL:** After making any changes, ALWAYS run these validation steps:

1. **Build and verify no errors:**
   ```bash
   uv run python build.py
   ```

2. **Run pre-commit checks:**
   ```bash
   uvx pre-commit run --all-files
   ```

3. **Start local server and manually test:**
   ```bash
   python3 -m http.server -d public 8000
   ```
   - Visit http://localhost:8000 in browser
   - Navigate to different pages (concerts, songbook, etc.)
   - Verify pages load without 404 errors
   - Check that styling and JavaScript work correctly

4. **Test responsive design:**
   - Resize browser window to test mobile layouts
   - Check that navigation menu works on mobile
   - Verify images scale properly

## Build Timing Expectations

- **Build site:** <1 second ⚡ (extremely fast)
- **Pre-commit hooks:** ~24 seconds (first run)
- **pnpm install:** ~350ms
- **Playwright browser install:** 5-10 minutes (may fail)
- **Full test suite:** ~2.5 minutes
- **Asset analysis:** <1 second

**NEVER CANCEL any of these operations** - they are all necessary for proper development workflow.

## Common Development Tasks

### Asset Management
Check for unused WordPress assets:
```bash
./wp-asset-check.sh --unused
```

Check which assets are actively used:
```bash
./wp-asset-check.sh --used
```

### Template Structure
- **Templates:** `templates/` - Jinja2 templates (processed during build)
- **Static files:** `static/` - Copied as-is to `public/`
- **Generated site:** `public/` - Final output (9.7M size)
- **Partials:** `templates/_partials/` - Reusable template components
- **Layouts:** `templates/_layouts/` - Base template layouts

### Environment Variables
- `ENABLE_ANALYTICS=true` - Enable Google Analytics (production only)
- `BASE_URL=https://ukuleletuesday.ie` - Base URL for absolute paths in SEO data

### Key Directories and Files

**Repository root:**
```
├── build.py                     # Main build script
├── pyproject.toml              # Python dependencies
├── package.json                # JavaScript dependencies  
├── playwright.config.ts        # Test configuration
├── .pre-commit-config.yaml     # Linting configuration
├── templates/                  # Jinja2 templates
├── static/                     # Static assets
├── public/                     # Generated site (after build)
├── tests/                      # Playwright tests
├── netlify/                    # Netlify functions
├── tools/                      # WordPress export utilities
└── wp-asset-check.sh          # Asset analysis script
```

**Template pages:**
```
templates/
├── index.html                  # Homepage
├── concerts/index.html         # Concerts page
├── songbook/index.html         # Songbook page
├── contact-us/index.html       # Contact page
├── faq/index.html              # FAQ page
├── testimonials/index.html     # Testimonials page
├── tuesday-session/index.html  # Session info page
├── whatsapp/index.html         # WhatsApp join page
└── code-of-conduct/index.html  # Code of conduct
```

## Troubleshooting

**Build fails:** Check that `templates/` and `static/` directories exist and contain expected files.

**Tests fail:** Ensure `public/` directory exists (run build first) and browsers are installed.

**Pre-commit fails:** Run `uvx pre-commit run --all-files` to see specific formatting issues.

**Server won't start:** Verify `public/` directory exists and port 8000 is not already in use.

**Browser installation fails:** This is a known network issue - tests can still be written but may need to run in CI environment.

## CI/CD Integration

The project uses GitHub Actions (`.github/workflows/ci.yml`) with these stages:
1. **Build:** Runs `uv run build.py` and pre-commit hooks
2. **Test:** Runs Playwright tests across multiple browsers
3. **Deploy Preview:** Creates Netlify preview for PRs
4. **Deploy Production:** Deploys to production on main branch

**Always verify your changes pass all these stages locally before pushing.**

## Performance Notes

This is an extremely fast static site:
- **Build time:** Sub-second
- **Site size:** 9.7M (includes WordPress legacy assets)
- **Pages:** 9 main pages
- **Technology:** Pure static HTML/CSS/JS (no runtime dependencies)

## Legacy Notes

This site originated from a WordPress export, which explains:
- Large `wp-content/` directory with legacy assets
- WordPress-style URL structure maintained for SEO
- Asset checking script to identify unused legacy files