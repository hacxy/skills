import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
import { uploadSkill, type FileEntry } from "../api";

interface Props {
  onCancel: () => void;
  onSuccess: (skillName: string) => void;
}

export function UploadPanel({ onCancel, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [force, setForce] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readFiles(fileList: FileList) {
    const entries: FileEntry[] = [];
    let inferredName = "";

    for (const file of fileList) {
      const rel = file.webkitRelativePath || file.name;
      const parts = rel.split("/");

      if (!inferredName && parts.length > 1) {
        inferredName = parts[0];
      }

      const path = parts.length > 1 ? parts.slice(1).join("/") : rel;
      if (!path) continue;

      const content = await file.text();
      entries.push({ path, content });
    }

    setFiles(entries);
    if (inferredName && !name) setName(inferredName);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void readFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files.length) void readFiles(e.dataTransfer.files);
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("请输入技能名称"); return; }
    if (!files.length) { setError("请选择技能文件夹"); return; }
    if (!files.find((f) => f.path === "SKILL.md")) {
      setError("文件夹中缺少 SKILL.md"); return;
    }

    setUploading(true);
    setError(null);
    try {
      await uploadSkill(name.trim(), files, force);
      onSuccess(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-panel">
      <div className="upload-header">
        <span className="upload-title">上传新技能</span>
        <button className="btn-secondary" onClick={onCancel}>取消</button>
      </div>

      <div className="upload-body">
        <div className="form-group">
          <label className="form-label">技能名称</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如: commit"
          />
        </div>

        <div className="form-group">
          <label className="form-label">技能文件夹</label>
          <div
            className={`drop-zone${dragover ? " dragover" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              // @ts-expect-error webkitdirectory is non-standard
              webkitdirectory=""
              onChange={handleInputChange}
            />
            <Icon icon="lucide:folder-open" width="24" height="24" />
            <span>点击选择文件夹，或拖拽到此处</span>
          </div>
        </div>

        {files.length > 0 && (
          <div className="form-group">
            <label className="form-label">已选文件（{files.length} 个）</label>
            <div className="file-preview">
              {files.map((f) => (
                <div key={f.path} className="file-preview-item">{f.path}</div>
              ))}
            </div>
          </div>
        )}

        <label className="form-check">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          覆盖已存在的技能
        </label>

        {error && <div className="upload-error">{error}</div>}

        <button
          className="btn-primary"
          onClick={() => void handleSubmit()}
          disabled={uploading}
        >
          {uploading ? "上传中…" : "上传"}
        </button>
      </div>
    </div>
  );
}
