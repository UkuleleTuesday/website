#!/usr/bin/env python3
"""
Static export and processing tools for Ukulele Tuesday website
"""
import os
import sys
import time
import pathlib
import shutil
import re
import bs4
import click
import logging
from export import StaticExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """Ukulele Tuesday static site export and processing tool."""
    pass


@cli.command()
@click.option('-o', '--output', 'output_dir', required=True,
              help='Output directory for the extracted static site')
@click.option('--num-retries', 'num_retries', default=0, type=int,
              help='Number of times to retry the export on failure')
def download(output_dir: str, num_retries: int):
    """Export the WordPress site and download the static files."""
    exporter = StaticExporter(
        base_url="https://ukuleletuesday.ie/wp-json/simplystatic/v1",
        username=os.getenv('WP_USERNAME'),
        password=os.getenv('WP_PASSWORD')
    )

    success = False
    for i in range(num_retries + 1):
        attempt = i + 1
        logger.info(f"--- Starting export attempt {attempt}/{num_retries + 1} ---")
        success = exporter.run_download(output_dir)

        if success:
            break

        if i < num_retries:
            retry_wait_seconds = 10
            logger.warning(f"Attempt {attempt} failed. Retrying in {retry_wait_seconds} seconds...")
            time.sleep(retry_wait_seconds)

    if not success:
        logger.error("✗ All export attempts failed.")
        sys.exit(1)


@cli.command(name="fix-paths")
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def fix_paths(root_dir: str):
    """Fix paths in the exported static site."""
    root = pathlib.Path(root_dir)
    logger.info(f"Fixing paths in: {root}")

    # Regex to find /wp-admin/admin-ajax.php followed by any query string.
    ajax_search_pattern = re.compile(r"/wp-admin/admin-ajax\.php\?[^\"'\s]+")
    ajax_replace_str = "/wp-admin/admin-ajax.css"

    # Regex to find .js files with query parameters
    js_search_pattern = re.compile(r'(\.js)\?[^"\'\s]+')
    js_replace_str = r'\1'

    files_changed = 0

    for html_path in root.rglob("*.html"):
        try:
            content = html_path.read_text(encoding="utf-8")
            made_change = False

            # Fix admin-ajax.php paths
            content, num_ajax_subs = ajax_search_pattern.subn(ajax_replace_str, content)
            if num_ajax_subs > 0:
                logger.info(f"✓ Fixed {num_ajax_subs} admin-ajax.php path(s) in {html_path.relative_to(root)}")
                made_change = True

            # Fix .js paths with query parameters
            content, num_js_subs = js_search_pattern.subn(js_replace_str, content)
            if num_js_subs > 0:
                logger.info(f"✓ Removed query params from {num_js_subs} JS path(s) in {html_path.relative_to(root)}")
                made_change = True

            if made_change:
                html_path.write_text(content, encoding="utf-8")
                files_changed += 1

        except Exception as e:
            logger.error(f"✗ Could not process file {html_path.relative_to(root)}: {e}")

    if files_changed > 0:
        logger.info(f"✓ Fixed paths in {files_changed} file(s).")
    else:
        logger.info("✓ No paths needed fixing.")


@click.group(name="netlify-forms")
def netlify_forms():
    """Tools to prepare Contact Form 7 forms for Netlify."""
    pass


