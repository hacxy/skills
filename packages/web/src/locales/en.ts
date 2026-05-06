const messages = {
  nav: {
    toggleDark: "Switch to dark",
    toggleLight: "Switch to light",
    browseSkills: "Browse Skills",
    backToList: "Back to list",
    about: "What are Skills?",
  },
  hero: {
    badge: "AI Dev Toolkit",
    title: "AI Assistant Skills",
    desc: "Curated AI coding skills — install to Claude Code, Cursor, Codex, or Trae with a single command and supercharge your workflow.",
    viewSource: "View source",
  },
  features: {
    search: {
      title: "Browse & Search",
      desc: "Quickly search all skills by name and description with real-time filtering.",
    },
    install: {
      title: "One-click Install",
      desc: "Install to Claude Code, Cursor, Codex, or Trae with a single CLI command.",
    },
    sync: {
      title: "Live Sync",
      desc: "Pulled directly from GitHub in real time — new skills appear instantly.",
    },
  },
  usage: {
    title: "Quick Start",
  },
  about: {
    badge: "Documentation",
    title: "What are Skills?",
    desc: "Skills are capability packs designed for AI coding assistants, containing instruction sets and workflows for specific scenarios. Once installed, your AI assistant operates according to the skill's definitions, dramatically boosting your development efficiency.",
    tocTitle: "On this page",
    sections: {
      intro: "Introduction",
      quickstart: "Quick Start",
      platforms: "Supported Platforms",
      structure: "File Structure",
      cli: "CLI Commands",
    },
    introDetail: "A skill is essentially a set of Markdown instruction files that define how an AI assistant should behave in specific scenarios. Each skill exists as a directory with a core SKILL.md file describing the skill's purpose and instructions. On install, the CLI writes the files into the AI tool's skills config directory — no manual setup required.",
    quickstartDesc: "Three steps from browsing to using:",
    steps: {
      browse: {
        title: "Browse the library",
        desc: "Find the skill you need in the explorer. Each skill comes with a name, description, and detailed documentation.",
      },
      install: {
        title: "Install with one command",
        desc: "Use the CLI to install skills into your AI tool. Multiple platforms are supported.",
      },
      use: {
        title: "Start using it",
        desc: "Reopen your AI assistant — the skill is ready automatically. Just reference the skill name in your conversation to trigger it.",
      },
    },
    platforms: "Supported Platforms",
    platformsDesc: "Use the --platform flag to target a specific AI tool. Defaults to Claude Code.",
    platformName: "Platform",
    platformCmd: "Install command",
    platformDefault: "(default)",
    structure: "File Structure",
    structureDesc: "Each skill is a directory with a core SKILL.md file, optionally containing rules and other config files.",
    structureSkillMd: "Main skill file (frontmatter metadata + instructions)",
    structureRules: "Rules directory (optional)",
    structureOther: "Other config files (optional)",
    noteSkillMd: "Contains frontmatter metadata (name, description) and the main instruction content. Written to the AI tool's config directory on install.",
    noteRules: "Optional directory for sub-scenario rule files, copied alongside SKILL.md to the target location on install.",
    cli: "CLI Commands",
    cliDesc: "Manage and install skills using the @hacxy/skills CLI. Use npx directly or install globally:",
  },
  footer: {
    openSource: "Open source",
  },
  explorer: {
    searchPlaceholder: "Search by name or description...",
    searchResults: "Found {count} result(s)",
    notFound: 'No results for "{query}"',
    install: "Install",
    copy: "Copy",
    copied: "Copied",
    upload: {
      title: "Upload Skill",
      namePlaceholder: "Skill name",
      contentPlaceholder: "Paste SKILL.md content",
      submit: "Upload",
    },
  },
} as const;

export default messages;
