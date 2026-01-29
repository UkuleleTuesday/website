#!/usr/bin/env bash
# Build the static site locally so `public/` reflects template changes
set -euo pipefail

uv run python build.py

docker run --rm -v "${PWD}:/work" -w /work -it -p 9323:9323 mcr.microsoft.com/playwright:latest /bin/sh -c "npm install && npx playwright test --update-snapshots"