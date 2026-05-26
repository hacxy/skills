#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/Users/hacxy/Projects/skills/skills}"
SKILLS=(write-prd write-tdd scaffold-project write-tests dev code-review test deploy)

log() { echo "[chain-audit] $*" >&2; }

results="[]"

for skill in "${SKILLS[@]}"; do
  SKILL_MD="$PROJECT_DIR/$skill/SKILL.md"
  SCRIPTS_DIR="$PROJECT_DIR/$skill/scripts"

  # 基础存在性
  exists=true
  [ -f "$SKILL_MD" ] || exists=false

  if [ "$exists" = false ]; then
    entry="{\"skill\":\"$skill\",\"exists\":false,\"issues\":[\"SKILL.md not found\"]}"
    results=$(echo "$results" | jq ". + [$entry]")
    continue
  fi

  issues="[]"

  # 检查 frontmatter 字段
  has_name=$(grep -c "^name:" "$SKILL_MD" 2>/dev/null || echo 0)
  has_desc=$(grep -c "^description:" "$SKILL_MD" 2>/dev/null || echo 0)
  [ "$has_name" -eq 0 ] && issues=$(echo "$issues" | jq '. + ["missing name in frontmatter"]')
  [ "$has_desc" -eq 0 ] && issues=$(echo "$issues" | jq '. + ["missing description in frontmatter"]')

  # 检查定位/上下游说明
  has_position=$(grep -c "定位\|上游\|下游\|write-prd\|write-tdd\|scaffold\|dev\|code-review\|test\|deploy" "$SKILL_MD" 2>/dev/null || echo 0)
  [ "$has_position" -eq 0 ] && issues=$(echo "$issues" | jq '. + ["no upstream/downstream position described"]')

  # 检查回退策略
  has_fallback=$(grep -ci "回退\|fallback\|若.*不存在\|若.*缺少\|若.*无\|若以上" "$SKILL_MD" 2>/dev/null || echo 0)
  [ "$has_fallback" -eq 0 ] && issues=$(echo "$issues" | jq '. + ["no fallback strategy described"]')

  # 检查脚本引用是否存在
  broken_scripts="[]"
  if [ -d "$SCRIPTS_DIR" ]; then
    script_count=$(find "$SCRIPTS_DIR" -name "*.sh" | wc -l | tr -d ' ')
    # 检查 SKILL.md 中引用的 .sh 是否在 scripts/ 目录中
    while IFS= read -r ref; do
      script_name=$(basename "$ref")
      [ -f "$SCRIPTS_DIR/$script_name" ] || broken_scripts=$(echo "$broken_scripts" | jq ". + [\"referenced but missing: $script_name\"]")
    done < <(grep -oE 'scripts/[a-z0-9_-]+\.sh' "$SKILL_MD" 2>/dev/null || true)
  else
    script_count=0
  fi
  [ "$broken_scripts" != "[]" ] && issues=$(echo "$issues" | jq ". + $broken_scripts")

  issue_count=$(echo "$issues" | jq 'length')
  status="ok"
  [ "$issue_count" -gt 0 ] && status="issues_found"

  entry=$(cat << EOF
{
  "skill": "$skill",
  "exists": true,
  "status": "$status",
  "script_count": $script_count,
  "issue_count": $issue_count,
  "issues": $issues
}
EOF
)
  results=$(echo "$results" | jq ". + [$entry]")
  log "$skill: $status (issues: $issue_count)"
done

total=$(echo "$results" | jq 'length')
ok_count=$(echo "$results" | jq '[.[] | select(.status == "ok")] | length')
issue_count=$(echo "$results" | jq '[.[] | select(.status == "issues_found")] | length')

echo "$results" | jq "{
  \"skills\": .,
  \"summary\": {
    \"total\": $total,
    \"ok\": $ok_count,
    \"has_issues\": $issue_count
  }
}"
