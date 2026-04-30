const messages = {
  nav: {
    toggleDark: "切换深色",
    toggleLight: "切换浅色",
    browseSkills: "浏览技能",
    backToList: "返回列表",
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
