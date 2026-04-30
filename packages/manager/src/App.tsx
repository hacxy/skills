import { useEffect, useState } from "react";
import { getMe, type User } from "./api";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";

export function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null));
  }, []);

  const params = new URLSearchParams(window.location.search);
  const authError = params.get("error");

  if (user === undefined) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (!user) {
    return <LoginPage error={authError} />;
  }

  return <AdminPage user={user} onLogout={() => setUser(null)} />;
}
