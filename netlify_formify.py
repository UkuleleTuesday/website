#!/usr/bin/env python3
"""
Rewrite CF7 markup so Netlify picks it up.

•   Adds data‑netlify="true"  and  netlify-honeypot="bot-field"
•   Injects <input type="hidden" name="form-name" …>
    – value is taken from <form id="…"> if present,
      otherwise falls back to "contact".
•   Leaves the rest of the CF7 markup untouched;
    Netlify simply ignores the extra hidden fields & JS.
"""
import pathlib
import sys
import bs4
import click
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """Tools to prepare Contact Form 7 forms for Netlify."""
    pass


@cli.command()
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def formify(root_dir: str):
    """Rewrite CF7 markup in HTML files so Netlify picks it up."""
    root = pathlib.Path(root_dir)
    logger.info(f"Scanning for forms to Netlify-formify in: {root}")
    total_forms_changed = 0

    for html_path in root.rglob("*.html"):
        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")
        file_changed = False

        # Remove Turnstile script tags from the document
        for turnstile_script in soup.find_all("script", src=lambda s: s and "challenges.cloudflare.com/turnstile" in s):
            turnstile_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed Cloudflare Turnstile script from {html_path.relative_to(root)}")

        # Remove CF7 and swv script tags from the document
        for cf7_script in soup.find_all("script", src=lambda s: s and "contact-form-7" in s):
            script_src = cf7_script['src']
            cf7_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed CF7 script tag: {script_src} from {html_path.relative_to(root)}")

        for form_container in soup.find_all("div", class_="wpcf7"):
            form = form_container.find("form")
            if not form:
                continue

            form_changed = False
            form_id = form.get('id', 'N/A')

            # 1. Netlify attributes
            if not form.has_attr("data-netlify"):
                form["data-netlify"] = "true"
                form["netlify-honeypot"] = "bot-field"
                form_changed = True

            # 2. Hidden 'form-name'
            if not form.find("input", attrs={"name": "form-name"}):
                default_name = form_id or "contact"
                hidden = soup.new_tag("input", attrs={
                    "type": "hidden",
                    "name": "form-name",
                    "value": default_name,
                })
                form.insert(0, hidden)  # as first child
                form_changed = True

            # 3. Remove Cloudflare Turnstile div
            turnstile_div = form.find("div", class_="cf-turnstile")
            if turnstile_div:
                turnstile_div.decompose()
                form_changed = True
                logger.info(f"✓ Removed Cloudflare Turnstile div from form '{form_id}' in {html_path.relative_to(root)}")

            if form_changed:
                file_changed = True
                total_forms_changed += 1
                logger.info(f"✓ Transformed form with id: '{form_id}' in {html_path.relative_to(root)}")

        if file_changed:
            html_path.write_text(str(soup), encoding="utf‑8")

    if total_forms_changed > 0:
        logger.info(f"✓ Netlify-formified {total_forms_changed} CF7 form(s) in → {root}")
    else:
        logger.info("✓ No CF7 forms found to Netlify-formify.")


@cli.command()
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def verify(root_dir: str):
    """Verify that forms in HTML files are Netlify-ready."""
    root = pathlib.Path(root_dir)
    logger.info(f"Verifying Netlify forms in: {root}")
    forms_found = 0
    errors_found = 0

    for html_path in root.rglob("*.html"):
        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")

        # Find forms inside a .wpcf7 container
        for form_container in soup.find_all("div", class_="wpcf7"):
            form = form_container.find("form")
            if not form:
                continue

            forms_found += 1
            form_id = form.get('id', 'unidentified form')
            relative_path = html_path.relative_to(root)

            # Check for Netlify attribute
            if not form.has_attr("data-netlify"):
                logger.error(f"✗ [{relative_path}] Form '{form_id}' is missing the 'data-netlify' attribute.")
                errors_found += 1

            # Check for form-name input
            if not form.find("input", attrs={"type": "hidden", "name": "form-name"}):
                logger.error(f"✗ [{relative_path}] Form '{form_id}' is missing a hidden 'form-name' input.")
                errors_found += 1

            # Check for name attributes on all inputs
            for field in form.find_all(["input", "textarea", "select"]):
                # submit buttons don't need a name
                if field.get("type") == "submit":
                    continue
                if not field.has_attr("name"):
                    logger.error(f"✗ [{relative_path}] Form '{form_id}' has a field without a 'name' attribute: {str(field)}")
                    errors_found += 1

    if errors_found > 0:
        logger.error(f"\nFound {errors_found} errors in {forms_found} forms.")
        sys.exit(1)
    elif forms_found > 0:
        logger.info(f"\n✓ All {forms_found} found forms appear to be correctly configured for Netlify.")
    else:
        logger.info("\n✓ No forms found to verify.")


@cli.command()
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def verify(root_dir: str):
    """Verify that forms in HTML files are Netlify-ready."""
    root = pathlib.Path(root_dir)
    logger.info(f"Verifying Netlify forms in: {root}")
    forms_found = 0
    errors_found = 0

    for html_path in root.rglob("*.html"):
        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")

        for form in soup.find_all("form"):
            forms_found += 1
            form_id = form.get('id', 'unidentified form')
            relative_path = html_path.relative_to(root)

            # Check for Netlify attribute
            if not form.has_attr("data-netlify"):
                continue  # Not a Netlify form, skip

            # Check for form-name input
            if not form.find("input", attrs={"type": "hidden", "name": "form-name"}):
                logger.error(f"✗ [{relative_path}] Form '{form_id}' is missing a hidden 'form-name' input.")
                errors_found += 1

            # Check for name attributes on all inputs
            for field in form.find_all(["input", "textarea", "select"]):
                # submit buttons don't need a name
                if field.get("type") == "submit":
                    continue
                if not field.has_attr("name"):
                    logger.error(f"✗ [{relative_path}] Form '{form_id}' has a field without a 'name' attribute: {str(field)}")
                    errors_found += 1

    if errors_found > 0:
        logger.error(f"\nFound {errors_found} errors in {forms_found} forms.")
        sys.exit(1)
    elif forms_found > 0:
        logger.info(f"\n✓ All {forms_found} found forms appear to be correctly configured for Netlify.")
    else:
        logger.info("\n✓ No forms found to verify.")


if __name__ == '__main__':
    cli()