@netlify_forms.command(name="remove-cf7")
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def remove_cf7(root_dir: str):
    """Remove Contact Form 7 and Cloudflare Turnstile assets from HTML files."""
    root = pathlib.Path(root_dir)
    logger.info(f"Scanning for CF7 assets to remove in: {root}")
    total_files_changed = 0

    for html_path in root.rglob("*.html"):
        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")
        file_changed = False

        # Remove Turnstile script tags
        for turnstile_script in soup.find_all("script", src=lambda s: s and "challenges.cloudflare.com/turnstile" in s):
            turnstile_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed Cloudflare Turnstile script from {html_path.relative_to(root)}")

        # Remove elements with an ID related to contact-form-7
        for cf7_element in soup.find_all(id=lambda i: i and "contact-form-7" in i):
            element_id = cf7_element.get('id')
            tag_name = cf7_element.name
            cf7_element.decompose()
            file_changed = True
            logger.info(f"✓ Removed CF7 {tag_name} element with id '{element_id}' from {html_path.relative_to(root)}")

        # Remove CF7 script tags
        for cf7_script in soup.find_all("script", src=lambda s: s and "contact-form-7" in s):
            script_src = cf7_script['src']
            cf7_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed CF7 script tag with src: {script_src} from {html_path.relative_to(root)}")

        # Process forms inside wpcf7 containers
        for form_container in soup.find_all("div", class_="wpcf7"):
            form = form_container.find("form")
            if not form:
                continue
            
            form_id = form.get('id', 'N/A')

            # Remove Cloudflare Turnstile divs
            turnstile_divs = form.find_all("div", class_=["cf-turnstile", "cf7-cf-turnstile"])
            if turnstile_divs:
                for turnstile_div in turnstile_divs:
                    class_name = turnstile_div.get('class', 'N/A')
                    turnstile_div.decompose()
                    file_changed = True
                    logger.info(f"✓ Removed Cloudflare Turnstile div with class '{class_name}' from form '{form_id}' in {html_path.relative_to(root)}")

            # Remove WPCF7 hidden fields
            for wpcf7_field in form.find_all("input", attrs={"name": re.compile(r"^_wpcf7")}):
                field_name = wpcf7_field.get('name')
                parent = wpcf7_field.parent
                wpcf7_field.decompose()
                file_changed = True
                logger.info(f"✓ Removed WPCF7 hidden field '{field_name}' from form '{form_id}' in {html_path.relative_to(root)}")

                # If the parent is an empty fieldset, remove it too
                if parent and parent.name == 'fieldset' and not parent.get_text(strip=True) and not parent.find_all(True, recursive=False):
                    parent.decompose()
                    logger.info(f"✓ Removed empty fieldset that contained '{field_name}' in {html_path.relative_to(root)}")

        if file_changed:
            total_files_changed += 1
            html_path.write_text(str(soup), encoding="utf-8")
    
    if total_files_changed > 0:
        logger.info(f"\n✓ Removed CF7 assets from {total_files_changed} file(s) in → {root}")
    else:
        logger.info("\n✓ No CF7 assets found to remove.")


@netlify_forms.command(name="add-netlify-support")
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def add_netlify_support(root_dir: str):
    """Rewrite forms in HTML files to add Netlify support."""
    root = pathlib.Path(root_dir)
    logger.info(f"Scanning for forms to add Netlify support in: {root}")
    total_forms_changed = 0

    for html_path in root.rglob("*.html"):
        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")
        file_changed = False

        # Find all forms, not just those in wpcf7 divs
        for form in soup.find_all("form"):
            form_changed = False
            form_id = form.get('id', 'N/A')

            # Determine form name from slug
            if html_path.name == "index.html":
                slug_form_name = html_path.parent.name
            else:
                slug_form_name = html_path.stem

            # Find or create hidden 'form-name' input and set form name
            hidden_form_name_input = form.find("input", attrs={"name": "form-name"})
            if hidden_form_name_input and hidden_form_name_input.get("value"):
                form_name = hidden_form_name_input["value"]
            else:
                if not hidden_form_name_input:
                    hidden_form_name_input = soup.new_tag("input", attrs={"type": "hidden", "name": "form-name"})
                    form.insert(0, hidden_form_name_input)
                
                form_name = slug_form_name
                hidden_form_name_input["value"] = form_name
                form_changed = True

            # Set form 'name' attribute
            if form.get("name") != form_name:
                form["name"] = form_name
                form_changed = True

            # Remove action attribute
            if form.has_attr("action"):
                del form["action"]
                form_changed = True

            # Add Netlify attributes
            if not form.has_attr("data-netlify"):
                form["data-netlify"] = "true"
                form["netlify-honeypot"] = "bot-field"
                form_changed = True

            # Add honeypot field
            if not form.find("input", attrs={"name": "bot-field"}):
                hidden_p = soup.new_tag("p", attrs={"class": "hidden"})
                label = soup.new_tag("label")
                label.string = "Don’t fill this out if you’re human: "
                bot_input = soup.new_tag("input", attrs={"name": "bot-field", "type": "text"})
                label.append(bot_input)
                hidden_p.append(label)
                form.append(hidden_p)
                form_changed = True

            if form_changed:
                file_changed = True
                total_forms_changed += 1
                logger.info(f"✓ Transformed form with id: '{form_id}' in {html_path.relative_to(root)}")

        if file_changed:
            # Inject CSS to hide the honeypot field if not already present
            if soup.head and not soup.head.find("style", string=".hidden { display: none; }"):
                style_tag = soup.new_tag('style')
                style_tag.string = ".hidden { display: none; }"
                soup.head.append(style_tag)

            html_path.write_text(str(soup), encoding="utf‑8")

    if total_forms_changed > 0:
        logger.info(f"\n✓ Added Netlify support to {total_forms_changed} form(s) in → {root}")
    else:
        logger.info("\n✓ No forms found to modify for Netlify.")


@netlify_forms.command()
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
            form_id = form.get('id', 'unidentified form')
            relative_path = html_path.relative_to(root)

            # Check for Netlify attribute
            if not form.has_attr("data-netlify"):
                continue  # Not a Netlify form, skip

            forms_found += 1

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


cli.add_command(netlify_forms)

if __name__ == '__main__':
    cli()
