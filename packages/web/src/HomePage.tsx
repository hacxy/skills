import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  onBrowse: () => void;
}

const features = [
  {
    icon: "lucide:search",
    title: "浏览与搜索",
    desc: "快速检索所有技能的名称和描述，实时过滤结果。",
  },
  {
    icon: "lucide:download",
    title: "一键安装",
    desc: "通过 CLI 一条命令安装到 Claude Code、Cursor 或 Codex。",
  },
  {
    icon: "lucide:refresh-cw",
    title: "实时同步",
    desc: "直接从 GitHub 仓库实时拉取，新增技能立即可见。",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export function HomePage({ onBrowse }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyInstall() {
    await navigator.clipboard.writeText("npm install -g @hacxy/skills");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-logo">
          <Icon icon="lucide:zap" width="20" height="20" color="#6366f1" />
          <span>Skills</span>
        </div>
        <div className="home-nav-right">
          <a
            href="https://github.com/hacxy/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            <Icon icon="mdi:github" width="18" height="18" />
          </a>
          <button className="btn-outline" onClick={onBrowse}>
            浏览技能
            <Icon icon="lucide:arrow-right" width="14" height="14" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <motion.div
          className="hero-inner"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <Icon icon="lucide:zap" width="12" height="12" />
            AI 编程工具集
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-title">
            AI 助手<br />技能集
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-desc">
            我个人的 AI 编程助手技能集合，专为 Claude Code、Cursor 和 Codex 设计。
            有强烈的个人主见，主要为自己的工作流维护，同时对所有人开放使用。
          </motion.p>

          <motion.div variants={itemVariants} className="install-cmd">
            <Icon icon="lucide:terminal" width="14" height="14" className="cmd-icon" />
            <code>npm install -g @hacxy/skills</code>
            <button className="cmd-copy" onClick={() => void copyInstall()}>
              <Icon
                icon={copied ? "lucide:check" : "lucide:copy"}
                width="14"
                height="14"
              />
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-actions">
            <button className="btn-primary" onClick={onBrowse}>
              浏览技能
              <Icon icon="lucide:arrow-right" width="15" height="15" />
            </button>
            <a
              href="https://github.com/hacxy/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <Icon icon="mdi:github" width="16" height="16" />
              查看源码
            </a>
          </motion.div>
        </motion.div>

        {/* Background decoration */}
        <div className="hero-glow" aria-hidden />
      </section>

      {/* Features */}
      <section className="home-features">
        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((f) => (
            <motion.div key={f.title} className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <Icon icon={f.icon} width="20" height="20" />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Quick usage */}
      <section className="home-usage">
        <motion.div
          className="usage-inner"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="usage-title">快速开始</h2>
          <div className="code-block">
            <pre>{`# 安装 CLI
npm install -g @hacxy/skills

# 列出所有技能
skills list

# 按关键字搜索
skills search commit

# 安装到 Claude Code
skills install commit`}</pre>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>
          开源项目 ·{" "}
          <a href="https://github.com/hacxy/skills" target="_blank" rel="noopener noreferrer">
            hacxy/skills
          </a>
        </p>
      </footer>
    </div>
  );
}
