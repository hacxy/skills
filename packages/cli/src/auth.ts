import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface OwnerAuthResult {
  ok: boolean;
  githubOk: boolean;
  tokenOk: boolean;
  githubUser?: string;
  reason?: string;
}

export function getOwnerConfig() {
  return {
    ownerGithub: process.env.SKILLS_OWNER_GITHUB || "hacxy",
    tokenFile: process.env.SKILLS_OWNER_TOKEN_FILE || join(homedir(), ".skills-owner-token")
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function getGithubLogin(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", "user", "--jq", ".login"]);
    const login = stdout.trim();
    return login || null;
  } catch {
    return null;
  }
}

export async function ensureOwnerAccess(): Promise<OwnerAuthResult> {
  const { ownerGithub, tokenFile } = getOwnerConfig();
  const githubUser = await getGithubLogin();
  const githubOk = githubUser === ownerGithub;

  const suppliedToken = process.env.SKILLS_OWNER_TOKEN;
  if (!suppliedToken) {
    return {
      ok: false,
      githubOk,
      tokenOk: false,
      githubUser: githubUser || undefined,
      reason: "缺少 SKILLS_OWNER_TOKEN 环境变量"
    };
  }

  let expectedHash = "";
  try {
    expectedHash = (await readFile(tokenFile, "utf8")).trim();
  } catch {
    return {
      ok: false,
      githubOk,
      tokenOk: false,
      githubUser: githubUser || undefined,
      reason: "本地 owner token 未初始化，请先执行 skills auth init --token <token>"
    };
  }

  const tokenOk = sha256(suppliedToken) === expectedHash;
  const ok = githubOk && tokenOk;

  return {
    ok,
    githubOk,
    tokenOk,
    githubUser: githubUser || undefined,
    reason: ok ? undefined : "双因子校验未通过（GitHub 身份 + 本地 token）"
  };
}

export async function initOwnerToken(token?: string): Promise<{ token: string; tokenFile: string }> {
  const { tokenFile } = getOwnerConfig();
  const useToken = token || randomBytes(16).toString("hex");
  const digest = sha256(useToken);
  await mkdir(dirname(tokenFile), { recursive: true });
  await writeFile(tokenFile, `${digest}\n`, "utf8");
  await chmod(tokenFile, 0o600);
  return { token: useToken, tokenFile };
}
