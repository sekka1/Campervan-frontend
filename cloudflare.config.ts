import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "campervan-chat-ui",
    main: "./src/server/index.ts",
    compatibilityDate: "2026-10-01",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      directory: "./dist/client",
      binding: "ASSETS",
      not_found_handling: "single-page-application"
    }
  }
});
