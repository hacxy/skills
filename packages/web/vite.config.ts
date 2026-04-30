import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { buildSkillIndex, loadSkillByName } from "../cli/src/core.js";

async function listSkillFiles(skillDir: string, baseDir: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        results.push(relative(baseDir, full).replace(/\\/g, "/"));
      }
    }
  }
  await walk(skillDir);
  return results.sort();
}

const projectRoot = resolve(process.env.SKILLS_ROOT || resolve(__dirname, "..", ".."));
const skillsRoot = existsSync(join(projectRoot, "skills")) ? join(projectRoot, "skills") : projectRoot;


export default defineConfig({
  plugins: [
    react(),
    {
      name: "skills-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) return next();

          if (req.url === "/api/skills" && req.method === "GET") {
            const index = await buildSkillIndex(skillsRoot);
            const withFiles = await Promise.all(
              index.map(async (skill) => {
                const skillDir = resolve(skillsRoot, skill.directory);
                const files = await listSkillFiles(skillDir, skillDir);
                return { ...skill, files };
              }),
            );
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(withFiles));
            return;
          }

          if (req.url.startsWith("/api/skills/") && req.method === "GET") {
            const rest = decodeURIComponent(req.url.replace("/api/skills/", ""));
            // /api/skills/:name/files → return file list
            if (rest.endsWith("/files")) {
              const name = rest.slice(0, -"/files".length);
              const index = await buildSkillIndex(skillsRoot);
              const skill = index.find((s) => s.name === name);
              if (!skill) {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: "not found" }));
                return;
              }
              const skillDir = resolve(skillsRoot, skill.directory);
              const files = await listSkillFiles(skillDir, skillDir);
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(files));
              return;
            }
            // /api/skills/:name → return skill doc
            const doc = await loadSkillByName(skillsRoot, rest);
            if (!doc) {
              res.statusCode = 404;
              res.end(JSON.stringify({ message: "not found" }));
              return;
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(doc));
            return;
          }

          if (req.url.startsWith("/api/file/") && req.method === "GET") {
            const parts = decodeURIComponent(req.url.replace("/api/file/", "")).split("/");
            const skillName = parts[0];
            const filePath = parts.slice(1).join("/");
            if (!skillName || !filePath) {
              res.statusCode = 400;
              res.end("bad request");
              return;
            }
            const skillDir = resolve(skillsRoot, skillName);
            const target = resolve(skillDir, filePath);
            if (!target.startsWith(skillDir)) {
              res.statusCode = 403;
              res.end("forbidden");
              return;
            }
            try {
              const content = await readFile(target, "utf8");
              res.setHeader("content-type", "text/plain; charset=utf-8");
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.end("not found");
            }
            return;
          }

          next();
        });
      }
    }
  ]
});
