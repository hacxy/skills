import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "./Navbar";

interface Props {
  onBrowse: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogoClick: () => void;
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function HomePage({ onBrowse, theme, onToggleTheme, onLogoClick }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const features = [
    {
      icon: "lucide:search",
      title: t("features.search.title"),
      desc: t("features.search.desc"),
    },
    {
      icon: "lucide:download",
      title: t("features.install.title"),
      desc: t("features.install.desc"),
    },
    {
      icon: "lucide:refresh-cw",
      title: t("features.sync.title"),
      desc: t("features.sync.desc"),
    },
  ];

  async function copyInstall() {
    await navigator.clipboard.writeText("npx @hacxy/skills");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="home">
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogoClick={onLogoClick}
        rightSlot={
          <button className="btn-outline" onClick={onBrowse}>
            {t("nav.browseSkills")}
            <Icon icon="lucide:arrow-right" width="14" height="14" />
          </button>
        }
      />

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
            {t("hero.badge")}
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-title">
            {t("hero.title")}
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-desc">
            <TypewriterText
              text={t("hero.desc")}
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
              {t("nav.browseSkills")}
              <Icon icon="lucide:arrow-right" width="15" height="15" />
            </button>
            <a
              href="https://github.com/hacxy/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <Icon icon="mdi:github" width="16" height="16" />
              {t("hero.viewSource")}
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
            <motion.div key={f.icon} className="feature-card" variants={itemVariants}>
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
          <h2 className="usage-title">{t("usage.title")}</h2>
          <div className="code-block">
            <pre>{`# 推荐：免安装直接使用
npx @hacxy/skills list
npx @hacxy/skills search commit
npx @hacxy/skills install commit

# 指定平台安装
npx @hacxy/skills install commit --platform cursor
npx @hacxy/skills install commit --platform trae

# 或全局安装（长期使用更快）
npm install -g @hacxy/skills
skills install commit`}</pre>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>
          {t("footer.openSource")} ·{" "}
          <a href="https://github.com/hacxy/skills" target="_blank" rel="noopener noreferrer">
            hacxy/skills
          </a>
        </p>
      </footer>
    </div>
  );
}
