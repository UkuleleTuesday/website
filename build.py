import os
import re
import shutil
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from jinja2 import Environment, FileSystemLoader

# --- Configuration ---
STATIC_DIR = 'static'
TEMPLATES_DIR = 'templates'
OUTPUT_DIR = 'public'
SITEMAPS_DIR = 'sitemaps'

ARTICLE_MODIFIED_TIME_PATTERN = re.compile(
    r'{%\s*block article_modified_time\s*%}\s*(.*?)\s*{%\s*endblock\s*%}',
    re.DOTALL,
)


def generate_breadcrumbs(path):
    """
    Generates breadcrumbs from a template file path.
    e.g., 'concerts/index.html' -> [{'name': 'Home', 'url': '/'}, {'name': 'Concerts', 'url': '/concerts/'}]
    """
    breadcrumbs = [{'name': 'Home', 'url': '/'}]
    if path == 'index.html':
        return breadcrumbs

    # Get the directory part of the path, e.g., 'concerts' from 'concerts/index.html'
    directory = os.path.dirname(path)
    if directory:
        # Capitalize the first letter for the name, e.g., 'Concerts'
        name = directory.replace('-', ' ').title()
        # Create a URL-friendly path, e.g., '/concerts/'
        url = f'/{directory}/'
        breadcrumbs.append({'name': name, 'url': url})

    return breadcrumbs


def get_template_files(env):
    return sorted(
        t for t in env.list_templates()
        if t.endswith('.html') and not t.startswith('_') and not t.startswith('.')
    )


def extract_article_modified_time(template_file):
    template_path = Path(TEMPLATES_DIR, template_file)
    content = template_path.read_text(encoding='utf-8')
    match = ARTICLE_MODIFIED_TIME_PATTERN.search(content)
    if match:
        return match.group(1).strip()
    return None


def write_text_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def generate_sitemaps(template_files, base_url):
    page_entries = []
    for template_file in template_files:
        page_url = generate_breadcrumbs(template_file)[-1]['url']
        page_entry = {
            'loc': f"{base_url.rstrip('/')}{page_url}",
            'lastmod': extract_article_modified_time(template_file),
        }
        page_entries.append(page_entry)

    latest_lastmod = max(
        (entry['lastmod'] for entry in page_entries if entry['lastmod']),
        default=None,
    )

    page_sitemap_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for entry in page_entries:
        page_sitemap_lines.extend([
            '  <url>',
            f"    <loc>{escape(entry['loc'])}</loc>",
        ])
        if entry['lastmod']:
            page_sitemap_lines.append(f"    <lastmod>{escape(entry['lastmod'])}</lastmod>")
        page_sitemap_lines.append('  </url>')
    page_sitemap_lines.append('</urlset>')

    sitemap_loc = f"{base_url.rstrip('/')}/sitemaps/page-sitemap.xml"
    sitemap_index_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <sitemap>',
        f'    <loc>{escape(sitemap_loc)}</loc>',
    ]
    if latest_lastmod:
        sitemap_index_lines.append(f'    <lastmod>{escape(latest_lastmod)}</lastmod>')
    sitemap_index_lines.extend([
        '  </sitemap>',
        '</sitemapindex>',
    ])

    output_sitemaps_dir = os.path.join(OUTPUT_DIR, SITEMAPS_DIR)
    write_text_file(
        os.path.join(output_sitemaps_dir, 'page-sitemap.xml'),
        '\n'.join(page_sitemap_lines) + '\n',
    )
    sitemap_index_content = '\n'.join(sitemap_index_lines) + '\n'
    write_text_file(os.path.join(output_sitemaps_dir, 'sitemap.xml'), sitemap_index_content)
    write_text_file(os.path.join(output_sitemaps_dir, 'sitemap_index.xml'), sitemap_index_content)


def build():
    """
    Builds the static site by copying static files and rendering Jinja2 templates.
    """
    print("Starting build process...")

    # 1. Clean up the output directory if it exists
    if os.path.exists(OUTPUT_DIR):
        print(f"Removing existing output directory: {OUTPUT_DIR}")
        shutil.rmtree(OUTPUT_DIR)

    # 2. Copy static files from `static` to `public`
    print(f"Copying static assets from '{STATIC_DIR}' to '{OUTPUT_DIR}'...")
    shutil.copytree(STATIC_DIR, OUTPUT_DIR, dirs_exist_ok=True)
    print("Static assets copied successfully.")

    # 3. Render Jinja2 templates from `templates` into `public`
    print(f"Rendering templates from '{TEMPLATES_DIR}' to '{OUTPUT_DIR}'...")
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

    # Get all templates, but filter out partials and layouts
    template_files = get_template_files(env)

    # Enable analytics only in production builds
    analytics_enabled = os.environ.get('ENABLE_ANALYTICS') == 'true'
    if analytics_enabled:
        print("Analytics will be enabled for this build.")
    else:
        print("Analytics will be disabled for this build.")

    # Enable calendar by default; set ENABLE_CALENDAR=false to disable (e.g. for local development)
    calendar_enabled = os.environ.get('ENABLE_CALENDAR', 'true') != 'false'
    if calendar_enabled:
        print("Calendar will be enabled for this build.")
    else:
        print("Calendar will be disabled for this build.")

    # Base URL for absolute paths in SEO data.
    # Use BASE_URL, with a sane default.
    base_url = os.environ.get('BASE_URL', 'https://www.ukuleletuesday.ie')
    print(f"Using base URL: {base_url}")

    errors = []
    for template_file in template_files:
        print(f"  - Rendering: {template_file}")
        try:
            template = env.get_template(template_file)

            # Generate breadcrumbs and page URL for the current template
            breadcrumbs = generate_breadcrumbs(template_file)
            page_url = breadcrumbs[-1]['url']

            # You can pass variables to your templates here, e.g., template.render(var='value')
            rendered_html = template.render(
                analytics_enabled=analytics_enabled,
                calendar_enabled=calendar_enabled,
                base_url=base_url,
                breadcrumbs=breadcrumbs,
                page_url=page_url
            )

            output_path = os.path.join(OUTPUT_DIR, template_file)

            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(rendered_html)
        except Exception as e:
            error_message = f"    ERROR rendering {template_file}: {e}"
            print(error_message)
            errors.append(error_message)

    if errors:
        print(f"\nBuild failed with {len(errors)} error(s).")
        sys.exit(1)

    generate_sitemaps(template_files, base_url)
    print("Templates rendered successfully.")
    print("Build process completed.")

if __name__ == "__main__":
    build()
