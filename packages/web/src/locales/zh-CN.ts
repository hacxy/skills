const messages = {
  nav: {
    toggleDark: "切换深色",
    toggleLight: "切换浅色",
    browseSkills: "浏览技能",
    backToList: "返回列表",
    about: "什么是 Skills？",
  },
  hero: {
    badge: "AI 编程工具集",
    title: "AI 助手技能集",
    desc: "精选 AI 编程技能集，一条命令安装到 Claude Code、Cursor、Codex 或 Trae，立即增强你的工作流。",
    viewSource: "查看源码",
  },
  features: {
    search: {
      title: "浏览与搜索",
      desc: "快速检索所有技能的名称和描述，实时过滤结果。",
    },
    install: {
      title: "一键安装",
      desc: "通过 CLI 一条命令安装到 Claude Code、Cursor、Codex 或 Trae。",
    },
    sync: {
      title: "实时同步",
      desc: "直接从 GitHub 仓库实时拉取，新增技能立即可见。",
    },
  },
  usage: {
    title: "快速开始",
  },
  about: {
    badge: "使用文档",
    title: "什么是 Skills？",
    desc: "Skills 是专为 AI 编程助手设计的技能包，包含特定场景的指令集与工作流。安装后，AI 助手将按照技能定义协助你工作，大幅提升开发效率。",
    tocTitle: "本页内容",
    sections: {
      intro: "介绍",
      quickstart: "快速开始",
      platforms: "支持的平台",
      structure: "文件结构",
      cli: "CLI 命令",
    },
    introDetail: "Skills 本质上是一套 Markdown 指令文件，定义了 AI 助手在特定场景下的行为方式与工作流程。每个 skill 以目录形式存在，核心是 SKILL.md 文件，描述技能的用途与详细指令。安装时，CLI 工具会将文件写入 AI 工具对应的 skills 配置目录，无需手动配置。",
    quickstartDesc: "三步完成从浏览到使用的全流程：",
    steps: {
      browse: {
        title: "浏览技能库",
        desc: "在技能浏览页中查找适合你的技能，每个技能都附有名称、描述和详细文档。",
      },
      install: {
        title: "一条命令安装",
        desc: "使用 CLI 将技能安装到你的 AI 工具中，支持多个主流平台。",
      },
      use: {
        title: "立即开始使用",
        desc: "重新打开 AI 助手，技能已自动就绪。在对话中直接使用对应技能名触发即可。",
      },
    },
    platforms: "支持的平台",
    platformsDesc: "通过 --platform 参数指定目标 AI 工具，默认安装到 Claude Code。",
    platformName: "平台",
    platformCmd: "安装命令",
    platformDefault: "（默认）",
    structure: "文件结构",
    structureDesc: "每个技能由一个目录构成，核心是 SKILL.md 文件，可选包含规则文件和其他配置。",
    structureSkillMd: "技能主文件（frontmatter 元数据 + 指令内容）",
    structureRules: "规则文件目录（可选）",
    structureOther: "其他配置文件（可选）",
    noteSkillMd: "包含技能名称、描述等 frontmatter 元数据和主要指令内容，是每个技能的核心文件，安装时写入 AI 工具的配置目录。",
    noteRules: "可选的规则文件目录，存放细分场景的指令规则，安装时随 SKILL.md 一并复制到目标位置。",
    cli: "CLI 命令",
    cliDesc: "使用 @hacxy/skills CLI 管理和安装技能，支持 npx 直接使用或全局安装：",
  },
  footer: {
    openSource: "开源项目",
  },
  explorer: {
    searchPlaceholder: "搜索 skill 名称或描述...",
    searchResults: "找到 {count} 个结果",
    notFound: '未找到 "{query}"',
    install: "安装",
    copy: "复制",
    copied: "已复制",
    upload: {
      title: "上传 Skill",
      namePlaceholder: "skill 名称",
      contentPlaceholder: "粘贴 SKILL.md 内容",
      submit: "上传",
    },
  },
} as const;

export default messages;
