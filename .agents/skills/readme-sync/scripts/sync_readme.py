#!/usr/bin/env python3
"""
Main script to sync README.md and README.zh.md with skills directory.
"""

import os
import sys
import json
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from scan_skills import scan_skills
from generate_readme import generate_readme, _generate_en_readme, _generate_zh_readme
from update_readme import update_readme


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Sync README.md and README.zh.md with skills directory'
    )
    parser.add_argument(
        '--skills-dir',
        default='skills',
        help='Path to skills directory (default: skills)'
    )
    parser.add_argument(
        '--readme',
        default='README.md',
        help='Path to README.md (default: README.md)'
    )
    parser.add_argument(
        '--repo-name',
        default=None,
        help='Repository name for README title'
    )
    parser.add_argument(
        '--intro',
        default=None,
        help='Introduction paragraph for README'
    )
    parser.add_argument(
        '--lang',
        choices=['en', 'zh', 'both'],
        default='both',
        help='Language to generate (default: both)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Print README without writing to file'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output skill metadata as JSON'
    )
    
    args = parser.parse_args()
    
    # Scan skills
    skills = scan_skills(args.skills_dir)
    
    if not skills:
        print(f'No skills found in {args.skills_dir}', file=sys.stderr)
        sys.exit(1)
    
    # Output JSON if requested
    if args.json:
        print(json.dumps(skills, indent=2))
        return
    
    # Generate or update README files
    readme_path = Path(args.readme)
    zh_readme_path = readme_path.parent / 'README.zh.md'
    
    # Process English README
    if args.lang in ('en', 'both'):
        if readme_path.exists():
            updated_en = update_readme(str(readme_path), skills, 'en')
        else:
            updated_en = _generate_en_readme(skills, args.repo_name or '', args.intro or '')
        
        if args.dry_run:
            print('=== README.md ===')
            print(updated_en)
        else:
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(updated_en)
            print(f'Updated {readme_path}', file=sys.stderr)
    
    # Process Chinese README
    if args.lang in ('zh', 'both'):
        if zh_readme_path.exists():
            updated_zh = update_readme(str(zh_readme_path), skills, 'zh')
        else:
            updated_zh = _generate_zh_readme(skills, args.repo_name or '', args.intro or '')
        
        if args.dry_run:
            print('\n=== README.zh.md ===')
            print(updated_zh)
        else:
            with open(zh_readme_path, 'w', encoding='utf-8') as f:
                f.write(updated_zh)
            print(f'Updated {zh_readme_path}', file=sys.stderr)
    
    print(f'Found {len(skills)} skills', file=sys.stderr)


if __name__ == '__main__':
    main()