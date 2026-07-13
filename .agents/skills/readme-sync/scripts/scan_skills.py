#!/usr/bin/env python3
"""
Scan skills directory and extract metadata from SKILL.md files.
"""

import os
import re
import json
from pathlib import Path


def extract_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from SKILL.md content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return {}
    
    frontmatter = {}
    for line in match.group(1).split('\n'):
        line = line.strip()
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip().strip('"').strip("'")
    
    return frontmatter


def extract_first_paragraph(content: str) -> str:
    """Extract first paragraph after frontmatter."""
    # Remove frontmatter
    content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)
    
    # Find first non-empty paragraph
    paragraphs = content.split('\n\n')
    for para in paragraphs:
        para = para.strip()
        if para and not para.startswith('#'):
            # Clean up markdown
            para = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', para)  # Remove links
            para = re.sub(r'[*_`]', '', para)  # Remove formatting
            para = para.replace('\n', ' ')  # Join lines
            return para[:150] + '...' if len(para) > 150 else para
    
    return ''


def scan_skills(skills_dir: str) -> list:
    """Scan skills directory and extract metadata."""
    skills = []
    skills_path = Path(skills_dir)
    
    if not skills_path.exists():
        return skills
    
    for skill_dir in sorted(skills_path.iterdir()):
        if not skill_dir.is_dir():
            continue
        
        skill_md = skill_dir / 'SKILL.md'
        if not skill_md.exists():
            continue
        
        content = skill_md.read_text(encoding='utf-8')
        frontmatter = extract_frontmatter(content)
        
        if not frontmatter.get('name'):
            continue
        
        # Get description from frontmatter or first paragraph
        description = frontmatter.get('description', '')
        if not description:
            description = extract_first_paragraph(content)
        
        # Truncate description if too long
        if len(description) > 100:
            description = description[:97] + '...'
        
        skills.append({
            'name': frontmatter['name'],
            'directory': skill_dir.name,
            'description': description,
            'path': str(skill_dir.relative_to(skills_path.parent))
        })
    
    return skills


def main():
    """Main entry point."""
    import sys
    
    skills_dir = sys.argv[1] if len(sys.argv) > 1 else 'skills'
    
    skills = scan_skills(skills_dir)
    
    # Output as JSON
    print(json.dumps(skills, indent=2))


if __name__ == '__main__':
    main()