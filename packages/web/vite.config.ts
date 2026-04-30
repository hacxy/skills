import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs-extra";
import { buildSkillIndex, loadSkillByName, loadSkillFromFile } from "../cli/src/core.js";

const execFileAsync = promisify(execFile);
const ownerGithub = process.env.SKILLS_OWNER_GITHUB || "hacxy";
const tokenFile = process.env.SKILLS_OWNER_TOKEN_FILE || join(homedir(), ".skills-owner-token");
const projectRoot = resolve(process.env.SKILLS_ROOT || resolve(__dirname, "..", ".."));
const skillsRoot = existsSync(join(projectRoot, "skills")) ? join(projectRoot, "skills") : projectRoot;

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function githubLogin(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", "user", "--jq", ".login"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function checkOwnerAuth() {
  const currentGithub = await githubLogin();
  const githubOk = currentGithub === ownerGithub;
  const token = process.env.SKILLS_OWNER_TOKEN;
  if (!token) {
    return { canUpload: false, githubOk, tokenOk: false, currentGithub, reason: "missing token env" };
  }
  try {
    const expected = (await readFile(tokenFile, "utf8")).trim();
    const tokenOk = hashToken(token) === expected;
    return {
      canUpload: githubOk && tokenOk,
      githubOk,
      tokenOk,
      currentGithub,
      reason: githubOk && tokenOk ? undefined : "2FA failed"
    };
  } catch {
    return { canUpload: false, githubOk, tokenOk: false, currentGithub, reason: "missing token file" };
  }
}

async function parseBody(req: import("node:http").IncomingMessage): Promise<any> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function resolveConflictName(baseDir: string, wantedName: string): Promise<string> {
  let index = 1;
  let candidate = wantedName;
  while (await fs.pathExists(join(baseDir, candidate, "SKILL.md"))) {
    index += 1;
    candidate = `${wantedName}-${index}`;
  }
  return candidate;
}

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
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(index));
            return;
          }

          if (req.url.startsWith("/api/skills/") && req.method === "GET") {
            const name = decodeURIComponent(req.url.replace("/api/skills/", ""));
            const doc = await loadSkillByName(skillsRoot, name);
            if (!doc) {
              res.statusCode = 404;
              res.end(JSON.stringify({ message: "not found" }));
              return;
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(doc));
            return;
          }

          if (req.url === "/api/auth/status" && req.method === "GET") {
            const status = await checkOwnerAuth();
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(status));
            return;
          }

          if (req.url === "/api/upload" && req.method === "POST") {
            const status = await checkOwnerAuth();
            if (!status.canUpload) {
              res.statusCode = 403;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, message: `上传被拒绝: ${status.reason}` }));
              return;
            }

            const body = await parseBody(req);
            const name = body.name?.toString().trim();
            const content = body.content?.toString() || "";
            const onConflict = body.onConflict?.toString() || "rename";
            if (!name || !content) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, message: "name 和 content 必填" }));
              return;
            }
            if (!["error", "rename", "overwrite"].includes(onConflict)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, message: "onConflict 仅支持 error|rename|overwrite" }));
              return;
            }

            let finalName = name;
            const initialPath = join(skillsRoot, finalName, "SKILL.md");
            const exists = await fs.pathExists(initialPath);
            if (exists && onConflict === "error") {
              res.statusCode = 409;
              res.end(JSON.stringify({ ok: false, message: `目标已存在: ${initialPath}` }));
              return;
            }
            if (exists && onConflict === "rename") {
              finalName = await resolveConflictName(skillsRoot, name);
            }

            const targetDir = join(skillsRoot, finalName);
            const targetPath = join(targetDir, "SKILL.md");
            await fs.ensureDir(targetDir);
            await writeFile(targetPath, content, "utf8");
            await loadSkillFromFile(skillsRoot, targetPath);

            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, message: `上传成功: ${targetPath}` }));
            return;
          }

          next();
        });
      }
    }
  ]
});
