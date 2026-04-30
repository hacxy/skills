import fg from "fast-glob";
import { basename, dirname, relative, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import matter from "gray-matter";

export interface SkillMeta {
  name: string;
  description: string;
  relativePath: string;
  directory: string;
}

export interface SkillDoc extends SkillMeta {
  content: string;
  raw: string;
}

export interface SkillValidationIssue {
  path: string;
  level: "error" | "warn";
  message: string;
}

const SKILL_PATTERNS = ["skills/*/SKILL.md", "*/SKILL.md"];

function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

function parseMarkdown(filePath: string, raw: string, rootDir: string): SkillDoc {
  const parsed = matter(raw);
  const meta = parsed.data as Partial<SkillMeta>;
  const name = meta.name?.trim() || dirname(relative(rootDir, filePath));
  const description = meta.description?.toString().trim() || "No description";
  const relativePath = relative(rootDir, filePath);
  const directory = dirname(relativePath);
  return { name, description, relativePath, directory, content: parsed.content.trim(), raw };
}

export function parseSkillContent(raw: string, nameHint = "unknown"): SkillDoc {
  const parsed = matter(raw);
  const meta = parsed.data as Partial<SkillMeta>;
  const name = meta.name?.trim() || nameHint;
  const description = meta.description?.toString().trim() || "No description";
  return { name, description, relativePath: "", directory: "", content: parsed.content.trim(), raw };
}

export async function discoverSkillFiles(rootDir: string): Promise<string[]> {
  return fg(SKILL_PATTERNS, { cwd: rootDir, absolute: true, onlyFiles: true, followSymbolicLinks: false });
}

export async function loadSkillFromFile(rootDir: string, filePath: string): Promise<SkillDoc> {
  const raw = await readFile(filePath, "utf8");
  return parseMarkdown(filePath, raw, rootDir);
}

export async function buildSkillIndex(rootDir: string): Promise<SkillMeta[]> {
  const files = await discoverSkillFiles(rootDir);
  const docs = await Promise.all(files.map((file) => loadSkillFromFile(rootDir, file)));
  return docs
    .map(({ name, description, relativePath, directory }) => ({ name, description, relativePath, directory }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSkillByName(rootDir: string, name: string): Promise<SkillDoc | null> {
  const wanted = normalizeSkillName(name);
  const files = await discoverSkillFiles(rootDir);
  const byDir = files.find((f) => normalizeSkillName(basename(dirname(f))) === wanted);
  if (byDir) return loadSkillFromFile(rootDir, byDir);
  for (const filePath of files) {
    const doc = await loadSkillFromFile(rootDir, filePath);
    if (normalizeSkillName(doc.name) === wanted) return doc;
  }
  return null;
}

export function searchSkills<T extends { name: string; description: string }>(index: T[], query: string): T[] {
  const keyword = normalizeSkillName(query);
  return index.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(keyword));
}

export function validateSkillDocument(doc: SkillDoc): SkillValidationIssue[] {
  const issues: SkillValidationIssue[] = [];
  if (!doc.name?.trim()) issues.push({ path: doc.relativePath, level: "error", message: "缺少 frontmatter.name" });
  if (!doc.description?.trim()) issues.push({ path: doc.relativePath, level: "error", message: "缺少 frontmatter.description" });
  if (!doc.content?.trim()) issues.push({ path: doc.relativePath, level: "warn", message: "正文为空" });
  return issues;
}

export async function doctorSkills(rootDir: string): Promise<SkillValidationIssue[]> {
  const files = await discoverSkillFiles(rootDir);
  if (!files.length) {
    return [{ path: resolve(rootDir), level: "warn", message: "未发现任何 SKILL.md 文件" }];
  }
  const allIssues: SkillValidationIssue[] = [];
  for (const filePath of files) {
    const doc = await loadSkillFromFile(rootDir, filePath);
    allIssues.push(...validateSkillDocument(doc));
  }
  return allIssues;
}
