import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createManagerMiddleware } from "./server/middleware.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: { port: 5174 },
    plugins: [
      react(),
      {
        name: "skills-manager-api",
        configureServer(server) {
          const middleware = createManagerMiddleware(
            env.GITHUB_CLIENT_ID ?? "",
            env.GITHUB_CLIENT_SECRET ?? "",
          );
          server.middlewares.use((req, res, next) => {
            void middleware(req, res, next);
          });
        },
      },
    ],
  };
});
