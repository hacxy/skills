import { useEffect, useRef, useState } from "react";
import { getFileContent, updateFile } from "../api";

interface Props {
  skillName: string;
  filePath: string | null;
}

export function FileEditor({ skillName, filePath }: Props) {
  const [content, setContent] = useState("");
  const [edited, setEdited] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const statusTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setStatus(null);
    getFileContent(skillName, filePath)
      .then((c) => { setContent(c); setEdited(c); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus({ msg, ok: false });
      })
      .finally(() => setLoading(false));
  }, [skillName, filePath]);

  async function handleSave() {
    if (!filePath) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateFile(skillName, filePath, edited);
      setContent(edited);
      setStatus({ msg: "已保存", ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus({ msg, ok: false });
    } finally {
      setSaving(false);
      window.clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setStatus(null), 3000);
    }
  }

  if (!filePath) {
    return (
      <div className="file-editor">
        <div className="editor-loading">从文件树选择一个文件</div>
      </div>
    );
  }

  const isDirty = edited !== content;

  return (
    <div className="file-editor">
      <div className="editor-header">
        <span className="editor-path">{skillName}/{filePath}</span>
        <div className="editor-actions">
          {status && (
            <span className={`editor-status${status.ok ? "" : " error"}`}>
              {status.msg}
            </span>
          )}
          <button
            className="btn-primary"
            onClick={() => void handleSave()}
            disabled={saving || loading || !isDirty}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
      <div className="editor-body">
        {loading ? (
          <div className="editor-loading">加载中…</div>
        ) : (
          <textarea
            className="code-textarea"
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
