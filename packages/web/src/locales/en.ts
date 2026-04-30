const messages = {
  nav: {
    toggleDark: 'Switch to dark',
    toggleLight: 'Switch to light',
    browseSkills: 'Browse Skills',
    backToList: 'Back to list',
  },
  hero: {
    badge: 'AI Dev Toolkit',
    title: 'AI Assistant Skills',
    desc: 'Curated AI coding skills — install to Claude Code, Cursor, Codex, or Trae with a single command and supercharge your workflow.',
    viewSource: 'View source',
  },
  features: {
    search: {
      title: 'Browse & Search',
      desc: 'Quickly search all skills by name and description with real-time filtering.',
    },
    install: {
      title: 'One-click Install',
      desc: 'Install to Claude Code, Cursor, Codex, or Trae with a single CLI command.',
    },
    sync: {
      title: 'Live Sync',
      desc: 'Pulled directly from GitHub in real time — new skills appear instantly.',
    },
  },
  usage: {
    title: 'Quick Start',
  },
  footer: {
    openSource: 'Open source',
  },
  explorer: {
    searchPlaceholder: 'Search by name or description...',
    searchResults: 'Found {count} result(s)',
    notFound: 'No results for "{query}"',
    install: 'Install',
    copy: 'Copy',
    copied: 'Copied',
    copyLink: 'Copy link',
    upload: {
      title: 'Upload Skill',
      namePlaceholder: 'Skill name',
      contentPlaceholder: 'Paste SKILL.md content',
      submit: 'Upload',
    },
  },
} as const

export default messages
