import React, { useState, useEffect, useRef } from "react";
import { Zap, RefreshCw, Info, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import StarterChips from "./StarterChips";
import useChatStream from "../hooks/useChatStream";

interface McpHealthInfo {
  status: "connected" | "degraded" | "disconnected" | "checking";
  toolCount?: number;
  message?: string;
  deepinfraConfigured?: boolean;
}

export const ChatContainer: React.FC = () => {
  const { messages, isLoading, sendMessage, resetChat } = useChatStream();
  const [input, setInput] = useState("");
  const [mcpHealth, setMcpHealth] = useState<McpHealthInfo>({ status: "checking" });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check MCP Server connectivity
  const checkHealth = async () => {
    try {
      setMcpHealth((prev) => ({ ...prev, status: "checking" }));
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setMcpHealth({
          status: data.mcp?.status || "connected",
          toolCount: data.mcp?.toolCount || 3,
          message: data.mcp?.message || "Connected to Cloudflare Worker",
          deepinfraConfigured: data.deepinfraConfigured,
        });
      } else {
        setMcpHealth({
          status: "degraded",
          toolCount: 0,
          message: "Health check returned non-200",
        });
      }
    } catch {
      setMcpHealth({
        status: "disconnected",
        toolCount: 0,
        message: "Unable to reach edge server",
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 shrink-0 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-none flex items-center gap-2">
              Campervan Engineering Copilot
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                v0.1
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none mt-1">
              ABYC E-11 Wire Sizing & Chassis BEMM Authority
            </p>
          </div>
        </div>

        {/* Right Header: Status Pill & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Pill */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono transition-colors cursor-pointer"
            title="Click to view MCP server details"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mcpHealth.status === "connected"
                  ? "bg-emerald-400 animate-pulse"
                  : mcpHealth.status === "checking"
                  ? "bg-amber-400 animate-spin"
                  : "bg-rose-500"
              }`}
            />
            <span className="hidden sm:inline text-slate-300">
              {mcpHealth.status === "connected"
                ? `campervan-mcp-server (${mcpHealth.toolCount || 3} tools)`
                : mcpHealth.status === "checking"
                ? "Checking MCP..."
                : "MCP Degraded"}
            </span>
            <span className="sm:hidden text-slate-300">
              {mcpHealth.status === "connected" ? "MCP Live" : "MCP"}
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Reset Chat button */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={resetChat}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Scroll Area */}
      <main className="flex-1 overflow-y-auto flex flex-col justify-between">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <StarterChips onSelectPrompt={handleSelectPrompt} disabled={isLoading} />
          </div>
        ) : (
          <div className="w-full flex-1 divide-y divide-slate-800/40">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      {/* Bottom Sticky Input Bar */}
      <footer className="shrink-0 bg-slate-950/90 backdrop-blur border-t border-slate-800/80">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
        />
      </footer>

      {/* Info / Architecture Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  System Architecture & MCP Server
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Campervan MCP Server:</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live & Connected
                  </span>
                </div>
                <div className="font-mono text-xs text-sky-400 break-all flex items-center gap-1">
                  https://campervan-mcp-server.garlandk.workers.dev
                  <a
                    href="https://campervan-mcp-server.garlandk.workers.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Active MCP Tools:</span>
                <ul className="space-y-1.5 pl-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <code className="text-amber-300">calculate_dc_wire_and_fuse</code>
                    <span className="text-slate-400 text-xs">— ABYC E-11 voltage drop & MRBF/Class T fusing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <code className="text-blue-300">search_van_manuals</code>
                    <span className="text-slate-400 text-xs">— Vectorize + D1 OEM BEMM manual search</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <code className="text-emerald-300">inspect_manual_chunks</code>
                    <span className="text-slate-400 text-xs">— D1 database text inspection</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1">
                <div className="font-semibold text-slate-200">Inference Engine:</div>
                <div className="text-slate-400 text-xs">
                  Model: <code className="text-sky-300">deepseek-ai/DeepSeek-V4-Flash-0731</code> via DeepInfra OpenAI-compatible API.
                </div>
              </div>

              {!mcpHealth.deepinfraConfigured && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Note on DeepInfra Token:</span> Add{" "}
                    <code className="font-mono bg-amber-500/20 px-1 rounded">DEEPINFRA_TOKEN</code> to AI Studio Secrets or via{" "}
                    <code className="font-mono bg-amber-500/20 px-1 rounded">cf secret put DEEPINFRA_TOKEN</code> for custom free-form reasoning.
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
