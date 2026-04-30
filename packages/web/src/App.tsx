import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { useTranslation } from "react-i18next";
import { HomePage } from "./HomePage";
import { TerminalAnimation } from "./TerminalAnimation";
import { Navbar } from "./Navbar";

const RAW_BASE = "https://raw.githubusercontent.com/hacxy/skills/main";

function parseFrontmatter(text: string): {
  data: Record<string, string>;
  content: string;
} {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: text };
  const data: Record<string, string> = {};
  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon < 0) {
      i++;
      continue;
    }
    const key = line.slice(0, colon).trim();
    const rawVal = line.slice(colon + 1).trim();
    if (!key) {
      i++;
      continue;
    }
    // Handle YAML block scalars: >-, >, |-, |
    if (/^[>|]-?$/.test(rawVal)) {
      const fold = rawVal.startsWith(">");
      const strip = rawVal.endsWith("-");
      i++;
      const blockLines: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        if (next !== "" && !next.startsWith(" ") && !next.startsWith("\t"))
          break;
        blockLines.push(next.trimStart());
        i++;
      }
      if (fold) {
        // Folded: consecutive non-empty lines join with space; empty line = paragraph break
        let result = "";
        for (const bl of blockLines) {
          if (bl === "") {
            result = result.trimEnd() + "\n";
          } else {
            result += (result && !result.endsWith("\n") ? " " : "") + bl;
          }
        }
        data[key] = strip ? result.trimEnd() : result;
      } else {
        // Literal: preserve newlines
        data[key] = strip
          ? blockLines.join("\n").trimEnd()
          : blockLines.join("\n");
      }
    } else {
      data[key] = rawVal.replace(/^["']|["']$/g, "");
      i++;
    }
  }
  return { data, content: match[2] };
}

interface SkillMeta {
  name: string;
  description: string;
  relativePath: string;
  directory: string;
  files: string[];
}

interface SkillDoc extends SkillMeta {
  content: string;
  raw: string;
}

type Page = "home" | "explorer";

function getInitialPage(): Page {
  return window.location.pathname === "/" ? "home" : "explorer";
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE },
  },
};

const containerVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });
  const [page, setPage] = useState<Page>(getInitialPage);
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<SkillDoc | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [query, setQuery] = useState("");
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [activeTool, setActiveTool] = useState(0);
  const [selectedFile, setSelectedFile] = useState("SKILL.md");
  const [viewContent, setViewContent] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function navigateTo(target: Page) {
    setPage(target);
    if (target === "home") {
      setSelectedName("");
      setSelectedDoc(null);
      window.history.pushState(null, "", "/");
    } else {
      setSelectedName("");
      setSelectedDoc(null);
      window.history.pushState(null, "", "/explorer");
    }
  }

  function goBack() {
    setSelectedName("");
    setSelectedDoc(null);
    window.history.pushState(null, "", "/explorer");
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/") {
        setPage("home");
        setSelectedName("");
      } else {
        setPage("explorer");
        if (path.startsWith("/skill/")) {
          setSelectedName(decodeURIComponent(path.replace("/skill/", "")));
        } else {
          setSelectedName("");
          setSelectedDoc(null);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function reloadSkills() {
    try {
      const url = import.meta.env.DEV
        ? "/api/skills"
        : `${RAW_BASE}/skills-registry.json`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        name: string;
        description: string;
        relativePath?: string;
        directory?: string;
        files?: string[];
      }[];
      const mapped: SkillMeta[] = data.map((s) => ({
        name: s.name,
        description: s.description,
        relativePath: s.relativePath ?? `skills/${s.name}/SKILL.md`,
        directory: s.directory ?? s.name,
        files: s.files ?? ["SKILL.md"],
      }));
      setSkills(mapped);
    } catch {
      // silently keep empty state on network or parse errors
    }
  }

  useEffect(() => {
    if (page !== "explorer") return;
    void reloadSkills();
    const path = window.location.pathname;
    if (path.startsWith("/skill/")) {
      setSelectedName(decodeURIComponent(path.replace("/skill/", "")));
    }
  }, [page]);

  useEffect(() => {
    if (page !== "explorer") return;
    if (!selectedName) {
      setSelectedDoc(null);
      setViewContent("");
      return;
    }
    const targetPath = `/skill/${encodeURIComponent(selectedName)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
    setIsLoadingDoc(true);
    setSelectedDoc(null);
    setSelectedFile("SKILL.md");
    setActiveTool(0);
    void fetch(
      `${RAW_BASE}/skills/${encodeURIComponent(selectedName)}/SKILL.md`,
    )
      .then((r) => r.text())
      .then((raw) => {
        const { data, content } = parseFrontmatter(raw);
        const doc: SkillDoc = {
          name: data.name || selectedName,
          description: data.description || "",
          relativePath: `skills/${selectedName}/SKILL.md`,
          directory: selectedName,
          files: ["SKILL.md"],
          content,
          raw,
        };
        setSelectedDoc(doc);
        setViewContent(content);
        setIsLoadingDoc(false);
      });
  }, [selectedName, page]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return skills;
    return skills.filter((s) =>
      `${s.name} ${s.description}`.toLowerCase().includes(keyword),
    );
  }, [query, skills]);

  const currentFiles = useMemo(
    () => skills.find((s) => s.name === selectedName)?.files ?? ["SKILL.md"],
    [skills, selectedName],
  );

  async function copyInstallCmd(cmd: string) {
    await navigator.clipboard.writeText(cmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  }

  async function loadFile(filePath: string) {
    setSelectedFile(filePath);
    if (filePath === "SKILL.md" && selectedDoc) {
      setViewContent(selectedDoc.content);
      return;
    }
    setIsLoadingFile(true);
    const url = import.meta.env.DEV
      ? `/api/file/${encodeURIComponent(selectedName)}/${filePath}`
      : `${RAW_BASE}/skills/${encodeURIComponent(selectedName)}/${filePath}`;
    const raw = await fetch(url).then((r) => r.text());
    setViewContent(raw);
    setIsLoadingFile(false);
  }

  if (page === "home") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HomePage
            onBrowse={() => navigateTo("explorer")}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogoClick={() => navigateTo("home")}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  const showDetail =
    selectedName !== "" && (isLoadingDoc || selectedDoc !== null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="explorer"
        className="explorer-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogoClick={() => navigateTo("home")}
          showBack={showDetail}
          onBack={goBack}
        />

        <AnimatePresence mode="wait">
          {!showDetail ? (
            /* ── Grid view ── */
            <motion.div
              key="grid"
              className="explorer-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* Search */}
              <div className="explorer-search-section">
                <div className="explorer-search-wrap">
                  <Icon
                    icon="lucide:search"
                    className="explorer-search-icon"
                    width="18"
                    height="18"
                  />
                  <input
                    className="explorer-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("explorer.searchPlaceholder")}
                    autoFocus
                  />
                  {query && (
                    <button
                      className="search-clear"
                      onClick={() => setQuery("")}
                    >
                      <Icon icon="lucide:x" width="14" height="14" />
                    </button>
                  )}
                </div>
                {query && (
                  <p className="search-hint">
                    {t("explorer.searchResults", { count: filtered.length })}
                  </p>
                )}
              </div>

              {/* Cards */}
              {skills.length === 0 ? (
                <div className="grid-loading">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skill-card-skeleton" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="grid-empty">
                  <Icon icon="lucide:search-x" width="40" height="40" />
                  <p>{t("explorer.notFound", { query })}</p>
                </div>
              ) : (
                <motion.div
                  className="skills-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((skill) => (
                      <motion.button
                        key={skill.name}
                        className="skill-card"
                        variants={cardVariants}
                        layout
                        onClick={() => setSelectedName(skill.name)}
                      >
                        <span className="skill-card-name">{skill.name}</span>
                        <span className="skill-card-desc">
                          {skill.description}
                        </span>
                        <span className="skill-card-cmd">
                          <Icon icon="lucide:terminal" width="11" height="11" />
                          npx @hacxy/skills install {skill.name}
                        </span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ── Detail view ── */
            <motion.div
              key="detail"
              className="explorer-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <AnimatePresence mode="wait">
                {isLoadingDoc ? (
                  <motion.div
                    key="skeleton"
                    className="skeleton-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="skeleton sk-title" />
                    <div className="skeleton sk-line" />
                    <div className="skeleton sk-line sk-short" />
                    <div className="skeleton sk-block" />
                  </motion.div>
                ) : selectedDoc ? (
                  <motion.div
                    key={selectedDoc.name}
                    className="doc-wrap"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <h1 className="doc-title">{selectedDoc.name}</h1>
                    <p className="doc-desc">{selectedDoc.description}</p>

                    {(() => {
                      const tools = [
                        {
                          label: "Claude Code",
                          cmd: `npx @hacxy/skills install ${selectedDoc.name}`,
                        },
                        {
                          label: "Cursor",
                          cmd: `npx @hacxy/skills install ${selectedDoc.name} --platform cursor`,
                        },
                        {
                          label: "Codex",
                          cmd: `npx @hacxy/skills install ${selectedDoc.name} --platform codex`,
                        },
                        {
                          label: "Trae",
                          cmd: `npx @hacxy/skills install ${selectedDoc.name} --platform trae`,
                        },
                      ];
                      const tool = tools[activeTool];
                      return (
                        <>
                          <div className="install-tabs">
                            {tools.map((t, i) => (
                              <button
                                key={t.label}
                                className={`install-tab${activeTool === i ? " install-tab-active" : ""}`}
                                onClick={() => setActiveTool(i)}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <div className="install-box">
                            <span className="install-box-label">
                              {t("explorer.install")}
                            </span>
                            <code>{tool.cmd}</code>
                            <button
                              className="copy-btn"
                              onClick={() => void copyInstallCmd(tool.cmd)}
                            >
                              <Icon
                                icon={
                                  copiedInstall ? "lucide:check" : "lucide:copy"
                                }
                                width="13"
                                height="13"
                              />
                              {copiedInstall
                                ? t("explorer.copied")
                                : t("explorer.copy")}
                            </button>
                          </div>
                          <TerminalAnimation
                            key={activeTool}
                            skillName={selectedDoc.name}
                            command={tool.cmd}
                          />
                        </>
                      );
                    })()}

                    <div className="content-area">
                      {currentFiles.length > 0 && (
                        <div className="file-selector">
                          <Icon icon="lucide:files" width="13" height="13" />
                          <select
                            className="file-select"
                            value={selectedFile}
                            onChange={(e) => void loadFile(e.target.value)}
                          >
                            {currentFiles.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {isLoadingFile ? (
                        <div className="file-loading">
                          <div className="skeleton sk-line" />
                          <div className="skeleton sk-line sk-short" />
                          <div className="skeleton sk-block" />
                        </div>
                      ) : (
                        <article
                          className="markdown"
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(viewContent) as string,
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="home-footer">
          <p>MIT Licensed | Copyright © 2023-Present <a href="https://github.com/hacxy" target="_blank" rel="noopener noreferrer">Hacxy</a></p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
