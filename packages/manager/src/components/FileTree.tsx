import { Icon } from "@iconify/react";
import { deleteFile } from "../api";

interface Props {
  skillName: string;
  files: string[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onDeleteFile: () => void;
  onDeleteSkill: () => void;
  onUploadToSkill: () => void;
}

export function FileTree({
  skillName,
  files,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  onDeleteSkill,
}: Props) {
  async function handleDeleteFile(filePath: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`删除文件 "${filePath}"？`)) return;
    await deleteFile(skillName, filePath);
    onDeleteFile();
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="skill-name-badge">{skillName}</span>
      </div>

      <div className="file-list">
        {files.map((f) => (
          <div
            key={f}
            className={`file-item${selectedFile === f ? " selected" : ""}`}
            onClick={() => onSelectFile(f)}
          >
            <Icon icon="lucide:file-text" width="12" height="12" />
            <span className="file-item-name">{f}</span>
            <button
              className="file-delete-btn"
              onClick={(e) => void handleDeleteFile(f, e)}
              title="删除文件"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button className="delete-skill-btn" onClick={onDeleteSkill}>
        <Icon icon="lucide:trash-2" width="13" height="13" />
        删除整个技能
      </button>
    </div>
  );
}
