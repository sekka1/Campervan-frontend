/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      {
        name: "api-server-dev",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith("/api/")) {
              try {
                const { default: app } = await server.ssrLoadModule("/src/server/index.ts");
                
                let body: any = null;
                if (req.method !== "GET" && req.method !== "HEAD") {
                  const chunks: Buffer[] = [];
                  for await (const chunk of req) {
                    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
                  }
                  body = Buffer.concat(chunks);
                }

                const origin = `http://${req.headers.host || "localhost:3000"}`;
                const webReq = new Request(new URL(req.url, origin), {
                  method: req.method,
                  headers: req.headers as HeadersInit,
                  body: body && body.length > 0 ? body : undefined,
                });

                const webRes: Response = await app.fetch(webReq, {
                  DEEPINFRA_TOKEN: process.env.DEEPINFRA_TOKEN || "",
                  ASSETS: {
                    fetch: async () => new Response("Not found", { status: 404 })
                  }
                });

                res.statusCode = webRes.status;
                webRes.headers.forEach((val, key) => {
                  res.setHeader(key, val);
                });

                if (webRes.body) {
                  const reader = webRes.body.getReader();
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                  res.end();
                } else {
                  const text = await webRes.text();
                  res.end(text);
                }
              } catch (err: any) {
                console.error("Dev API error:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname || process.cwd(), "./src"),
      },
    },
    build: {
      outDir: "dist/client",
      emptyOutDir: true
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: [],
    }
  };
});
