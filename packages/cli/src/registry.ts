import { execFile } from "node:child_process";
import { promisify } from "node:util";
import matter from "gray-matter";

const execFileAsync = promisify(execFile);

export const REGISTRY_OWNER = "hacxy";
export const REGISTRY_REPO = "skills";
export const REGISTRY_BRANCH = "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REGISTRY_OWNER}/${REGISTRY_REPO}/${REGISTRY_BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REGISTRY_OWNER}/${REGISTRY_REPO}`;

export interface RegistrySkillMeta {
  name: string;
  description: string;
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

async function getFileSha(path: string, token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/contents/${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取文件 SHA 失败: ${res.status}`);
  const data = await res.json() as { sha: string };
  return data.sha;
}

async function putFile(path: string, content: string, message: string, token: string, existingSha?: string | null): Promise<void> {
  const sha = existingSha !== undefined ? existingSha : await getFileSha(path, token);
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: REGISTRY_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${API_BASE}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`推送失败 (${res.status}): ${err}`);
  }
}

async function updateRegistryJson(name: string, description: string, token: string): Promise<void> {
  let index: RegistrySkillMeta[] = [];
  try {
    index = await fetchRegistryIndex();
  } catch {
    // registry.json may not exist yet
  }
  const existing = index.findIndex((s) => s.name === name);
  if (existing >= 0) {
    index[existing] = { name, description };
  } else {
    index.push({ name, description });
    index.sort((a, b) => a.name.localeCompare(b.name));
  }
  await putFile(
    "skills-registry.json",
    JSON.stringify(index, null, 2) + "\n",
    `chore: update skills-registry.json`,
    token,
  );
}

export async function pushSkillToRegistry(
  name: string,
  content: string,
  token: string,
): Promise<void> {
  const parsed = matter(content);
  const description = (parsed.data.description as string | undefined)?.toString().trim() ?? "";

  const existingSha = await getFileSha(`skills/${name}/SKILL.md`, token);
  await putFile(
    `skills/${name}/SKILL.md`,
    content,
    existingSha ? `feat: update skill ${name}` : `feat: add skill ${name}`,
    token,
    existingSha,
  );

  await updateRegistryJson(name, description, token);
}
