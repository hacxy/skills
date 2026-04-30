import ky, { HTTPError } from "ky";

export interface SkillMeta {
  name: string;
  description: string;
  files: string[];
}

export interface User {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface FileEntry {
  path: string;
  content: string;
}

const client = ky.create({ throwHttpErrors: true });

export async function getMe(): Promise<User | null> {
  try {
    return await client.get("/auth/me").json<User>();
  } catch (e) {
    if (e instanceof HTTPError && e.response.status === 401) return null;
    throw e;
  }
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function getSkills(): Promise<SkillMeta[]> {
  return client.get("/api/skills").json<SkillMeta[]>();
}

export async function getFileContent(skillName: string, filePath: string): Promise<string> {
  const data = await client
    .get(`/api/file/${encodeURIComponent(skillName)}/${filePath}`)
    .json<{ content: string }>();
  return data.content;
}

export async function updateFile(
  skillName: string,
  filePath: string,
  content: string,
): Promise<void> {
  await client.put(`/api/file/${encodeURIComponent(skillName)}/${filePath}`, {
    json: { content },
  });
}

export async function deleteFile(skillName: string, filePath: string): Promise<void> {
  await client.delete(`/api/file/${encodeURIComponent(skillName)}/${filePath}`);
}

export async function uploadSkill(
  name: string,
  files: FileEntry[],
  force = false,
): Promise<void> {
  await client.post("/api/skills", { json: { name, files, force } });
}

export async function deleteSkill(name: string): Promise<void> {
  await client.delete(`/api/skills/${encodeURIComponent(name)}`);
}
