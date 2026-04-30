import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  onBrowse: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

function TypewriterText({ text, speed = 18, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(delay === 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
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

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function HomePage({ onBrowse, theme, onToggleTheme }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyInstall() {
    await navigator.clipboard.writeText("npx @hacxy/skills");
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
          <button className="theme-toggle" onClick={onToggleTheme} title={theme === "dark" ? "切换浅色" : "切换深色"}>
            <Icon icon={theme === "dark" ? "lucide:sun" : "lucide:moon"} width="16" height="16" />
          </button>
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
            AI 助手技能集
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-desc">
            <TypewriterText
              text="精选 AI 编程技能集，一条命令安装到 Claude Code、Cursor 或 Codex，立即增强你的工作流。"
              speed={20}
              delay={700}
            />
          </motion.p>

          <motion.div variants={itemVariants} className="install-cmd">
            <Icon icon="lucide:terminal" width="14" height="14" className="cmd-icon" />
            <code>npx @hacxy/skills</code>
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
            <pre>{`# 推荐：免安装直接使用
npx @hacxy/skills list
npx @hacxy/skills search commit
npx @hacxy/skills install commit

# 或全局安装（长期使用更快）
npm install -g @hacxy/skills
skills list
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
