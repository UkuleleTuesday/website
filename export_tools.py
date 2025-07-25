#!/usr/bin/env python3
"""
Static export and processing tools for Ukulele Tuesday website
"""
import difflib
import os
import sys
import time
import pathlib
import shutil
import bs4
import click
import logging
import re
from urllib.parse import urlparse
from export import run_scraper

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
def download(output_dir: str):
    """Export the WordPress site using Scrapy and download the static files."""
    success = run_scraper(output_dir)
    if not success:
        logger.error("✗ Site export failed.")
        sys.exit(1)


@cli.command(name="fix-paths")
@click.argument('root_dir', type=click.Path(exists=True, file_okay=False, resolve_path=True))
def fix_paths(root_dir: str):
    """Convert absolute URLs to root-relative paths in exported files."""
    root = pathlib.Path(root_dir)
    domain = "ukuleletuesday.ie"

    logger.info(f"Converting absolute URLs to relative paths in: {root}")
    total_files_changed = 0

    # Pattern for escaped URLs in JSON/JS: https:\/\/ukuleletuesday.ie
    escaped_url_pattern = re.compile(r'https?:\\/\\/' + re.escape(domain))
    # Pattern for standard URLs: https://ukuleletuesday.ie
    standard_url_pattern = re.compile(r'https?://' + re.escape(domain))

    file_patterns = ["*.html", "*.css", "*.js"]
    files_to_process = []
    for pattern in file_patterns:
        files_to_process.extend(root.rglob(pattern))

    for file_path in files_to_process:
        file_changed = False
        try:
            content = file_path.read_text(encoding="utf-8")
            original_content = content

            # Replace escaped URLs (e.g., in JSON) first
            content = escaped_url_pattern.sub('', content)
            # Replace standard URLs
            content = standard_url_pattern.sub('', content)
            
            if content != original_content:
                file_changed = True
            
            # For HTML files, do a deeper parse with BeautifulSoup
            if file_path.suffix == ".html":
                soup = bs4.BeautifulSoup(content, "html.parser")

                for attr in ['href', 'src', 'content', 'data-lazyload']:
                    for tag in soup.find_all(True, attrs={attr: True}):
                        url = tag[attr]
                        if domain in url:
                            parsed_url = urlparse(url)
                            relative_url = parsed_url.path
                            if parsed_url.query:
                                relative_url += '?' + parsed_url.query
                            
                            if tag[attr] != relative_url:
                                tag[attr] = relative_url
                                file_changed = True
                
                # For srcset, we need to process each part of the string
                for tag in soup.find_all(True, srcset=True):
                    original_srcset = tag['srcset']
                    parts = [p.strip() for p in original_srcset.split(',')]
                    new_parts = []
                    for part in parts:
                        url_part, *descriptor = part.split(' ', 1)
                        if domain in url_part:
                            new_url = urlparse(url_part).path
                            new_parts.append(' '.join([new_url] + descriptor))
                        else:
                            new_parts.append(part)
                    
                    new_srcset = ', '.join(new_parts)
                    if new_srcset != original_srcset:
                        tag['srcset'] = new_srcset
                        file_changed = True
                
                # If BeautifulSoup made changes, update the content
                if file_changed:
                    content = str(soup)

            if file_changed:
                file_path.write_text(content, encoding="utf-8")
                total_files_changed += 1
                logger.info(f"✓ Fixed paths in {file_path.relative_to(root)}")

        except Exception as e:
            logger.error(f"✗ Could not process file {file_path.relative_to(root)}: {e}")

    if total_files_changed > 0:
        logger.info(f"✓ Path fixing complete. Changed {total_files_changed} file(s).")
    else:
        logger.info("✓ No absolute URLs found that needed fixing.")


@click.group(name="netlify-forms")
def netlify_forms():
    """Tools to prepare Contact Form 7 forms for Netlify."""
    pass


