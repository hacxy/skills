#!/bin/bash

# Link a skill from the project's skills/ directory to agent skill directories
# Usage: ./scripts/link-skill.sh [skill-name] [--hermes]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$PROJECT_DIR/skills"
HERMES_SKILLS_DIR="$HOME/.hermes/skills"

# Parse arguments
SYNC_HERMES=false
SKILL_NAME=""

for arg in "$@"; do
    case "$arg" in
        --hermes)
            SYNC_HERMES=true
            ;;
        *)
            SKILL_NAME="$arg"
            ;;
    esac
done

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

# If no skill name provided, show selection menu
if [ -z "$SKILL_NAME" ]; then
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
fi

SOURCE_DIR="$PROJECT_DIR/skills/$SKILL_NAME"
TARGET_DIR="$HOME/.agents/skills/$SKILL_NAME"
HERMES_TARGET_DIR="$HERMES_SKILLS_DIR/$SKILL_NAME"

# Check if source skill exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Skill '$SKILL_NAME' not found at $SOURCE_DIR"
    exit 1
fi

if [ ! -f "$SOURCE_DIR/SKILL.md" ]; then
    echo "Error: SKILL.md not found in $SOURCE_DIR"
    exit 1
fi

# Function to create symlink with conflict handling
create_symlink() {
    local source="$1"
    local target="$2"
    local target_dir="$(dirname "$target")"
    
    # Create target directory if needed
    mkdir -p "$target_dir"
    
    # Check if target already exists
    if [ -e "$target" ]; then
        if [ -L "$target" ]; then
            current_target=$(readlink "$target")
            if [ "$current_target" = "$source" ]; then
                echo "  Already linked: $(basename "$target") -> $source"
                return 0
            else
                echo "  Warning: $(basename "$target") is already linked to $current_target"
                read -p "  Replace? (y/N) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    echo "  Skipped."
                    return 0
                fi
                rm "$target"
            fi
        else
            echo "  Error: $target already exists and is not a symlink"
            read -p "  Remove and replace with symlink? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "  Skipped."
                return 0
            fi
            rm -rf "$target"
        fi
    fi
    
    # Create symlink
    ln -s "$source" "$target"
    echo "  Linked: $(basename "$target") -> $source"
}

# Link to ~/.agents/skills/
echo "Linking to ~/.agents/skills/:"
create_symlink "$SOURCE_DIR" "$TARGET_DIR"

# Ask about Hermes sync if not specified via flag
if [ "$SYNC_HERMES" = false ]; then
    echo ""
    read -p "Also sync to Hermes agent? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SYNC_HERMES=true
    fi
fi

# Link to Hermes if requested
if [ "$SYNC_HERMES" = true ]; then
    echo ""
    echo "Linking to Hermes agent ($HERMES_SKILLS_DIR):"
    if [ ! -d "$HERMES_SKILLS_DIR" ]; then
        echo "  Warning: Hermes skills directory not found at $HERMES_SKILLS_DIR"
        read -p "  Create it? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mkdir -p "$HERMES_SKILLS_DIR"
            create_symlink "$SOURCE_DIR" "$HERMES_TARGET_DIR"
        else
            echo "  Skipped Hermes sync."
        fi
    else
        create_symlink "$SOURCE_DIR" "$HERMES_TARGET_DIR"
    fi
fi

echo ""
echo "Done!"