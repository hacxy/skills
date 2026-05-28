#!/usr/bin/env bash
set -euo pipefail

PROJECT_SKILLS_DIR="${1:-$HOME/Projects/skills/skills}"
GLOBAL_SKILLS_DIR="${2:-$HOME/.claude/skills}"

PIPELINE_SKILLS=(pipeline write-prd write-tdd scaffold-project dev code-review test deploy)

log() { echo "[check-health] $*" >&2; }

results="[]"

for skill in "${PIPELINE_SKILLS[@]}"; do
  PROJECT_PATH="$PROJECT_SKILLS_DIR/$skill"
  GLOBAL_PATH="$GLOBAL_SKILLS_DIR/$skill"

  # 存在性检查
  in_project=false
  in_global=false
  [ -d "$PROJECT_PATH" ] && in_project=true
  [ -d "$GLOBAL_PATH" ] && in_global=true

  # 同步检查（diff SKILL.md）
  synced=true
  if [ "$in_project" = true ] && [ "$in_global" = true ]; then
    diff -q "$PROJECT_PATH/SKILL.md" "$GLOBAL_PATH/SKILL.md" > /dev/null 2>&1 || synced=false
  fi

  # 脚本检查
  script_count=0
  broken_scripts="[]"
  if [ "$in_project" = true ] && [ -d "$PROJECT_PATH/scripts" ]; then
    script_count=$(find "$PROJECT_PATH/scripts" -name "*.sh" | wc -l | tr -d ' ')
    broken=()
    while IFS= read -r script; do
      [ -x "$script" ] || broken+=("$(basename "$script")")
    done < <(find "$PROJECT_PATH/scripts" -name "*.sh" 2>/dev/null)
    if [ ${#broken[@]} -gt 0 ]; then
      broken_scripts=$(printf '%s\n' "${broken[@]}" | jq -R . | jq -s .)
    fi
  fi

  # 状态判断
  status="ok"
  [ "$in_project" = false ] || [ "$in_global" = false ] && status="missing"
  [ "$synced" = false ] && status="out_of_sync"
  [ "$broken_scripts" != "[]" ] && status="broken_scripts"

  result=$(cat << EOF
{
  "skill": "$skill",
  "status": "$status",
  "in_project": $in_project,
  "in_global": $in_global,
  "synced": $synced,
  "script_count": $script_count,
  "broken_scripts": $broken_scripts
}
EOF
)
  results=$(echo "$results" | jq ". + [$result]")
done

ok_count=$(echo "$results" | jq '[.[] | select(.status == "ok")] | length')
issue_count=$(echo "$results" | jq '[.[] | select(.status != "ok")] | length')

echo "$results" | jq "{
  \"skills\": .,
  \"summary\": {
    \"total\": ${#PIPELINE_SKILLS[@]},
    \"ok\": $ok_count,
    \"issues\": $issue_count
  }
}"
