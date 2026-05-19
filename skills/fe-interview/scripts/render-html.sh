#!/usr/bin/env bash
set -euo pipefail

# Usage: render-html.sh <template-path> <data-dir> <candidate-name>
# Reads HTML template, replaces placeholders with content from data-dir files,
# writes final HTML to /tmp/ and opens in browser.
#
# Expected files in <data-dir>:
#   candidate_name.txt   — Candidate name
#   question_count.txt   — Total question count
#   level.txt            — Candidate level (e.g., "中级 · 3年经验")
#   date.txt             — Generation date
#   profile.html         — Profile card HTML
#   strategy.html        — Strategy card HTML
#   questions.html       — All questions HTML
#   learning.html        — Learning directions HTML

TEMPLATE_PATH="${1:?Usage: render-html.sh <template-path> <data-dir> <candidate-name>}"
DATA_DIR="${2:?Usage: render-html.sh <template-path> <data-dir> <candidate-name>}"
CANDIDATE_NAME="${3:?Usage: render-html.sh <template-path> <data-dir> <candidate-name>}"

log() { echo "[render-html] $*" >&2; }

if [ ! -f "$TEMPLATE_PATH" ]; then
  log "ERROR: Template not found: $TEMPLATE_PATH"
  echo '{"status":"error","message":"Template not found"}'
  exit 1
fi

if [ ! -d "$DATA_DIR" ]; then
  log "ERROR: Data directory not found: $DATA_DIR"
  echo '{"status":"error","message":"Data directory not found"}'
  exit 1
fi

read_file() {
  local file="$DATA_DIR/$1"
  if [ -f "$file" ]; then
    cat "$file"
  else
    log "WARNING: Missing file $1, using empty string"
    echo ""
  fi
}

log "Reading template and data files"

QUESTION_COUNT=$(read_file "question_count.txt")
LEVEL=$(read_file "level.txt")
DATE=$(read_file "date.txt")
PROFILE_HTML=$(read_file "profile.html")
STRATEGY_HTML=$(read_file "strategy.html")
QUESTIONS_HTML=$(read_file "questions.html")
LEARNING_HTML=$(read_file "learning.html")

OUTPUT_FILE="/tmp/fe-interview-${CANDIDATE_NAME}.html"

log "Assembling HTML"

# Use perl for multi-line replacements (sed can't handle multi-line content reliably)
perl -0777 -pe '
  BEGIN {
    sub slurp { local $/; open my $f, "<", $_[0] or return ""; <$f> }
  }
  s/__CANDIDATE_NAME__/'"$(printf '%s' "$CANDIDATE_NAME" | sed 's/[&/\]/\\&/g')"'/g;
  s/__QUESTION_COUNT__/'"$QUESTION_COUNT"'/g;
  s/__LEVEL__/'"$(printf '%s' "$LEVEL" | sed 's/[&/\]/\\&/g')"'/g;
  s/__DATE__/'"$DATE"'/g;
' "$TEMPLATE_PATH" > "$OUTPUT_FILE.tmp"

# Replace HTML content placeholders using perl with file content
perl -0777 -i -pe '
  BEGIN {
    sub slurp { local $/; open my $f, "<", $_[0] or return ""; my $c = <$f>; $c }
  }
  my $profile = slurp("'"$DATA_DIR"'/profile.html") // "";
  my $strategy = slurp("'"$DATA_DIR"'/strategy.html") // "";
  my $questions = slurp("'"$DATA_DIR"'/questions.html") // "";
  my $learning = slurp("'"$DATA_DIR"'/learning.html") // "";
  s/__PROFILE_HTML__/$profile/g;
  s/__STRATEGY_HTML__/$strategy/g;
  s/__QUESTIONS_HTML__/$questions/g;
  s/__LEARNING_HTML__/$learning/g;
' "$OUTPUT_FILE.tmp"

mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

log "Opening in browser: $OUTPUT_FILE"
open "$OUTPUT_FILE" 2>/dev/null || true

log "Done"
cat << EOF
{
  "status": "ok",
  "output_file": "$OUTPUT_FILE",
  "candidate_name": "$CANDIDATE_NAME"
}
EOF
