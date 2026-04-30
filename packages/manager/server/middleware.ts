import type { IncomingMessage, ServerResponse } from "node:http";
import {
  exchangeCodeForToken,
  fetchRegistryIndex,
  getSkillFileContent,
  getUser,
  updateSingleFile,
  deleteSingleFile,
  uploadSkillDir,
  deleteSkillDir,
  type FileEntry,
} from "./github.js";

const OWNER = "hacxy";
const ALLOWED_LOGIN = OWNER;

function getTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)gh_token=([^;]+)/);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function setTokenCookie(res: ServerResponse, token: string) {
  const encoded = Buffer.from(token, "utf8").toString("base64url");
  res.setHeader(
    "Set-Cookie",
    `gh_token=${encoded}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`,
  );
}

function clearTokenCookie(res: ServerResponse) {
  res.setHeader("Set-Cookie", "gh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function requireAuth(req: IncomingMessage, res: ServerResponse): string | null {
  const token = getTokenFromCookie(req.headers.cookie);
  if (!token) {
    json(res, 401, { error: "未登录" });
    return null;
  }
  return token;
}

function skillAndPath(
  req: IncomingMessage,
  prefix: string,
): { skillName: string; filePath: string } | null {
  const rest = decodeURIComponent((req.url ?? "").replace(prefix, ""));
  const slashIdx = rest.indexOf("/");
  if (slashIdx < 0) return null;
  return { skillName: rest.slice(0, slashIdx), filePath: rest.slice(slashIdx + 1) };
}

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => Promise<void> | void;

export function createManagerMiddleware(clientId: string, clientSecret: string): Middleware {

  return async (req, res, next) => {
    const url = req.url ?? "";
    const method = req.method ?? "GET";

    try {
      // ── Auth routes ──────────────────────────────────────────────────

      if (url === "/auth/github" && method === "GET") {
        const params = new URLSearchParams({
          client_id: clientId,
          scope: "repo",
          redirect_uri: `${req.headers["x-forwarded-proto"] ?? "http"}://${req.headers.host}/auth/callback`,
        });
        res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
        res.end();
        return;
      }

      if (url.startsWith("/auth/callback") && method === "GET") {
        const code = new URL(url, "http://localhost").searchParams.get("code");
        if (!code) {
          res.writeHead(302, { Location: "/?error=missing_code" });
          res.end();
          return;
        }
        const token = await exchangeCodeForToken(code, clientId, clientSecret);
        const user = await getUser(token);
        if (user.login !== ALLOWED_LOGIN) {
          res.writeHead(302, { Location: `/?error=unauthorized&login=${user.login}` });
          res.end();
          return;
        }
        setTokenCookie(res, token);
        res.writeHead(302, { Location: "/" });
        res.end();
        return;
      }

      if (url === "/auth/me" && method === "GET") {
        const token = getTokenFromCookie(req.headers.cookie);
        if (!token) { json(res, 401, { error: "未登录" }); return; }
        const user = await getUser(token);
        json(res, 200, user);
        return;
      }

      if (url === "/auth/logout" && method === "POST") {
        clearTokenCookie(res);
        json(res, 200, { ok: true });
        return;
      }

      // ── API routes (require auth) ────────────────────────────────────

      if (url === "/api/skills" && method === "GET") {
        const token = requireAuth(req, res);
        if (!token) return;
        const skills = await fetchRegistryIndex();
        json(res, 200, skills);
        return;
      }

      if (url === "/api/skills" && method === "POST") {
        const token = requireAuth(req, res);
        if (!token) return;
        const body = (await parseBody(req)) as {
          name?: string;
          files?: FileEntry[];
          force?: boolean;
        };
        if (!body.name || !body.files?.length) {
          json(res, 400, { error: "name 和 files 必填" });
          return;
        }
        await uploadSkillDir(body.name, body.files, token, { force: body.force });
        json(res, 200, { ok: true });
        return;
      }

      if (url.startsWith("/api/skills/") && method === "DELETE") {
        const token = requireAuth(req, res);
        if (!token) return;
        const skillName = decodeURIComponent(url.replace("/api/skills/", ""));
        await deleteSkillDir(skillName, token);
        json(res, 200, { ok: true });
        return;
      }

      if (url.startsWith("/api/file/") && method === "GET") {
        const token = requireAuth(req, res);
        if (!token) return;
        const parts = skillAndPath(req, "/api/file/");
        if (!parts) { json(res, 400, { error: "bad request" }); return; }
        const content = await getSkillFileContent(parts.skillName, parts.filePath, token);
        json(res, 200, { content });
        return;
      }

      if (url.startsWith("/api/file/") && method === "PUT") {
        const token = requireAuth(req, res);
        if (!token) return;
        const parts = skillAndPath(req, "/api/file/");
        if (!parts) { json(res, 400, { error: "bad request" }); return; }
        const body = (await parseBody(req)) as { content?: string };
        if (body.content == null) { json(res, 400, { error: "content 必填" }); return; }
        await updateSingleFile(
          `skills/${parts.skillName}/${parts.filePath}`,
          body.content,
          token,
        );
        json(res, 200, { ok: true });
        return;
      }

      if (url.startsWith("/api/file/") && method === "DELETE") {
        const token = requireAuth(req, res);
        if (!token) return;
        const parts = skillAndPath(req, "/api/file/");
        if (!parts) { json(res, 400, { error: "bad request" }); return; }
        await deleteSingleFile(`skills/${parts.skillName}/${parts.filePath}`, token);
        json(res, 200, { ok: true });
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      json(res, 500, { error: message });
      return;
    }

    next();
  };
}
