#!/bin/bash

# List all skills in the current project's skills/ directory
# Usage: ./scripts/list-skills.sh

set -e

SKILLS_DIR="$(cd "$(dirname "$0")/.." && pwd)/skills"

if [ ! -d "$SKILLS_DIR" ]; then
    echo "Error: skills/ directory not found at $SKILLS_DIR"
    exit 1
fi

echo "Skills in $SKILLS_DIR:"
echo "---"

count=0
for skill_dir in "$SKILLS_DIR"/*/; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        skill_file="$skill_dir/SKILL.md"
        
        if [ -f "$skill_file" ]; then
            # Extract description from frontmatter
            description=$(sed -n '/^---$/,/^---$/p' "$skill_file" | grep -E '^description:' | sed 's/^description: *//' | sed 's/^"//' | sed 's/"$//')
            
            if [ -n "$description" ]; then
                echo "  $skill_name - $description"
            else
                echo "  $skill_name - (no description)"
            fi
            count=$((count + 1))
        else
            echo "  $skill_name - (missing SKILL.md)"
        fi
    fi
done

echo "---"
echo "Total: $count skills"