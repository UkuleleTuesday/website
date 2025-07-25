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
import sys, pathlib, bs4

root = pathlib.Path(sys.argv[1]).resolve()
total_forms_changed = 0

for html_path in root.rglob("*.html"):
    html = html_path.read_text(encoding="utf‑8", errors="ignore")
    soup = bs4.BeautifulSoup(html, "html.parser")
    file_changed = False

    for form in soup.find_all("form", class_=lambda c: c and "wpcf7-form" in c):
        form_changed = False
        # 1. Netlify attributes
        if not form.has_attr("data-netlify"):
            form["data-netlify"] = "true"
            form["netlify-honeypot"] = "bot-field"
            form_changed = True

        # 2. Hidden 'form-name'
        if not form.find("input", attrs={"name": "form-name"}):
            default_name = form.get("id") or "contact"
            hidden = soup.new_tag("input", attrs={
                "type": "hidden",
                "name": "form-name",
                "value": default_name,
            })
            form.insert(0, hidden)        # as first child
            form_changed = True

        if form_changed:
            file_changed = True
            total_forms_changed += 1
            form_id = form.get('id', 'N/A')
            print(f"✓ Transformed form with id: '{form_id}' in {html_path.relative_to(root)}")

    if file_changed:
        html_path.write_text(str(soup), encoding="utf‑8")

if total_forms_changed > 0:
    print(f"✓ Netlify-formified {total_forms_changed} CF7 form(s) in → {root}")
else:
    print("✓ No CF7 forms found to Netlify-formify.")
