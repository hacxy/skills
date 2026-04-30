import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { HomePage } from "./HomePage";

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

const listVariants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export function App() {
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
  const [onConflict, setOnConflict] = useState<"error" | "rename" | "overwrite">("rename");
  const [copied, setCopied] = useState(false);

  function navigateTo(target: Page) {
    setPage(target);
    if (target === "home") {
      window.history.pushState(null, "", "/");
    } else {
      window.history.pushState(null, "", "/explorer");
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/") {
        setPage("home");
      } else {
        setPage("explorer");
        if (path.startsWith("/skill/")) {
          setSelectedName(decodeURIComponent(path.replace("/skill/", "")));
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function reloadSkills() {
    const res = await fetch("/api/skills");
    const data = (await res.json()) as SkillMeta[];
    setSkills(data);
    if (!selectedName && data[0]) {
      setSelectedName(data[0].name);
    }
  }

  async function loadAuthStatus() {
    const res = await fetch("/api/auth/status");
    const data = (await res.json()) as AuthStatus;
    setAuth(data);
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
    if (!selectedName || page !== "explorer") return;
    const targetPath = `/skill/${encodeURIComponent(selectedName)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
    setIsLoadingDoc(true);
    setSelectedDoc(null);
    void fetch(`/api/skills/${encodeURIComponent(selectedName)}`)
      .then((r) => r.json())
      .then((data: SkillDoc) => {
        setSelectedDoc(data);
        setIsLoadingDoc(false);
      });
  }, [selectedName, page]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return skills;
    return skills.filter((s) =>
      `${s.name} ${s.description} ${s.relativePath}`.toLowerCase().includes(keyword),
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

  async function uploadSkill() {
    setUploadMessage("");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: uploadName, content: uploadContent, onConflict }),
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
          <HomePage onBrowse={() => navigateTo("explorer")} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="explorer"
        className="layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <button className="logo" onClick={() => navigateTo("home")}>
              <Icon icon="lucide:zap" width="20" height="20" color="#6366f1" />
              <span>Skills</span>
            </button>
            <p className="sidebar-tagline">AI 编程工具集</p>
          </div>

          <div className="search-wrap">
            <Icon icon="lucide:search" className="search-icon" width="15" height="15" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 skill..."
              className="search"
            />
          </div>

          <motion.ul
            className="skill-list"
            initial="hidden"
            animate="visible"
            variants={listVariants}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((skill) => (
                <motion.li
                  key={skill.relativePath}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button
                    className={`skill-item${skill.name === selectedName ? " active" : ""}`}
                    onClick={() => setSelectedName(skill.name)}
                  >
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-desc">{skill.description}</span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && query && (
              <motion.li
                className="list-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                未找到 &ldquo;{query}&rdquo;
              </motion.li>
            )}
          </motion.ul>
        </aside>

        {/* Content */}
        <main className="content">
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

                <div className="url-row">
                  <span className="url-chip">{skillUrl}</span>
                  <button className="copy-btn" onClick={() => void copyUrl()}>
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
            ) : (
              <motion.div
                key="empty"
                className="empty-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1 } }}
              >
                <Icon icon="lucide:layers" width="44" height="44" />
                <p>从左侧选择一个 skill 查看详情</p>
              </motion.div>
            )}
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
                  setOnConflict(e.target.value as "error" | "rename" | "overwrite")
                }
              >
                <option value="rename">冲突时自动重命名</option>
                <option value="overwrite">冲突时覆盖</option>
                <option value="error">冲突时报错</option>
              </select>
              <button className="upload-btn" onClick={() => void uploadSkill()}>
                上传
              </button>
              {uploadMessage && (
                <p className={uploadOk ? "msg-ok" : "msg-err"}>{uploadMessage}</p>
              )}
            </motion.section>
          )}
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
