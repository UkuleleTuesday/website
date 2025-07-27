#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the output directory
OUTPUT_DIR="./static-export"

# --- Step 1: Download latest export from GCS ---
echo "--- Downloading latest export from GCS ---"
mkdir -p "$OUTPUT_DIR"
gsutil -m rsync -r gs://ukulele-tuesday-website-wordpress-static-export/latest "$OUTPUT_DIR"
echo "✓ Download complete."

# --- Step 2: Fix paths in static site ---
echo -e "\n--- Fixing paths in static site ---"
uv run export_tools.py fix-paths "$OUTPUT_DIR"

# --- Step 3: Fix forms ---
echo -e "\n--- Fixing forms ---"
echo "Fixing forms for Netlify (excluding WhatsApp)..."
uv run export_tools.py fix-forms "$OUTPUT_DIR" --add-netlify --exclude "$OUTPUT_DIR/whatsapp"
echo "Fixing forms for WhatsApp (without Netlify)..."
uv run export_tools.py fix-forms "$OUTPUT_DIR/whatsapp"

# --- Step 4: Copy extra assets ---
echo -e "\n--- Copying extra assets ---"
if [ -d "./extra-assets" ]; then
  cp -r ./extra-assets/* "$OUTPUT_DIR/"
  echo "✓ Copied extra assets to $OUTPUT_DIR"
else
  echo "No extra-assets directory found, skipping"
fi

echo -e "\n✅ Static site build complete in $OUTPUT_DIR"
