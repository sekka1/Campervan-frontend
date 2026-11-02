# AGENTS.md

Welcome to the **Campervan Frontend** codebase. This guide is written for AI agents and automated assistants contributing to this repository. Read this document to understand the system architecture, component layers, configuration patterns, and our mandatory development workflow.

---

## 1. System Overview

**Campervan Copilot** is an authoritative engineering chat application for campervan builders. It provides automated, standard-compliant electrical sizing (ABYC E-11 DC wire gauge and overcurrent protection) and OEM body equipment mounting manual (BEMM) lookups (Ford Transit, Mercedes Sprinter, Ram ProMaster).

### Key Technologies
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`, `@tailwindcss/typography`), `lucide-react`.
* **Edge Backend**: Hono router running on Cloudflare Workers and Vite local development middleware.
* **Inference Engine**: DeepSeek via DeepInfra OpenAI-compatible API (`deepseek-ai/DeepSeek-V4.1-Flash-1017`).
* **Tool Grounding**: Live MCP Server (`https://campervan-mcp-server.garlandk.workers.dev`).
* **Testing**: Vitest + React Testing Library + JSDOM.

---

## 2. Architecture & Component Layers

```text
campervan-frontend/
├── src/
│   ├── client/                      # React SPA Layer
│   │   ├── components/
│   │   │   ├── ChatContainer.tsx    # Header, live MCP status pill, modal, feed, and input
│   │   │   ├── ChatInput.tsx        # Auto-expanding textarea (Enter/Shift+Enter)
│   │   │   ├── ChatMessage.tsx      # Markdown, GFM tables, copy buttons, ABYC callouts
│   │   │   ├── StarterChips.tsx     # Pre-engineered scenario prompt chips
│   │   │   └── ToolCallBadge.tsx    # Verified MCP execution badges
│   │   ├── hooks/
│   │   │   └── useChatStream.ts     # SSE stream reader, tool header attribution, error parsing
│   │   ├── App.tsx                  # Client root component
│   │   ├── index.css                # Tailwind v4 import & typography plugin
│   │   └── main.tsx                 # Client entry point
│   │
│   └── server/                      # Edge / API Layer
│       ├── config.ts                # Centralized model, API, and MCP URLs
│       ├── index.ts                 # Hono routes (/api/health, /api/chat), 2-turn MCP agent loop
│       └── mcpClient.ts             # JSON-RPC MCP client (tools/list, tools/call, health probes)
│
├── tests/                           # Vitest Test Suite
│   ├── ChatMessage.test.tsx         # Message rendering, tables, and badge tests
│   ├── config.test.ts               # Model configuration and env override tests
│   └── mcpClient.test.ts            # MCP RPC discovery, execution, isError, and health tests
│
├── cloudflare.config.ts             # Cloudflare CLI deployment config
├── wrangler.json                    # Wrangler worker deployment & static asset binding config
├── .github/workflows/deploy.yml     # Automated CI/CD workflow (pnpm, test, build, deploy)
└── .env.example                     # Environment variable reference
```

### The 2-Turn MCP Agent Loop (`src/server/index.ts`)
1. **Turn 1 (Tool Discovery & Planning)**:
   * Backend fetches available tool schemas from the MCP server.
   * Sends user conversation history + tool definitions to DeepInfra with `parallel_tool_calls: false`.
2. **Turn 2 (Tool Execution & Grounded Synthesis)**:
   * If the model requests tool calls, backend invokes them against the live MCP server (`executeMcpTool`).
   * Validates `result.isError` to prevent treating errors as successful results.
   * Feeds tool execution results back to DeepInfra to synthesize a grounded, streaming answer.
   * Transmits `X-Executed-Tool` HTTP header so the UI displays the tool attribution badge.

---

## 3. Model Configuration & Switching

The inference model is completely decoupled from routing logic and can be updated easily:

1. **Production (Cloudflare Dashboard - Zero-Deploy)**:
   * Set `DEEPSEEK_MODEL` in Cloudflare Worker **Settings → Variables and Secrets → Runtime Variables**.
2. **Production / Staging (`wrangler.json`)**:
   ```json
   "vars": {
     "DEEPSEEK_MODEL": "deepseek-ai/DeepSeek-V4.1-Flash-1017"
   }
   ```
3. **Local Development (`.env`)**:
   ```env
   DEEPSEEK_MODEL="deepseek-ai/DeepSeek-V4.1-Flash-1017"
   ```
4. **Code Baseline (`src/server/config.ts`)**:
   ```typescript
   export const DEFAULT_DEEPSEEK_MODEL = "deepseek-ai/DeepSeek-V4.1-Flash-1017";
   ```

---

## 4. Mandatory Coding Standard for Agents

All AI agents and contributors must strictly adhere to this 8-step workflow:

1. **Write code locally**: Make changes directly within the workspace files.
2. **Run the tests**: Execute the full test suite locally before touching git:
   ```bash
   pnpm test # or npx vitest run
   ```
3. **Open a new branch**: Always branch off the latest `origin/main`:
   ```bash
   git checkout -b <type>/<description> origin/main
   ```
4. **Push to the branch**: Commit with clear conventional messages and push:
   ```bash
   git push -u origin <type>/<description>
   ```
5. **Open a Pull Request**: Create a PR against `main` using the GitHub API or CLI.
6. **Wait for CI / PR checks**: Verify that GitHub Actions passes all unit tests, builds, and dry-run checks.
7. **Report back to the human**: Provide the PR URL, summary of changes, and verification status.
8. **Automated recovery on failure**: If any CI step or test fails, diagnose the root cause, fix it, rerun tests locally, push the fix to the branch, and verify CI succeeds.
