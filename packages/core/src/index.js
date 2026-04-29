import fg from "fast-glob";
import { dirname, relative, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import matter from "gray-matter";
const SKILL_PATTERNS = ["skills/*/SKILL.md", "*/SKILL.md"];
function normalizeSkillName(name) {
    return name.trim().toLowerCase();
}
function parseMarkdown(filePath, raw, rootDir) {
    const parsed = matter(raw);
    const meta = parsed.data;
    const name = meta.name?.trim() || dirname(relative(rootDir, filePath));
    const description = meta.description?.toString().trim() || "No description";
    const relativePath = relative(rootDir, filePath);
    const directory = dirname(relativePath);
    return {
        name,
        description,
        relativePath,
        directory,
        content: parsed.content.trim(),
        raw
    };
}
export async function discoverSkillFiles(rootDir) {
    return fg(SKILL_PATTERNS, {
        cwd: rootDir,
        absolute: true,
        onlyFiles: true,
        followSymbolicLinks: false
    });
}
export async function loadSkillFromFile(rootDir, filePath) {
    const raw = await readFile(filePath, "utf8");
    return parseMarkdown(filePath, raw, rootDir);
}
export async function buildSkillIndex(rootDir) {
    const files = await discoverSkillFiles(rootDir);
    const docs = await Promise.all(files.map((file) => loadSkillFromFile(rootDir, file)));
    return docs
        .map((item) => ({
        name: item.name,
        description: item.description,
        relativePath: item.relativePath,
        directory: item.directory
    }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
export async function loadSkillByName(rootDir, name) {
    const wanted = normalizeSkillName(name);
    const files = await discoverSkillFiles(rootDir);
    for (const filePath of files) {
        const doc = await loadSkillFromFile(rootDir, filePath);
        if (normalizeSkillName(doc.name) === wanted || normalizeSkillName(doc.directory) === wanted) {
            return doc;
        }
    }
    return null;
}
export function searchSkills(index, query) {
    const keyword = normalizeSkillName(query);
    return index.filter((item) => {
        const haystack = `${item.name} ${item.description} ${item.relativePath}`.toLowerCase();
        return haystack.includes(keyword);
    });
}
export function validateSkillDocument(doc) {
    const issues = [];
    if (!doc.name?.trim()) {
        issues.push({ path: doc.relativePath, level: "error", message: "缺少 frontmatter.name" });
    }
    if (!doc.description?.trim()) {
        issues.push({ path: doc.relativePath, level: "error", message: "缺少 frontmatter.description" });
    }
    if (!doc.content?.trim()) {
        issues.push({ path: doc.relativePath, level: "warn", message: "正文为空" });
    }
    return issues;
}
export async function doctorSkills(rootDir) {
    const files = await discoverSkillFiles(rootDir);
    if (!files.length) {
        return [{ path: resolve(rootDir), level: "warn", message: "未发现任何 SKILL.md 文件" }];
    }
    const allIssues = [];
    for (const filePath of files) {
        const doc = await loadSkillFromFile(rootDir, filePath);
        allIssues.push(...validateSkillDocument(doc));
    }
    return allIssues;
}
//# sourceMappingURL=index.js.map