import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { buildSkillIndex, loadSkillByName } from "../cli/src/core.js";
import { getGithubToken, pushSkillDirectory } from "../cli/src/registry.js";

const projectRoot = resolve(process.env.SKILLS_ROOT || resolve(__dirname, "..", ".."));
const skillsRoot = existsSync(join(projectRoot, "skills")) ? join(projectRoot, "skills") : projectRoot;

function checkOwnerAuth() {
  const tokenOk = !!(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  return {
    canUpload: tokenOk,
    tokenOk,
    reason: tokenOk ? undefined : "缺少 GITHUB_TOKEN",
  };
}

async function parseBody(req: import("node:http").IncomingMessage): Promise<Record<string, unknown>> {
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
            const status = checkOwnerAuth();
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(status));
            return;
          }

          if (req.url === "/api/upload" && req.method === "POST") {
            const status = checkOwnerAuth();
            if (!status.canUpload) {
              res.statusCode = 403;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: false, message: `上传被拒绝: ${status.reason}` }));
              return;
            }

            const body = await parseBody(req);
            const name = body.name?.toString().trim();
            const content = body.content?.toString() || "";
            if (!name || !content) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, message: "name 和 content 必填" }));
              return;
            }

            const token = await getGithubToken();
            if (!token) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, message: "未获取到 GITHUB_TOKEN" }));
              return;
            }

            const tmpBase = await mkdtemp(join(tmpdir(), `skill-upload-`));
            try {
              await writeFile(join(tmpBase, "SKILL.md"), content, "utf8");
              await pushSkillDirectory(name, tmpBase, token, { force: true });
            } finally {
              await rm(tmpBase, { recursive: true, force: true });
            }
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, message: `上传成功: ${name}` }));
            return;
          }

          next();
        });
      }
    }
  ]
});
