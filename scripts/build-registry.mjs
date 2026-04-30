import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const skillsDir = join(rootDir, "skills");
const outputPath = join(rootDir, "skills-registry.json");

async function collectFiles(dir, base) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, base)));
    } else {
      files.push(relative(base, fullPath).replace(/\\/g, "/"));
    }
  }
  return files.sort();
}

const dirs = (await readdir(skillsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const registry = [];
for (const dir of dirs) {
  const skillDir = join(skillsDir, dir);
  const skillPath = join(skillDir, "SKILL.md");
  try {
    const raw = await readFile(skillPath, "utf8");
    const parsed = matter(raw);
    const name = (parsed.data.name ?? dir).toString().trim();
    const description = (parsed.data.description ?? "").toString().trim().replace(/\s*\n\s*/g, " ");
    const files = await collectFiles(skillDir, skillDir);
    registry.push({ name, description, files });
  } catch {
    // skip dirs without SKILL.md
  }
}

await writeFile(outputPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
console.log(`Generated skills-registry.json with ${registry.length} skills`);
