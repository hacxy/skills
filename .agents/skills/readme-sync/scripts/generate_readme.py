#!/usr/bin/env python3
"""
Generate README.md and README.zh.md from skill metadata.
"""

import os
import json
from pathlib import Path


def generate_readme(skills: list, repo_name: str = '', intro: str = '', lang: str = 'en') -> str:
    """Generate README.md content from skill metadata.
    
    Args:
        skills: List of skill metadata dictionaries
        repo_name: Repository name for title
        intro: Introduction paragraph
        lang: Language code ('en' or 'zh')
    """
    
    if lang == 'zh':
        return _generate_zh_readme(skills, repo_name, intro)
    return _generate_en_readme(skills, repo_name, intro)


def _generate_en_readme(skills: list, repo_name: str = '', intro: str = '') -> str:
    """Generate English README.md content."""
    
    if not repo_name or repo_name == '':
        repo_name = 'Skills Repository'
    
    lines = []
    
    # Title
    lines.append(f'# {repo_name}')
    lines.append('')
    
    # Language switcher
    lines.append('[中文](./README.zh.md)')
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
            desc = skill.get('description', '')
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


def _generate_zh_readme(skills: list, repo_name: str = '', intro: str = '') -> str:
    """Generate Chinese README.zh.md content."""
    
    if not repo_name or repo_name == '':
        repo_name = '技能仓库'
    
    lines = []
    
    # Title
    lines.append(f'# {repo_name}')
    lines.append('')
    
    # Language switcher
    lines.append('[English](./README.md)')
    lines.append('')
    
    # Introduction
    if intro:
        lines.append(intro)
    else:
        lines.append('AI 代理技能集合。')
    lines.append('')
    
    # Skills table
    if skills:
        lines.append('## 可用技能')
        lines.append('')
        lines.append('| 技能 | 描述 |')
        lines.append('|------|------|')
        
        for skill in skills:
            name = skill['name']
            # Translate English description to Chinese for README.zh.md
            desc = skill.get('description', '')
            path = skill['path']
            lines.append(f'| [{name}]({path}/) | {desc} |')
        
        lines.append('')
    
    # Usage section
    lines.append('## 使用')
    lines.append('')
    lines.append('```bash')
    lines.append('# 安装技能')
    lines.append('npx skills add <owner>/<repo> --skill <skill-name>')
    lines.append('')
    lines.append('# 列出可用技能')
    lines.append('npx skills list')
    lines.append('```')
    lines.append('')
    
    # Contributing section
    lines.append('## 贡献')
    lines.append('')
    lines.append('请参阅 [AGENTS.md](AGENTS.md) 了解创建和贡献技能的指南。')
    lines.append('')
    
    # License section
    lines.append('## 许可证')
    lines.append('')
    lines.append('MIT')
    lines.append('')
    
    return '\n'.join(lines)


def main():
    """Main entry point."""
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate README from skill metadata')
    parser.add_argument('--lang', choices=['en', 'zh', 'both'], default='both',
                        help='Language to generate (default: both)')
    parser.add_argument('--repo-name', default='', help='Repository name')
    parser.add_argument('--intro', default='', help='Introduction paragraph')
    parser.add_argument('--output-dir', default='.', help='Output directory')
    
    # Read skills from stdin or file
    parser.add_argument('skills_file', nargs='?', help='JSON file with skills metadata')
    
    args = parser.parse_args()
    
    # Load skills
    if args.skills_file and os.path.exists(args.skills_file):
        with open(args.skills_file, 'r') as f:
            skills = json.load(f)
    else:
        skills = json.load(sys.stdin)
    
    output_dir = Path(args.output_dir)
    
    # Generate README files
    if args.lang in ('en', 'both'):
        en_readme = _generate_en_readme(skills, args.repo_name, args.intro)
        output_path = output_dir / 'README.md'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(en_readme)
        print(f'Generated {output_path}', file=sys.stderr)
    
    if args.lang in ('zh', 'both'):
        zh_readme = _generate_zh_readme(skills, args.repo_name, args.intro)
        output_path = output_dir / 'README.zh.md'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(zh_readme)
        print(f'Generated {output_path}', file=sys.stderr)
    
    # Output to stdout for backward compatibility
    if args.lang == 'en':
        print(_generate_en_readme(skills, args.repo_name, args.intro))
    elif args.lang == 'zh':
        print(_generate_zh_readme(skills, args.repo_name, args.intro))


if __name__ == '__main__':
    main()