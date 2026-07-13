#!/usr/bin/env python3
"""
Generate README.md from skill metadata.
"""

import os
import json
from pathlib import Path


def generate_readme(skills: list, repo_name: str = '', intro: str = '') -> str:
    """Generate README.md content from skill metadata."""
    
    if not repo_name or repo_name == '':
        repo_name = 'Skills Repository'
    
    lines = []
    
    # Title
    lines.append(f'# {repo_name}')
    lines.append('')
    
    # Introduction
    if intro:
        lines.append(intro)
    else:
        lines.append('A collection of AI agent skills.')
    lines.append('')
    
    # Skills table
    if skills:
        lines.append('## Skills')
        lines.append('')
        lines.append('| Skill | Description |')
        lines.append('|-------|-------------|')
        
        for skill in skills:
            name = skill['name']
            desc = skill['description']
            path = skill['path']
            lines.append(f'| [{name}]({path}/) | {desc} |')
        
        lines.append('')
    
    # Usage section
    lines.append('## Usage')
    lines.append('')
    lines.append('```bash')
    lines.append('# Install a skill')
    lines.append('npx skills add <owner>/<repo> --skill <skill-name>')
    lines.append('')
    lines.append('# List available skills')
    lines.append('npx skills list')
    lines.append('```')
    lines.append('')
    
    # Contributing section
    lines.append('## Contributing')
    lines.append('')
    lines.append('See [AGENTS.md](AGENTS.md) for guidelines on creating and contributing skills.')
    lines.append('')
    
    # License section
    lines.append('## License')
    lines.append('')
    lines.append('MIT')
    lines.append('')
    
    return '\n'.join(lines)


def main():
    """Main entry point."""
    import sys
    
    # Read skills from stdin or file
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r') as f:
            skills = json.load(f)
    else:
        skills = json.load(sys.stdin)
    
    # Generate README
    readme = generate_readme(skills)
    
    # Output
    print(readme)


if __name__ == '__main__':
    main()