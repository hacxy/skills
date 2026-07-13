#!/usr/bin/env python3
"""
Update README.md with changes from skills directory.
"""

import os
import re
import json
from pathlib import Path


def extract_existing_skills(readme_content: str) -> list:
    """Extract existing skills from README table."""
    skills = []
    
    # Find skills table
    table_match = re.search(
        r'\|\s*Skill\s*\|\s*Description\s*\|\s*\n\|[-\s|]+\|\s*\n((?:.*\n)*)',
        readme_content
    )
    
    if not table_match:
        return skills
    
    table_content = table_match.group(1)
    
    # Parse rows
    for row in table_content.strip().split('\n'):
        match = re.match(r'\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*(.+?)\s*\|', row)
        if match:
            skills.append({
                'name': match.group(1),
                'description': match.group(2)
            })
    
    return skills


def update_readme(readme_path: str, skills: list) -> str:
    """Update README.md with new skill data."""
    
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find skills table
    table_pattern = r'(\|\s*Skill\s*\|\s*Description\s*\|\s*\n\|[-\s|]+\|\s*\n)((?:.*\n)*)'
    table_match = re.search(table_pattern, content)
    
    if not table_match:
        # No table found, append one
        return append_skills_table(content, skills)
    
    # Generate new table rows
    new_rows = []
    for skill in skills:
        name = skill['name']
        desc = skill['description']
        path = skill['path']
        new_rows.append(f'| [{name}]({path}/) | {desc} |')
    
    new_table = table_match.group(1) + '\n'.join(new_rows) + '\n'
    
    # Replace table
    updated_content = content[:table_match.start()] + new_table + content[table_match.end():]
    
    return updated_content


def append_skills_table(content: str, skills: list) -> str:
    """Append skills table to README."""
    
    table_lines = [
        '',
        '## Skills',
        '',
        '| Skill | Description |',
        '|-------|-------------|',
    ]
    
    for skill in skills:
        name = skill['name']
        desc = skill['description']
        path = skill['path']
        table_lines.append(f'| [{name}]({path}/) | {desc} |')
    
    table_lines.append('')
    
    return content + '\n'.join(table_lines)


def main():
    """Main entry point."""
    import sys
    
    readme_path = sys.argv[1] if len(sys.argv) > 1 else 'README.md'
    skills_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Load skills
    if skills_file and os.path.exists(skills_file):
        with open(skills_file, 'r') as f:
            skills = json.load(f)
    else:
        skills = json.load(sys.stdin)
    
    # Update README
    if os.path.exists(readme_path):
        updated = update_readme(readme_path, skills)
    else:
        # Create new README
        from generate_readme import generate_readme
        updated = generate_readme(skills)
    
    # Output
    print(updated)


if __name__ == '__main__':
    main()