import { getGithubToken } from "./registry.js";

export interface OwnerAuthResult {
  ok: boolean;
  tokenOk: boolean;
  reason?: string;
}

export async function ensureOwnerAccess(): Promise<OwnerAuthResult> {
  const token = await getGithubToken();
  const tokenOk = !!token;
  return {
    ok: tokenOk,
    tokenOk,
    reason: tokenOk ? undefined : "缺少 GitHub token，请设置 GITHUB_TOKEN 环境变量或执行 gh auth login",
  };
}
