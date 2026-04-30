import { Icon } from "@iconify/react";

interface Props {
  error: string | null;
}

const errorMessages: Record<string, string> = {
  missing_code: "GitHub 授权失败，请重试",
  unauthorized: "此账号无管理权限",
};

export function LoginPage({ error }: Props) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          Skills <span>Manager</span>
        </div>
        <p className="login-desc">使用 GitHub 账号登录以管理 Skills 仓库</p>
        {error && (
          <div className="login-error">
            {errorMessages[error] ?? `登录失败: ${error}`}
          </div>
        )}
        <a href="/auth/github" className="btn-github">
          <Icon icon="mdi:github" width="18" height="18" />
          Login with GitHub
        </a>
      </div>
    </div>
  );
}
