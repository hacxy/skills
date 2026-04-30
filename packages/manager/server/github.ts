const OWNER = "hacxy";
const REPO = "skills";
const BRANCH = "main";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const GH_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "@hacxy/skills-manager",
};

function authHeaders(token: string) {
  return { ...GH_HEADERS, Authorization: `token ${token}` };
}

export interface SkillMeta {
  name: string;
  description: string;
  files: string[];
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface FileEntry {
  path: string;
  content: string;
}

function extractDescription(content: string): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return "";
  const descMatch = match[1].match(/^description:\s*(.+)$/m);
  return descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, "") : "";
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!res.ok) throw new Error(`Token 换取失败: ${res.status}`);
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (data.error) throw new Error(data.error_description ?? data.error);
  if (!data.access_token) throw new Error("未获取到 access_token");
  return data.access_token;
}

export async function getUser(token: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`获取用户信息失败: ${res.status}`);
  return res.json() as Promise<GitHubUser>;
}

export async function fetchRegistryIndex(): Promise<SkillMeta[]> {
  const res = await fetch(`${RAW_BASE}/skills-registry.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`获取 registry 失败: ${res.status}`);
  return res.json() as Promise<SkillMeta[]>;
}

async function getFileFromAPI(
  repoPath: string,
  token: string,
): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`${API_BASE}/contents/${repoPath}`, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取文件失败: ${repoPath} (${res.status})`);
  const data = (await res.json()) as { content: string; sha: string };
  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { content, sha: data.sha };
}

export async function getSkillFileContent(
  skillName: string,
  filePath: string,
  token: string,
): Promise<string> {
  const file = await getFileFromAPI(`skills/${skillName}/${filePath}`, token);
  if (!file) throw new Error(`文件不存在: ${filePath}`);
  return file.content;
}

export async function updateSingleFile(
  repoPath: string,
  content: string,
  token: string,
  message?: string,
): Promise<void> {
  const existing = await getFileFromAPI(repoPath, token);
  const body: Record<string, unknown> = {
    message: message ?? (existing ? `update: ${repoPath}` : `add: ${repoPath}`),
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: BRANCH,
  };
  if (existing) body.sha = existing.sha;
  const res = await fetch(`${API_BASE}/contents/${repoPath}`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(`更新文件失败: ${err.message ?? res.status}`);
  }
}

