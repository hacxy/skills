const SERVER_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : 'https://skills-manager.hacxy.cn'

export interface RegistrySkillMeta {
  name: string;
  description: string;
  files: string[];
}

export async function fetchRegistryIndex(): Promise<RegistrySkillMeta[]> {
  const res = await fetch(`${SERVER_BASE}/api/public/skills`);
  if (!res.ok) throw new Error(`获取 registry 失败: ${res.status}`);
  const data = await res.json() as RegistrySkillMeta[];
  return data.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSkillContent(name: string): Promise<string> {
  const res = await fetch(`${SERVER_BASE}/api/public/file/${encodeURIComponent(name)}/SKILL.md`);
  if (!res.ok) throw new Error(`技能 "${name}" 不存在`);
  return res.text();
}

export async function fetchSkillDirectory(
  name: string
): Promise<Array<{ path: string; content: string }>> {
  const listRes = await fetch(`${SERVER_BASE}/api/public/file/${encodeURIComponent(name)}`);
  if (!listRes.ok) throw new Error(`技能 "${name}" 不存在`);
  const files = (await listRes.json()) as string[];

  return Promise.all(
    files.map(async (file) => {
      const res = await fetch(`${SERVER_BASE}/api/public/file/${encodeURIComponent(name)}/${file}`);
      if (!res.ok) throw new Error(`下载文件失败: ${file} (${res.status})`);
      return { path: file, content: await res.text() };
    })
  );
}
