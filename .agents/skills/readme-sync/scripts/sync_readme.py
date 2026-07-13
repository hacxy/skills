#!/usr/bin/env python3
"""
Main script to sync README.md with skills directory.
"""

import os
import sys
import json
from pathlib import Path

# Add scripts directory to path
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from scan_skills import scan_skills
from generate_readme import generate_readme
from update_readme import update_readme


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Sync README.md with skills directory'
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
    
    # Generate or update README
    readme_path = Path(args.readme)
    
    if readme_path.exists():
        # Update existing README
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = update_readme(str(readme_path), skills)
    else:
        # Generate new README
        updated = generate_readme(skills, args.repo_name, args.intro)
    
    # Output
    if args.dry_run:
        print(updated)
    else:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(updated)
        
        print(f'Updated {readme_path}', file=sys.stderr)
        print(f'Found {len(skills)} skills', file=sys.stderr)


if __name__ == '__main__':
    main()