export async function deleteSingleFile(
  repoPath: string,
  token: string,
  message?: string,
): Promise<void> {
  const existing = await getFileFromAPI(repoPath, token);
  if (!existing) return;
  const res = await fetch(`${API_BASE}/contents/${repoPath}`, {
    method: "DELETE",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message ?? `delete: ${repoPath}`,
      sha: existing.sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) throw new Error(`删除文件失败: ${repoPath} (${res.status})`);
}

export async function uploadSkillDir(
  skillName: string,
  files: FileEntry[],
  token: string,
  options: { force?: boolean } = {},
): Promise<void> {
  const skillMd = files.find((f) => f.path === "SKILL.md");
  if (!skillMd) throw new Error("缺少 SKILL.md");

  const existingSha = await getFileFromAPI(`skills/${skillName}/SKILL.md`, token);
  if (existingSha && !options.force) throw new Error(`技能 "${skillName}" 已存在，请启用覆盖选项`);

  const description = extractDescription(skillMd.content);
  const fileNames = files.map((f) => f.path).sort();

  let index: SkillMeta[] = [];
  try { index = await fetchRegistryIndex(); } catch { /* empty */ }
  const idx = index.findIndex((s) => s.name === skillName);
  const entry: SkillMeta = { name: skillName, description, files: fileNames };
  if (idx >= 0) index[idx] = entry;
  else { index.push(entry); index.sort((a, b) => a.name.localeCompare(b.name)); }

  const refRes = await fetch(`${API_BASE}/git/refs/heads/${BRANCH}`, { headers: authHeaders(token) });
  if (!refRes.ok) throw new Error(`获取分支 ref 失败: ${refRes.status}`);
  const ref = (await refRes.json()) as { object: { sha: string } };
  const headSha = ref.object.sha;

  const commitRes = await fetch(`${API_BASE}/git/commits/${headSha}`, { headers: authHeaders(token) });
  if (!commitRes.ok) throw new Error(`获取 commit 失败: ${commitRes.status}`);
  const commitData = (await commitRes.json()) as { tree: { sha: string } };

  const allFiles = [
    ...files.map((f) => ({ repoPath: `skills/${skillName}/${f.path}`, content: f.content })),
    { repoPath: "skills-registry.json", content: JSON.stringify(index, null, 2) + "\n" },
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
      if (!blobRes.ok) throw new Error(`创建 blob 失败: ${repoPath}`);
      const blob = (await blobRes.json()) as { sha: string };
      return { path: repoPath, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
    }),
  );

  const newTreeRes = await fetch(`${API_BASE}/git/trees`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: commitData.tree.sha, tree: treeItems }),
  });
  if (!newTreeRes.ok) throw new Error(`创建 tree 失败: ${newTreeRes.status}`);
  const newTree = (await newTreeRes.json()) as { sha: string };

  const newCommitRes = await fetch(`${API_BASE}/git/commits`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `feat: ${existingSha ? "update" : "add"} skill ${skillName}`,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(`创建 commit 失败: ${newCommitRes.status}`);
  const newCommit = (await newCommitRes.json()) as { sha: string };

  const updateRefRes = await fetch(`${API_BASE}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRefRes.ok) throw new Error(`更新分支 ref 失败: ${updateRefRes.status}`);
}

export async function deleteSkillDir(skillName: string, token: string): Promise<void> {
  const treeRes = await fetch(`${API_BASE}/git/trees/${BRANCH}?recursive=1`, {
    headers: authHeaders(token),
  });
  if (!treeRes.ok) throw new Error(`获取仓库 tree 失败: ${treeRes.status}`);
  const treeData = (await treeRes.json()) as {
    tree: Array<{ path: string; type: string; mode: string }>;
  };

  const prefix = `skills/${skillName}/`;
  const filesToDelete = treeData.tree.filter(
    (item) => item.type === "blob" && item.path.startsWith(prefix),
  );
  if (filesToDelete.length === 0) throw new Error(`技能 "${skillName}" 不存在`);

  let index: SkillMeta[] = [];
  try { index = await fetchRegistryIndex(); } catch { /* empty */ }
  index = index.filter((s) => s.name !== skillName);
  const registryContent = JSON.stringify(index, null, 2) + "\n";

  const regBlobRes = await fetch(`${API_BASE}/git/blobs`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      content: Buffer.from(registryContent, "utf8").toString("base64"),
      encoding: "base64",
    }),
  });
  if (!regBlobRes.ok) throw new Error("创建 registry blob 失败");
  const regBlob = (await regBlobRes.json()) as { sha: string };

  const refRes = await fetch(`${API_BASE}/git/refs/heads/${BRANCH}`, { headers: authHeaders(token) });
  if (!refRes.ok) throw new Error("获取分支 ref 失败");
  const ref = (await refRes.json()) as { object: { sha: string } };
  const headSha = ref.object.sha;

  const commitRes = await fetch(`${API_BASE}/git/commits/${headSha}`, { headers: authHeaders(token) });
  if (!commitRes.ok) throw new Error("获取 commit 失败");
  const commitData = (await commitRes.json()) as { tree: { sha: string } };

  const deleteItems = filesToDelete.map((item) => ({
    path: item.path,
    mode: item.mode as "100644",
    type: "blob" as const,
    sha: null,
  }));

  const newTreeRes = await fetch(`${API_BASE}/git/trees`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: commitData.tree.sha,
      tree: [
        ...deleteItems,
        { path: "skills-registry.json", mode: "100644", type: "blob", sha: regBlob.sha },
      ],
    }),
  });
  if (!newTreeRes.ok) throw new Error("创建 tree 失败");
  const newTree = (await newTreeRes.json()) as { sha: string };

  const newCommitRes = await fetch(`${API_BASE}/git/commits`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `chore: delete skill ${skillName}`,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error("创建 commit 失败");
  const newCommit = (await newCommitRes.json()) as { sha: string };

  const updateRefRes = await fetch(`${API_BASE}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRefRes.ok) throw new Error("更新分支 ref 失败");
}
