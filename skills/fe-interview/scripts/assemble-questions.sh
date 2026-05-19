#!/usr/bin/env bash
set -euo pipefail

# Usage: assemble-questions.sh <fragments-dir> <output-file>
# Concatenates all question fragment files (sorted by filename) into a single HTML file.
# Fragment files should be named with a numeric prefix for ordering (e.g., 01-js-core.html, 02-typescript.html).
FRAGMENTS_DIR="${1:?Usage: assemble-questions.sh <fragments-dir> <output-file>}"
OUTPUT_FILE="${2:?Usage: assemble-questions.sh <fragments-dir> <output-file>}"

log() { echo "[assemble-questions] $*" >&2; }

if [ ! -d "$FRAGMENTS_DIR" ]; then
  log "ERROR: Fragments directory not found: $FRAGMENTS_DIR"
  echo '{"status":"error","message":"Fragments directory not found"}'
  exit 1
fi

FRAGMENT_COUNT=$(find "$FRAGMENTS_DIR" -name "*.html" -type f | wc -l | tr -d ' ')

if [ "$FRAGMENT_COUNT" -eq 0 ]; then
  log "ERROR: No .html fragment files found in $FRAGMENTS_DIR"
  echo '{"status":"error","message":"No fragment files found"}'
  exit 1
fi

log "Assembling $FRAGMENT_COUNT fragments"

> "$OUTPUT_FILE"
for f in $(find "$FRAGMENTS_DIR" -name "*.html" -type f | sort); do
  log "  + $(basename "$f")"
  cat "$f" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

log "Done. Output: $OUTPUT_FILE"
cat << EOF
{
  "status": "ok",
  "fragment_count": $FRAGMENT_COUNT,
  "output_file": "$OUTPUT_FILE"
}
EOF
