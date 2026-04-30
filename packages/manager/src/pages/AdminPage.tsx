import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import {
  deleteSkill,
  getSkills,
  logout,
  type SkillMeta,
  type User,
} from "../api";
import { FileTree } from "../components/FileTree";
import { FileEditor } from "../components/FileEditor";
import { UploadPanel } from "../components/UploadPanel";

interface Props {
  user: User;
  onLogout: () => void;
}

type View = "editor" | "upload";

export function AdminPage({ user, onLogout }: Props) {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [view, setView] = useState<View>("editor");

  async function loadSkills() {
    setLoadingSkills(true);
    try {
      setSkills(await getSkills());
    } finally {
      setLoadingSkills(false);
    }
  }

  useEffect(() => { void loadSkills(); }, []);

  async function handleLogout() {
    await logout();
    onLogout();
  }

  function selectSkill(name: string) {
    setSelectedSkill(name);
    setSelectedFile(null);
    setView("editor");
  }

  async function handleDeleteSkill(name: string) {
    if (!confirm(`确认删除技能 "${name}" 及其所有文件？`)) return;
    await deleteSkill(name);
    if (selectedSkill === name) {
      setSelectedSkill(null);
      setSelectedFile(null);
    }
    void loadSkills();
  }

  function handleUploadSuccess(name: string) {
    void loadSkills();
    setSelectedSkill(name);
    setSelectedFile(null);
    setView("editor");
  }

  const selectedSkillMeta = skills.find((s) => s.name === selectedSkill);

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-logo">
          Skills <span>Manager</span>
        </div>
        <div className="header-spacer" />
        <div className="user-info">
          <img src={user.avatar_url} alt={user.login} className="user-avatar" />
          <span>{user.name ?? user.login}</span>
        </div>
        <button className="btn-logout" onClick={() => void handleLogout()}>
          退出
        </button>
      </header>

      <div className="admin-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Skills</span>
            <button
              className={`btn-icon${view === "upload" && !selectedSkill ? " active" : ""}`}
              title="上传新技能"
              onClick={() => { setSelectedSkill(null); setSelectedFile(null); setView("upload"); }}
            >
              <Icon icon="lucide:plus" width="13" height="13" />
            </button>
          </div>
          {loadingSkills ? (
            <div className="sidebar-loading">加载中…</div>
          ) : (
            <div className="skill-list">
              {skills.map((s) => (
                <div
                  key={s.name}
                  className={`skill-item${selectedSkill === s.name ? " selected" : ""}`}
                  onClick={() => selectSkill(s.name)}
                >
                  <Icon icon="lucide:box" width="13" height="13" />
                  <span className="skill-item-name">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="main-content">
          {view === "upload" ? (
            <UploadPanel
              onCancel={() => setView("editor")}
              onSuccess={handleUploadSuccess}
            />
          ) : selectedSkill && selectedSkillMeta ? (
            <>
              <FileTree
                skillName={selectedSkill}
                files={selectedSkillMeta.files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                onDeleteFile={() => {
                  setSelectedFile(null);
                  void loadSkills();
                }}
                onDeleteSkill={() => void handleDeleteSkill(selectedSkill)}
                onUploadToSkill={() => setView("upload")}
              />
              <FileEditor
                skillName={selectedSkill}
                filePath={selectedFile}
              />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Icon icon="lucide:layers" width="40" height="40" />
              </div>
              <p>从左侧选择一个技能</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
