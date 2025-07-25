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

for html_path in root.rglob("*.html"):
    html = html_path.read_text(encoding="utf‑8", errors="ignore")
    soup = bs4.BeautifulSoup(html, "html.parser")
    changed = False

    for form in soup.find_all("form", class_=lambda c: c and "wpcf7-form" in c):
        # 1. Netlify attributes
        if not form.has_attr("data-netlify"):
            form["data-netlify"] = "true"
            form["netlify-honeypot"] = "bot-field"
            changed = True

        # 2. Hidden 'form-name'
        if not form.find("input", attrs={"name": "form-name"}):
            default_name = form.get("id") or "contact"
            hidden = soup.new_tag("input", attrs={
                "type": "hidden",
                "name": "form-name",
                "value": default_name,
            })
            form.insert(0, hidden)        # as first child
            changed = True

    if changed:
        html_path.write_text(str(soup), encoding="utf‑8")

print("✓ Netlify‑formified CF7 →", root)
