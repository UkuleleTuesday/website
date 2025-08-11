#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

SITE_DIR="public"
ASSET_ROOT="$SITE_DIR/wp-content"
MODE="unused" # default

if [[ $# -gt 0 ]]; then
  case "$1" in
    --used) MODE="used" ;;
    --unused) MODE="unused" ;;
    *)
      echo "Usage: $0 [--used|--unused]" >&2
      exit 1
      ;;
  esac
fi

command -v rg >/dev/null || { echo "ripgrep (rg) is required" >&2; exit 1; }
[[ -d "$ASSET_ROOT" && -d "$SITE_DIR" ]] || { echo "Check paths: $ASSET_ROOT / $SITE_DIR" >&2; exit 1; }

# temp files
all_assets="$(mktemp)"
used_raw="$(mktemp)"
used_all="$(mktemp)"
trap 'rm -f "$all_assets" "$used_raw" "$used_all" "$used_raw.raw"' EXIT

# collect all assets under wp-content (relative paths from wp-content/)
find "$ASSET_ROOT" -type f | sed "s#^$ASSET_ROOT/##" | sort -u > "$all_assets"

# match anything under wp-content/ in HTML, CSS, JS
PATTERN="wp-content/[^\"'()[:space:]]+"
rg "$PATTERN" -o -i -N --no-line-number "$SITE_DIR" > "$used_raw.raw"

# strip everything before wp-content/, remove query strings
sed 's#.*wp-content/#wp-content/#' "$used_raw.raw" \
  | sed 's#[ ?].*$##' \
  | sed 's#^wp-content/##' \
  | sort -u > "$used_raw"

# normalize: keep exact + strip WP-style size suffixes
cat "$used_raw" <(sed -E 's/-[0-9]{2,4}x[0-9]{2,4}(\.[a-z0-9]+)$/\1/i' "$used_raw") \
  | sort -u > "$used_all"

# output full paths
if [[ "$MODE" == "unused" ]]; then
  comm -23 "$all_assets" "$used_all" | sed "s#^#$ASSET_ROOT/#"
else
  comm -12 "$all_assets" "$used_all" | sed "s#^#$ASSET_ROOT/#"
fi
