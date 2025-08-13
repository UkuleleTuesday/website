import os
import shutil
from jinja2 import Environment, FileSystemLoader

# --- Configuration ---
STATIC_DIR = 'static'
TEMPLATES_DIR = 'templates'
OUTPUT_DIR = 'public'

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
    template_files = [
        t for t in env.list_templates()
        if not t.startswith('_') and not t.startswith('.')
    ]

    for template_file in template_files:
        print(f"  - Rendering: {template_file}")
        try:
            template = env.get_template(template_file)
            # You can pass variables to your templates here, e.g., template.render(var='value')
            rendered_html = template.render()

            output_path = os.path.join(OUTPUT_DIR, template_file)

            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(rendered_html)
        except Exception as e:
            print(f"    ERROR rendering {template_file}: {e}")
            # Depending on strictness, you might want to exit here
            # exit(1)

    print("Templates rendered successfully.")
    print("Build process completed.")

if __name__ == "__main__":
    build()
