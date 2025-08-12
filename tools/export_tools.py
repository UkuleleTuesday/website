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
@click.option('--exclude', 'exclude_paths', multiple=True, type=click.Path(),
              help='File or directory paths to exclude. Can be used multiple times.')
def fix_paths(root_dir: str, exclude_paths: tuple[str, ...]):
    """Fix paths in the exported static site."""
    root = pathlib.Path(root_dir)
    absolute_exclude_paths = {pathlib.Path(p).resolve() for p in exclude_paths}

    logger.info(f"Fixing paths in: {root}")
    if exclude_paths:
        logger.info(f"Excluding paths: {', '.join(exclude_paths)}")

    # Regex to find /wp-admin/admin-ajax.php followed by any query string.
    ajax_search_pattern = re.compile(r"/wp-admin/admin-ajax\.php\?[^\"'\s]+")
    ajax_replace_str = "/wp-admin/admin-ajax.css"

    # Regex to find .js files with query parameters
    js_search_pattern = re.compile(r'(\.js)\?[^"\'\s]+')
    js_replace_str = r'\1'

    files_changed = 0

    for html_path in root.rglob("*.html"):
        if any(
            html_path.resolve() == p or p in html_path.resolve().parents
            for p in absolute_exclude_paths
        ):
            logger.info(f"Skipping excluded file: {html_path.relative_to(root)}")
            continue

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


@cli.command(name="fix-forms")
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
@click.option('--add-netlify', is_flag=True, help='Add Netlify-specific attributes to forms.')
@click.option('--exclude', 'exclude_paths', multiple=True, type=click.Path(),
              help='File or directory paths to exclude. Can be used multiple times.')
def fix_forms(root_dir: str, add_netlify: bool, exclude_paths: tuple[str, ...]):
    """Fix forms by removing CF7 assets and optionally adding Netlify support."""
    root = pathlib.Path(root_dir)
    absolute_exclude_paths = {pathlib.Path(p).resolve() for p in exclude_paths}

    logger.info(f"Fixing forms in: {root}")
    if add_netlify:
        logger.info("Netlify support enabled.")
    if exclude_paths:
        logger.info(f"Excluding paths: {', '.join(exclude_paths)}")

    total_files_changed = 0

    for html_path in root.rglob("*.html"):
        if any(
            html_path.resolve() == p or p in html_path.resolve().parents
            for p in absolute_exclude_paths
        ):
            logger.info(f"Skipping excluded file: {html_path.relative_to(root)}")
            continue

        html = html_path.read_text(encoding="utf‑8", errors="ignore")
        soup = bs4.BeautifulSoup(html, "html.parser")
        file_changed = False

        # --- CF7 Cleanup (always runs) ---

        # Remove Turnstile script tags
        for turnstile_script in soup.find_all("script", src=lambda s: s and "challenges.cloudflare.com/turnstile" in s):
            turnstile_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed Cloudflare Turnstile script from {html_path.relative_to(root)}")

        # Remove elements with an ID related to contact-form-7
        for cf7_element in soup.find_all(id=lambda i: i and "contact-form-7" in i):
            element_id = cf7_element.get('id', 'N/A')
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

        # Process all forms
        for form in soup.find_all("form"):
            form_changed = False
            form_id = form.get('id', 'N/A')

            # --- Universal Form Fixes ---

            # Remove action attribute
            if form.has_attr("action"):
                del form["action"]
                form_changed = True
                logger.info(f"✓ Removed action attribute from form '{form_id}' in {html_path.relative_to(root)}")

            # Remove WPCF7 hidden fields
            for wpcf7_field in form.find_all("input", attrs={"name": re.compile(r"^_wpcf7")}):
                field_name = wpcf7_field.get('name')
                parent = wpcf7_field.parent
                wpcf7_field.decompose()
                form_changed = True
                logger.info(f"✓ Removed WPCF7 hidden field '{field_name}' from form '{form_id}' in {html_path.relative_to(root)}")

                # If the parent is an empty fieldset, remove it too
                if parent and parent.name == 'fieldset' and not parent.get_text(strip=True) and not parent.find_all(True, recursive=False):
                    parent.decompose()
                    logger.info(f"✓ Removed empty fieldset that contained '{field_name}' in {html_path.relative_to(root)}")

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

            # --- WhatsApp-specific form modifications ---
            if slug_form_name == 'whatsapp':
                # Set form ID for JS targeting
                if form.get('id') != 'whatsapp-form':
                    form['id'] = 'whatsapp-form'
                    form_changed = True
                    logger.info(f"✓ Set form ID to 'whatsapp-form' in {html_path.relative_to(root)}")

                # Ensure result div exists after the form
                if not form.find_next_sibling("div", id="form-result"):
                    result_div = soup.new_tag("div", id="form-result")
                    form.insert_after(result_div)
                    file_changed = True # Mark file as changed
                    logger.info(f"✓ Added result div in {html_path.relative_to(root)}")

                # Add script tag for whatsapp.js if it doesn't exist
                if soup.body and not soup.body.find("script", src="/whatsapp.js"):
                    script_tag = soup.new_tag("script", src="/whatsapp.js", defer=True)
                    soup.body.append(script_tag)
                    file_changed = True # Mark file as changed
                    logger.info(f"✓ Added whatsapp.js script to {html_path.relative_to(root)}")

            # --- Netlify-specific additions ---
            if add_netlify:
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
                logger.info(f"✓ Processed form '{form_id}' in {html_path.relative_to(root)}")

        if file_changed:
            # Inject CSS to hide the honeypot field if Netlify is enabled and not already present
            if add_netlify and soup.head and not soup.head.find("style", string=".hidden { display: none; }"):
                style_tag = soup.new_tag('style')
                style_tag.string = ".hidden { display: none; }"
                soup.head.append(style_tag)

            total_files_changed += 1
            html_path.write_text(str(soup), encoding="utf-8")

    if total_files_changed > 0:
        logger.info(f"\n✓ Processed {total_files_changed} file(s) in → {root}")
    else:
        logger.info("\n✓ No files required changes.")
if __name__ == '__main__':
    cli()
