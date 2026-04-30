export interface OwnerAuthResult {
  ok: boolean;
  tokenOk: boolean;
  reason?: string;
}

export async function ensureOwnerAccess(): Promise<OwnerAuthResult> {
  const tokenOk = !!(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  return {
    ok: tokenOk,
    tokenOk,
    reason: tokenOk ? undefined : "缺少 GITHUB_TOKEN 环境变量",
  };
}