@netlify_forms.command()
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

        # Remove any elements with an ID related to contact-form-7
        for cf7_element in soup.find_all(id=lambda i: i and "contact-form-7" in i):
            element_id = cf7_element.get('id')
            tag_name = cf7_element.name
            cf7_element.decompose()
            file_changed = True
            logger.info(f"✓ Removed CF7 {tag_name} element with id '{element_id}' from {html_path.relative_to(root)}")

        # Also remove any remaining scripts by src, just in case
        for cf7_script in soup.find_all("script", src=lambda s: s and "contact-form-7" in s):
            script_src = cf7_script['src']
            cf7_script.decompose()
            file_changed = True
            logger.info(f"✓ Removed CF7 script tag with src: {script_src} from {html_path.relative_to(root)}")

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


def _show_diff(file1_path: pathlib.Path, file2_path: pathlib.Path):
    """Prints a formatted diff for two files."""
    click.echo(f"--- Diff for {file1_path.name} ---")
    try:
        text1 = file1_path.read_text(encoding='utf-8').splitlines()
        text2 = file2_path.read_text(encoding='utf-8').splitlines()
        diff = difflib.unified_diff(
            text1,
            text2,
            fromfile=str(file1_path),
            tofile=str(file2_path),
            lineterm=''
        )
        for line in diff:
            if line.startswith('+'):
                click.secho(line, fg='green')
            elif line.startswith('-'):
                click.secho(line, fg='red')
            elif line.startswith('^'):
                click.secho(line, fg='blue')
            else:
                click.echo(line)
    except UnicodeDecodeError:
        click.echo(f"Binary files {file1_path} and {file2_path} differ")
    click.echo("-" * (20 + len(str(file1_path.name))))


@cli.command(name="diff-exports")
@click.argument('path1_arg', type=click.Path(exists=True, file_okay=True, resolve_path=True))
@click.argument('path2_arg', type=click.Path(exists=True, file_okay=True, resolve_path=True))
def diff_exports(path1_arg: str, path2_arg: str):
    """Compares two files or directories and lists content differences."""
    path1 = pathlib.Path(path1_arg)
    path2 = pathlib.Path(path2_arg)

    # --- File-to-File comparison ---
    if path1.is_file() and path2.is_file():
        logger.info(f"Comparing files:\n- {path1}\n- {path2}")
        if path1.read_bytes() != path2.read_bytes():
            _show_diff(path1, path2)
            logger.warning("\n✗ Files have differences.")
            sys.exit(1)
        else:
            logger.info("\n✓ Files are identical.")
            sys.exit(0)

    # --- Directory-to-Directory comparison ---
    elif path1.is_dir() and path2.is_dir():
        logger.info(f"Comparing directories:\n- {path1}\n- {path2}")
        files1 = {p.relative_to(path1) for p in path1.rglob('*') if p.is_file()}
        files2 = {p.relative_to(path2) for p in path2.rglob('*') if p.is_file()}

        only_in_1 = files1 - files2
        only_in_2 = files2 - files1
        common_files = files1 & files2
        has_diff = False

        if only_in_1:
            has_diff = True
            logger.info(f"\n--- Files only in {path1} ---")
            for f in sorted(only_in_1):
                click.echo(f)

        if only_in_2:
            has_diff = True
            logger.info(f"\n--- Files only in {path2} ---")
            for f in sorted(only_in_2):
                click.echo(f)

        diff_files = []
        for f in sorted(common_files):
            file1_path = path1 / f
            file2_path = path2 / f
            if file1_path.read_bytes() != file2_path.read_bytes():
                has_diff = True
                diff_files.append((file1_path, file2_path))

        if diff_files:
            logger.info("\n--- Content differences found in the following files ---")
            for file1_path, file2_path in diff_files:
                _show_diff(file1_path, file2_path)

        if not has_diff:
            logger.info("\n✓ Directories are identical.")
        else:
            logger.warning("\n✗ Directories have differences.")
            sys.exit(1)
            
    # --- Invalid argument combination ---
    else:
        logger.error("✗ Incompatible arguments: both must be files or both must be directories.")
        sys.exit(1)


cli.add_command(netlify_forms)

if __name__ == '__main__':
    cli()
