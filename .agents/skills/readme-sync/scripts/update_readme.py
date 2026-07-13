#!/usr/bin/env python3
"""
Update README.md and README.zh.md with changes from skills directory.
"""

import os
import re
import json
from pathlib import Path


def extract_existing_skills(readme_content: str, lang: str = 'en') -> list:
    """Extract existing skills from README table."""
    skills = []
    
    # Find skills table based on language
    if lang == 'zh':
        table_match = re.search(
            r'\|\s*技能\s*\|\s*描述\s*\|\s*\n\|[-\s|]+\|\s*\n((?:.*\n)*)',
            readme_content
        )
    else:
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


def update_readme(readme_path: str, skills: list, lang: str = 'en') -> str:
    """Update README.md with new skill data."""
    
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find skills table based on language
    if lang == 'zh':
        table_pattern = r'(\|\s*技能\s*\|\s*描述\s*\|\s*\n\|[-\s|]+\|\s*\n)((?:.*\n)*)'
    else:
        table_pattern = r'(\|\s*Skill\s*\|\s*Description\s*\|\s*\n\|[-\s|]+\|\s*\n)((?:.*\n)*)'
    
    table_match = re.search(table_pattern, content)
    
    if not table_match:
        # No table found, append one
        return append_skills_table(content, skills, lang)
    
    # Generate new table rows
    new_rows = []
    for skill in skills:
        name = skill['name']
        # Use appropriate description based on language
        if lang == 'zh':
            desc = skill.get('description_zh', skill.get('description', ''))
        else:
            desc = skill.get('description', '')
        path = skill['path']
        new_rows.append(f'| [{name}]({path}/) | {desc} |')
    
    new_table = table_match.group(1) + '\n'.join(new_rows) + '\n'
    
    # Replace table
    updated_content = content[:table_match.start()] + new_table + content[table_match.end():]
    
    return updated_content


def append_skills_table(content: str, skills: list, lang: str = 'en') -> str:
    """Append skills table to README."""
    
    if lang == 'zh':
        table_lines = [
            '',
            '## 可用技能',
            '',
            '| 技能 | 描述 |',
            '|------|------|',
        ]
    else:
        table_lines = [
            '',
            '## Skills',
            '',
            '| Skill | Description |',
            '|-------|-------------|',
        ]
    
    for skill in skills:
        name = skill['name']
        if lang == 'zh':
            desc = skill.get('description_zh', skill.get('description', ''))
        else:
            desc = skill.get('description', '')
        path = skill['path']
        table_lines.append(f'| [{name}]({path}/) | {desc} |')
    
    table_lines.append('')
    
    return content + '\n'.join(table_lines)


def main():
    """Main entry point."""
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='Update README with skill metadata')
    parser.add_argument('--readme', default='README.md', help='Path to README.md')
    parser.add_argument('--lang', choices=['en', 'zh'], default='en', help='Language')
    parser.add_argument('skills_file', nargs='?', help='JSON file with skills metadata')
    
    args = parser.parse_args()
    
    # Load skills
    if args.skills_file and os.path.exists(args.skills_file):
        with open(args.skills_file, 'r') as f:
            skills = json.load(f)
    else:
        skills = json.load(sys.stdin)
    
    # Update README
    if os.path.exists(args.readme):
        updated = update_readme(args.readme, skills, args.lang)
    else:
        # Create new README
        from generate_readme import generate_readme
        updated = generate_readme(skills, lang=args.lang)
    
    # Output
    print(updated)


if __name__ == '__main__':
    main()