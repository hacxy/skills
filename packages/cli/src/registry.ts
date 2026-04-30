import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import matter from "gray-matter";
import fs from "fs-extra";
import { readFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);

export const REGISTRY_OWNER = "hacxy";
export const REGISTRY_REPO = "skills";
export const REGISTRY_BRANCH = "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${REGISTRY_REPO}/${REGISTRY_BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REGISTRY_OWNER}/${REGISTRY_REPO}`;

const AUTH_ERROR =
  "GitHub token 无效、已过期或权限不足。\n需要：Classic Token repo scope 或 Fine-grained Token Contents: Read and Write";

const GH_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "@hacxy/skills-cli",
};

function authHeaders(token: string) {
  return { ...GH_HEADERS, Authorization: `token ${token}` };
}

export interface RegistrySkillMeta {
  name: string;
  description: string;
  files: string[];
}

export async function getGithubToken(): Promise<string | null> {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"]);
    const token = stdout.trim();
    return token || null;
  } catch {
    return null;
  }
}

export async function fetchRegistryIndex(): Promise<RegistrySkillMeta[]> {
  const res = await fetch(`${RAW_BASE}/skills-registry.json`);
  if (!res.ok) throw new Error(`获取 registry 失败: ${res.status}`);
  const data = await res.json() as RegistrySkillMeta[];
  return data.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSkillContent(name: string): Promise<string> {
  const res = await fetch(`${RAW_BASE}/skills/${name}/SKILL.md`);
  if (!res.ok) throw new Error(`技能 "${name}" 不存在`);
  return res.text();
}

// 从 registry 读取文件列表，通过 raw URL 下载，无需认证，无 API 限速
export async function fetchSkillDirectory(
  name: string
): Promise<Array<{ path: string; content: string }>> {
  const index = await fetchRegistryIndex();
  const meta = index.find((s) => s.name === name);
  if (!meta) throw new Error(`技能 "${name}" 不存在`);

  const files = meta.files?.length ? meta.files : ["SKILL.md"];

  return Promise.all(
    files.map(async (file) => {
      const res = await fetch(`${RAW_BASE}/skills/${name}/${file}`);
      if (!res.ok) throw new Error(`下载文件失败: ${file} (${res.status})`);
      return { path: file, content: await res.text() };
    })
  );
}

async function getFileSha(path: string, token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/contents/${path}`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error(AUTH_ERROR);
  if (!res.ok) throw new Error(`获取文件 SHA 失败: ${res.status}`);
  const data = await res.json() as { sha: string };
  return data.sha;
}

export async function collectLocalFiles(
  dir: string
): Promise<Array<{ relativePath: string; content: string }>> {
  const result: Array<{ relativePath: string; content: string }> = [];
  async function walk(current: string, prefix: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(abs, rel);
      } else {
        result.push({ relativePath: rel, content: await readFile(abs, "utf8") });
      }
    }
  }
  await walk(dir, "");
  return result;
}

export async function pushSkillDirectory(
  name: string,
  sourceDir: string,
  token: string,
  options: { force?: boolean } = {}
): Promise<void> {
  // 1. 冲突检测
  const existingSha = await getFileSha(`skills/${name}/SKILL.md`, token);
  if (existingSha && !options.force) {
    throw new Error(`技能 "${name}" 已存在，使用 --force 覆盖`);
  }

  // 2. 收集本地文件
  const localFiles = await collectLocalFiles(sourceDir);
  const skillMd = localFiles.find((f) => f.relativePath === "SKILL.md");
  if (!skillMd) throw new Error("源目录中缺少 SKILL.md");

  // 3. 构造更新后的 registry JSON（含 files 列表）
  const parsed = matter(skillMd.content);
  const description = (parsed.data.description as string | undefined)?.trim() ?? "";
  const files = localFiles.map((f) => f.relativePath).sort();

  let index: RegistrySkillMeta[] = [];
  try { index = await fetchRegistryIndex(); } catch { /* registry 尚不存在 */ }
  const idx = index.findIndex((s) => s.name === name);
  const entry: RegistrySkillMeta = { name, description, files };
  if (idx >= 0) index[idx] = entry;
  else { index.push(entry); index.sort((a, b) => a.name.localeCompare(b.name)); }
  const registryContent = JSON.stringify(index, null, 2) + "\n";

  // 4. 获取 HEAD commit SHA
  const refRes = await fetch(`${API_BASE}/git/refs/heads/${REGISTRY_BRANCH}`, {
    headers: authHeaders(token),
  });
  if (refRes.status === 401) throw new Error(AUTH_ERROR);
  if (!refRes.ok) throw new Error(`获取分支 ref 失败: ${refRes.status}`);
  const ref = await refRes.json() as { object: { sha: string } };
  const headSha = ref.object.sha;

  // 5. 获取当前 commit 的 tree SHA
  const commitRes = await fetch(`${API_BASE}/git/commits/${headSha}`, {
    headers: authHeaders(token),
  });
  if (!commitRes.ok) throw new Error(`获取 commit 失败: ${commitRes.status}`);
  const commitData = await commitRes.json() as { tree: { sha: string } };
  const baseTreeSha = commitData.tree.sha;

  // 6. 所有文件（skill 文件 + registry JSON）并行创建 blob
  const allFiles = [
    ...localFiles.map((f) => ({ repoPath: `skills/${name}/${f.relativePath}`, content: f.content })),
    { repoPath: "skills-registry.json", content: registryContent },
  ];

  const treeItems = await Promise.all(
    allFiles.map(async ({ repoPath, content }) => {
      const blobRes = await fetch(`${API_BASE}/git/blobs`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({
          content: Buffer.from(content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      });
      if (blobRes.status === 401) throw new Error(AUTH_ERROR);
      if (!blobRes.ok) throw new Error(`创建 blob 失败: ${repoPath} (${blobRes.status})`);
      const blob = await blobRes.json() as { sha: string };
      return { path: repoPath, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
    })
  );

  // 7. 创建新 tree
  const newTreeRes = await fetch(`${API_BASE}/git/trees`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!newTreeRes.ok) throw new Error(`创建 tree 失败: ${newTreeRes.status}`);
  const newTree = await newTreeRes.json() as { sha: string };

  // 8. 创建 commit
  const action = existingSha ? "update" : "add";
  const newCommitRes = await fetch(`${API_BASE}/git/commits`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `feat: ${action} skill ${name}`,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(`创建 commit 失败: ${newCommitRes.status}`);
  const newCommit = await newCommitRes.json() as { sha: string };

  // 9. 更新分支 ref
  const updateRefRes = await fetch(`${API_BASE}/git/refs/heads/${REGISTRY_BRANCH}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRefRes.ok) throw new Error(`更新分支 ref 失败: ${updateRefRes.status}`);
}
