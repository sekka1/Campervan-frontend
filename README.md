# Campervan Engineering Copilot (Frontend)

An authoritative, mobile-responsive engineering chat application for campervan builders. Connects to the live Campervan Model Context Protocol (MCP) server on Cloudflare Workers to provide compliant ABYC E-11 DC electrical calculations and chassis-specific OEM Body and Equipment Mounting Manual (BEMM) lookups.

---

## Architecture Overview

```text
[ React 19 Client (Vite + Tailwind v4) ]
                   │
                   ▼  HTTP / SSE
   [ Hono Edge API (Cloudflare Worker) ]
        │                           │
        ▼ Tool Definitions          ▼ Tool Calls (JSON-RPC)
[ DeepInfra / DeepSeek ]    [ Campervan MCP Server ]
(DeepSeek-V4.1-Flash-1017)   (Vectorize + D1 + ABYC Engine)
```

### Component Layers

1. **Frontend (`src/client/`)**:
   * **Chat Feed (`ChatMessage.tsx`)**: Markdown rendering with `remark-gfm` tables, syntax blocks, copy buttons, and ABYC safety invariant highlights.
   * **Starter Chips (`StarterChips.tsx`)**: Quick-launch engineering scenarios (12V inverter wire & fuse sizing, Transit CCP1/CCP2, Sprinter 907 roof cutouts, aux grounding).
   * **Header & Status (`ChatContainer.tsx`)**: Displays live connection status and tool discovery from the edge MCP server with an accessible architecture dialog.
   * **Tool Execution Badges (`ToolCallBadge.tsx`)**: Visual verification badges above answers (`calculate_dc_wire_and_fuse`, `search_van_manuals`).
   * **Auto-Expanding Input (`ChatInput.tsx`)**: Resizing input with Enter to send and Shift+Enter for multiline inputs.
   * **Streaming Hook (`useChatStream.ts`)**: Server-Sent Events (SSE) streaming consumer with tool badge extraction and cloned response error handling.

2. **Edge API (`src/server/`)**:
   * **Hono Router (`index.ts`)**: Runs on Cloudflare Workers and Vite local development server. Serves `/api/health`, `/api/chat`, and static SPA assets via Cloudflare's `ASSETS` binding.
   * **MCP Client (`mcpClient.ts`)**: Direct JSON-RPC connection to `https://campervan-mcp-server.garlandk.workers.dev` for tool listing, execution, and health checks.
   * **Two-Turn Agent Loop**:
     * **Turn 1**: Queries DeepInfra with MCP tool schemas and prompt history.
     * **Turn 2**: Invokes MCP tools on the live server, validates results against `result.isError`, and synthesizes a grounded answer.

---

## Live MCP Tools

| Tool | Purpose | Source Standard / Data |
| :--- | :--- | :--- |
| `calculate_dc_wire_and_fuse` | Calculates AWG wire gauge, fuse size (MRBF/MEGA), voltage drop %, and ampacity. | ABYC E-11 Standard |
| `search_van_manuals` | Queries OEM chassis guidelines, grounding locations, and CCP specs. | Cloudflare Vectorize + D1 (Transit, Sprinter, ProMaster BEMM) |
| `inspect_manual_chunks` | Inspects full text chunks from manual database. | Cloudflare D1 Database |

---

## Model Configuration

The inference model is completely configurable:

* **Default Model**: `deepseek-ai/DeepSeek-V4.1-Flash-1017` (defined in `src/server/config.ts`).
* **Production**: Set `DEEPSEEK_MODEL` in the Cloudflare Dashboard under **Settings → Variables and Secrets → Runtime Variables**.
* **Local Development**: Set `DEEPSEEK_MODEL` in your local `.env` file.
* **Wrangler Config**: Declared in `wrangler.json` under `"vars"`.

---

## Getting Started

### Prerequisites
* Node.js 22+
* pnpm v9+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/sekka1/Campervan-frontend.git
cd Campervan-frontend

# Install dependencies
pnpm install

# Start local dev server (port 3000)
pnpm dev
```

### Running Tests
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Building for Production
```bash
# Build static assets to dist/client
pnpm run build

# Validate Cloudflare deployment dry run
pnpm exec wrangler deploy --dry-run
```

---

## Development & Contribution Standard

All automated agents and human contributors follow this workflow:

1. Write code locally.
2. Run the unit tests (`pnpm test`).
3. Open a new branch off latest `origin/main`.
4. Commit and push to the branch.
5. Open a Pull Request.
6. Wait for GitHub Actions to complete CI tests.
7. Report back with the PR details and verification status.
8. If any test fails, fix it, rerun all tests, and push the update.

For detailed guidelines, see [AGENTS.md](./AGENTS.md).