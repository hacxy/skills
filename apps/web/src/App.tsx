import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";

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

export function App() {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<SkillDoc | null>(null);
  const [query, setQuery] = useState("");
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [onConflict, setOnConflict] = useState<"error" | "rename" | "overwrite">("rename");

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
    void reloadSkills();
    void loadAuthStatus();
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/skill/")) {
      const fromPath = decodeURIComponent(path.replace("/skill/", ""));
      setSelectedName(fromPath);
    }
    const handlePopState = () => {
      const nextPath = window.location.pathname;
      if (nextPath.startsWith("/skill/")) {
        setSelectedName(decodeURIComponent(nextPath.replace("/skill/", "")));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!selectedName) return;
    const targetPath = `/skill/${encodeURIComponent(selectedName)}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
    void fetch(`/api/skills/${encodeURIComponent(selectedName)}`)
      .then((res) => res.json())
      .then((data: SkillDoc) => setSelectedDoc(data));
  }, [selectedName]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return skills;
    return skills.filter((item) =>
      `${item.name} ${item.description} ${item.relativePath}`.toLowerCase().includes(keyword)
    );
  }, [query, skills]);

  async function uploadSkill() {
    setUploadMessage("");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: uploadName,
        content: uploadContent,
        onConflict
      })
    });

    const data = (await res.json()) as { ok: boolean; message: string };
    setUploadMessage(data.message);
    if (data.ok) {
      setUploadName("");
      setUploadContent("");
      await reloadSkills();
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Skills Explorer</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索 skill..."
          className="search"
        />
        <ul className="skill-list">
          {filtered.map((skill) => (
            <li key={skill.relativePath}>
              <button
                className={skill.name === selectedName ? "skill-item active" : "skill-item"}
                onClick={() => setSelectedName(skill.name)}
              >
                <div>{skill.name}</div>
                <small>{skill.description}</small>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="content">
        {selectedDoc ? (
          <>
            <h2>{selectedDoc.name}</h2>
            <p className="desc">{selectedDoc.description}</p>
            <p className="path-chip">{window.location.origin}/skill/{encodeURIComponent(selectedDoc.name)}</p>
            <article
              className="markdown"
              dangerouslySetInnerHTML={{ __html: marked.parse(selectedDoc.content) as string }}
            />
          </>
        ) : (
          <p>请选择一个 skill 查看详情。</p>
        )}

        {auth?.canUpload ? (
          <section className="upload">
            <h3>上传 Skill（仅 owner）</h3>
            <input
              value={uploadName}
              onChange={(event) => setUploadName(event.target.value)}
              placeholder="skill 名称"
            />
            <textarea
              value={uploadContent}
              onChange={(event) => setUploadContent(event.target.value)}
              placeholder="粘贴 SKILL.md 内容"
            />
            <select value={onConflict} onChange={(event) => setOnConflict(event.target.value as "error" | "rename" | "overwrite")}>
              <option value="rename">冲突时自动重命名</option>
              <option value="overwrite">冲突时覆盖</option>
              <option value="error">冲突时报错</option>
            </select>
            <button onClick={() => void uploadSkill()}>上传</button>
            {uploadMessage ? <p>{uploadMessage}</p> : null}
          </section>
        ) : (
          <section className="upload disabled">
            <h3>上传 Skill（受限）</h3>
            <p>当前不满足双因子校验，上传入口已隐藏。</p>
            <p>
              github={String(auth?.githubOk)} token={String(auth?.tokenOk)} user=
              {auth?.currentGithub || "unknown"}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
