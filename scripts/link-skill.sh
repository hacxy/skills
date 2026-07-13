#!/bin/bash

# Link a skill from the project's skills/ directory to ~/.agents/skills/
# Usage: ./scripts/link-skill.sh [skill-name]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$PROJECT_DIR/skills"

# Collect available skills
skills=()
for skill_dir in "$SKILLS_DIR"/*/; do
    if [ -d "$skill_dir" ] && [ -f "$skill_dir/SKILL.md" ]; then
        skills+=("$(basename "$skill_dir")")
    fi
done

if [ ${#skills[@]} -eq 0 ]; then
    echo "Error: No skills found in $SKILLS_DIR"
    exit 1
fi

# If no argument provided, show selection menu
if [ -z "$1" ]; then
    echo "Select a skill to link:"
    echo ""
    for i in "${!skills[@]}"; do
        echo "  $((i+1))) ${skills[$i]}"
    done
    echo ""
    read -p "Enter number (1-${#skills[@]}): " choice
    
    if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#skills[@]} ]; then
        echo "Error: Invalid selection"
        exit 1
    fi
    
    SKILL_NAME="${skills[$((choice-1))]}"
else
    SKILL_NAME="$1"
fi

SOURCE_DIR="$PROJECT_DIR/skills/$SKILL_NAME"
TARGET_DIR="$HOME/.agents/skills/$SKILL_NAME"

# Check if source skill exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Skill '$SKILL_NAME' not found at $SOURCE_DIR"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/SKILL.md" ]; then
    echo "Error: SKILL.md not found in $SOURCE_DIR"
    exit 1
fi

# Create target directory if needed
mkdir -p "$HOME/.agents/skills"

# Check if target already exists
if [ -e "$TARGET_DIR" ]; then
    if [ -L "$TARGET_DIR" ]; then
        current_target=$(readlink "$TARGET_DIR")
        if [ "$current_target" = "$SOURCE_DIR" ]; then
            echo "Already linked: $SKILL_NAME -> $SOURCE_DIR"
            exit 0
        else
            echo "Warning: $SKILL_NAME is already linked to $current_target"
            read -p "Replace? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Cancelled."
                exit 0
            fi
            rm "$TARGET_DIR"
        fi
    else
        echo "Error: $TARGET_DIR already exists and is not a symlink"
        read -p "Remove and replace with symlink? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
        rm -rf "$TARGET_DIR"
    fi
fi

# Create symlink
ln -s "$SOURCE_DIR" "$TARGET_DIR"
echo "Linked: $SKILL_NAME -> $SOURCE_DIR"