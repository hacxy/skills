import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "./Navbar";

interface Props {
  onBrowse: () => void;
  onHome: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const SECTIONS = ["intro", "quickstart", "platforms", "structure", "cli"] as const;
type SectionId = (typeof SECTIONS)[number];

export function AboutPage({ onBrowse, onHome, theme, onToggleTheme }: Props) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId>("intro");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((id) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-15% 0% -70% 0%" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: SectionId) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const platforms = [
    { name: "Claude Code", icon: "lucide:cpu", color: "#6366f1", cmd: `npx @hacxy/skills install <name>`, note: t("about.platformDefault") },
    { name: "Cursor",      icon: "lucide:mouse-pointer-2", color: "#3b82f6", cmd: `npx @hacxy/skills install <name> --platform cursor`, note: "" },
    { name: "Codex",       icon: "lucide:code-2",          color: "#10b981", cmd: `npx @hacxy/skills install <name> --platform codex`,  note: "" },
    { name: "Trae",        icon: "lucide:bot",             color: "#f59e0b", cmd: `npx @hacxy/skills install <name> --platform trae`,   note: "" },
  ];

  const steps = [
    { num: "1", title: t("about.steps.browse.title"),  desc: t("about.steps.browse.desc"),  code: null },
    { num: "2", title: t("about.steps.install.title"), desc: t("about.steps.install.desc"), code: "npx @hacxy/skills install <skill-name>" },
    { num: "3", title: t("about.steps.use.title"),     desc: t("about.steps.use.desc"),     code: null },
  ];

  return (
    <div className="docs-page">
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogoClick={onHome}
        rightSlot={
          <button className="btn-outline" onClick={onBrowse}>
            {t("nav.browseSkills")}
            <Icon icon="lucide:arrow-right" width="14" height="14" />
          </button>
        }
      />

      <div className="docs-layout">
        {/* Sidebar TOC */}
        <aside className="docs-sidebar">
          <p className="docs-toc-title">{t("about.tocTitle")}</p>
          <ul className="docs-toc-list">
            {SECTIONS.map((id) => (
              <li key={id}>
                <button
                  className={`docs-toc-link${activeSection === id ? " active" : ""}`}
                  onClick={() => scrollTo(id)}
                >
                  {t(`about.sections.${id}`)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="docs-content">
          {/* Page header */}
          <div className="docs-header">
            <span className="docs-page-badge">
              <Icon icon="lucide:book-open" width="12" height="12" />
              {t("about.badge")}
            </span>
            <h1 className="docs-page-title">{t("about.title")}</h1>
            <p className="docs-page-lead">{t("about.desc")}</p>
          </div>

          {/* Introduction */}
          <section
            id="intro"
            className="docs-section"
            ref={(el) => { sectionRefs.current.intro = el; }}
          >
            <h2 className="docs-section-title">{t("about.sections.intro")}</h2>
            <p className="docs-section-desc">{t("about.introDetail")}</p>
          </section>

          {/* Quick Start */}
          <section
            id="quickstart"
            className="docs-section"
            ref={(el) => { sectionRefs.current.quickstart = el; }}
          >
            <h2 className="docs-section-title">{t("about.sections.quickstart")}</h2>
            <p className="docs-section-desc">{t("about.quickstartDesc")}</p>
            <ol className="docs-steps">
              {steps.map((s) => (
                <li key={s.num} className="docs-step">
                  <div className="docs-step-num">{s.num}</div>
                  <div className="docs-step-body">
                    <div className="docs-step-title">{s.title}</div>
                    <p className="docs-step-desc">{s.desc}</p>
                    {s.code && (
                      <div className="docs-step-code">
                        <Icon icon="lucide:terminal" width="11" height="11" />
                        <code>{s.code}</code>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Supported Platforms */}
          <section
            id="platforms"
            className="docs-section"
            ref={(el) => { sectionRefs.current.platforms = el; }}
          >
            <h2 className="docs-section-title">{t("about.sections.platforms")}</h2>
            <p className="docs-section-desc">{t("about.platformsDesc")}</p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>{t("about.platformName")}</th>
                  <th>{t("about.platformCmd")}</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <div className="docs-platform-cell">
                        <span style={{ color: p.color, display: "flex" }}>
                          <Icon icon={p.icon} width="16" height="16" />
                        </span>
                        <span>{p.name}</span>
                        {p.note && <span className="docs-platform-note">{p.note}</span>}
                      </div>
                    </td>
                    <td><code>{p.cmd}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* File Structure */}
          <section
            id="structure"
            className="docs-section"
            ref={(el) => { sectionRefs.current.structure = el; }}
          >
            <h2 className="docs-section-title">{t("about.sections.structure")}</h2>
            <p className="docs-section-desc">{t("about.structureDesc")}</p>
            <div className="docs-structure-grid">
              <div className="code-block">
                <pre>{`your-skill/
├── SKILL.md          # ${t("about.structureSkillMd")}
├── rules/            # ${t("about.structureRules")}
│   └── *.md
└── ...               # ${t("about.structureOther")}`}</pre>
              </div>
              <div className="docs-notes">
                <div className="docs-note">
                  <Icon icon="lucide:file-text" width="15" height="15" className="docs-note-icon" />
                  <div>
                    <strong>SKILL.md</strong>
                    <p>{t("about.noteSkillMd")}</p>
                  </div>
                </div>
                <div className="docs-note">
                  <Icon icon="lucide:folder" width="15" height="15" className="docs-note-icon" />
                  <div>
                    <strong>rules/</strong>
                    <p>{t("about.noteRules")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CLI Commands */}
          <section
            id="cli"
            className="docs-section"
            ref={(el) => { sectionRefs.current.cli = el; }}
          >
            <h2 className="docs-section-title">{t("about.sections.cli")}</h2>
            <p className="docs-section-desc">{t("about.cliDesc")}</p>
            <div className="code-block">
              <pre>{`# 推荐：免安装直接使用
npx @hacxy/skills list
npx @hacxy/skills search <keyword>
npx @hacxy/skills install <name>

# 指定平台安装
npx @hacxy/skills install <name> --platform cursor
npx @hacxy/skills install <name> --platform codex
npx @hacxy/skills install <name> --platform trae

# 全局安装（长期使用更快）
npm install -g @hacxy/skills
skills install <name>`}</pre>
            </div>
          </section>
        </main>
      </div>

      <footer className="home-footer">
        <p>
          MIT Licensed | Copyright © 2023-Present{" "}
          <a href="https://github.com/hacxy" target="_blank" rel="noopener noreferrer">
            Hacxy
          </a>
        </p>
      </footer>
    </div>
  );
}
