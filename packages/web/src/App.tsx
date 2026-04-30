import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { HomePage } from "./HomePage";

const RAW_BASE = "https://raw.githubusercontent.com/hacxy/skills/main";

function parseFrontmatter(text: string): {
  data: Record<string, string>;
  content: string;
} {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: text };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const val = line
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) data[key] = val;
  }
  return { data, content: match[2] };
}

interface SkillMeta {
  name: string;
  description: string;
  relativePath: string;
  directory: string;
}

interface SkillDoc extends SkillMeta {
  content: string;
  raw: string;
}

interface AuthStatus {
  canUpload: boolean;
  githubOk: boolean;
  tokenOk: boolean;
  currentGithub?: string;
  reason?: string;
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
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadOk, setUploadOk] = useState(false);
  const [onConflict, setOnConflict] = useState<
    "error" | "rename" | "overwrite"
  >("rename");
  const [copied, setCopied] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

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
      window.history.pushState(null, "", "/");
    } else {
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
    const res = await fetch(`${RAW_BASE}/skills-registry.json`);
    const data = (await res.json()) as { name: string; description: string }[];
    const mapped: SkillMeta[] = data.map((s) => ({
      name: s.name,
      description: s.description,
      relativePath: `skills/${s.name}/SKILL.md`,
      directory: s.name,
    }));
    setSkills(mapped);
  }

  async function loadAuthStatus() {
    try {
      const res = await fetch("/api/auth/status");
      const data = (await res.json()) as AuthStatus;
      setAuth(data);
    } catch {
      setAuth(null);
    }
  }

  useEffect(() => {
    if (page !== "explorer") return;
    void reloadSkills();
    void loadAuthStatus();
    const path = window.location.pathname;
    if (path.startsWith("/skill/")) {
      setSelectedName(decodeURIComponent(path.replace("/skill/", "")));
    }
  }, [page]);

  useEffect(() => {
    if (page !== "explorer") return;
    if (!selectedName) {
      setSelectedDoc(null);
      return;
    }
    const targetPath = `/skill/${encodeURIComponent(selectedName)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
    setIsLoadingDoc(true);
    setSelectedDoc(null);
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
          content,
          raw,
        };
        setSelectedDoc(doc);
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

  const skillUrl = selectedDoc
    ? `${window.location.origin}/skill/${encodeURIComponent(selectedDoc.name)}`
    : "";

  async function copyUrl() {
    await navigator.clipboard.writeText(skillUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyInstallCmd(name: string) {
    await navigator.clipboard.writeText(`npx @hacxy/skills install ${name}`);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  }

  async function uploadSkill() {
    setUploadMessage("");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: uploadName,
        content: uploadContent,
        onConflict,
      }),
    });
    const data = (await res.json()) as { ok: boolean; message: string };
    setUploadOk(data.ok);
    setUploadMessage(data.message);
    if (data.ok) {
      setUploadName("");
      setUploadContent("");
      await reloadSkills();
    }
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
        {/* Header */}
        <header className="explorer-header">
          <button className="logo" onClick={() => navigateTo("home")}>
            <Icon icon="lucide:zap" width="18" height="18" color="#6366f1" />
            <span>Skills</span>
          </button>
          {showDetail && (
            <motion.button
              className="back-btn"
              onClick={goBack}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon="lucide:arrow-left" width="15" height="15" />
              返回列表
            </motion.button>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "切换浅色" : "切换深色"}
          >
            <Icon
              icon={theme === "dark" ? "lucide:sun" : "lucide:moon"}
              width="15"
              height="15"
            />
          </button>
        </header>

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
                    placeholder="搜索 skill 名称或描述..."
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
                  <p className="search-hint">找到 {filtered.length} 个结果</p>
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
                  <p>未找到 &ldquo;{query}&rdquo;</p>
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
                          npx @hacxy/skills install{skill.name}
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

                    <div className="install-box">
                      <span className="install-box-label">安装</span>
                      <code>npx @hacxy/skills install{selectedDoc.name}</code>
                      <button
                        className="copy-btn"
                        onClick={() => void copyInstallCmd(selectedDoc.name)}
                      >
                        <Icon
                          icon={copiedInstall ? "lucide:check" : "lucide:copy"}
                          width="13"
                          height="13"
                        />
                        {copiedInstall ? "已复制" : "复制"}
                      </button>
                    </div>

                    <div className="url-row">
                      <span className="url-chip">{skillUrl}</span>
                      <button
                        className="copy-btn"
                        onClick={() => void copyUrl()}
                      >
                        <Icon
                          icon={copied ? "lucide:check" : "lucide:copy"}
                          width="13"
                          height="13"
                        />
                        {copied ? "已复制" : "复制链接"}
                      </button>
                    </div>

                    <article
                      className="markdown"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(selectedDoc.content) as string,
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {auth?.canUpload && (
                <motion.section
                  className="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h3 className="upload-title">上传 Skill</h3>
                  <input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="skill 名称"
                  />
                  <textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="粘贴 SKILL.md 内容"
                  />
                  <select
                    value={onConflict}
                    onChange={(e) =>
                      setOnConflict(
                        e.target.value as "error" | "rename" | "overwrite",
                      )
                    }
                  >
                    <option value="rename">冲突时自动重命名</option>
                    <option value="overwrite">冲突时覆盖</option>
                    <option value="error">冲突时报错</option>
                  </select>
                  <button
                    className="upload-btn"
                    onClick={() => void uploadSkill()}
                  >
                    上传
                  </button>
                  {uploadMessage && (
                    <p className={uploadOk ? "msg-ok" : "msg-err"}>
                      {uploadMessage}
                    </p>
                  )}
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
