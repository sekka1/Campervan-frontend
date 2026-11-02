import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Cpu, Copy, Check } from "lucide-react";
import ToolCallBadge from "./ToolCallBadge";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolName?: string;
  timestamp?: number;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid={`chat-message-${message.role}`}
      className={`w-full py-4 px-4 sm:px-6 transition-colors ${
        isUser ? "bg-slate-900/40" : "bg-slate-800/40 border-y border-slate-800/60"
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm ${
            isUser
              ? "bg-sky-600 text-white"
              : "bg-slate-800 border border-slate-700 text-amber-400"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">
              {isUser ? "You" : "Campervan Copilot"}
            </span>
            {!isUser && message.content && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50 flex items-center gap-1 text-[11px]"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>

          {/* Tool Badge */}
          {!isUser && message.toolName && (
            <ToolCallBadge toolName={message.toolName} />
          )}

          {/* Message Body */}
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200 break-words leading-relaxed">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-3 border border-slate-700 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-700 text-left text-xs sm:text-sm" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-slate-800/90 text-slate-200 font-semibold uppercase tracking-wider" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-3 py-2 sm:px-4 sm:py-2.5 font-semibold text-slate-200 border-b border-slate-700" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-slate-300 border-b border-slate-800/80 font-mono text-xs sm:text-sm" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-amber-500 bg-amber-500/10 px-4 py-2 my-3 rounded-r-lg text-amber-200 text-sm not-italic"
                      {...props}
                    />
                  ),
                  code: ({ node, className, children, ...props }: any) => {
                    const isInline = !className && typeof children === "string" && !children.includes("\n");
                    if (isInline) {
                      return (
                        <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono font-normal border border-slate-700/60" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800 my-2" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Streaming indicator */}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-sky-400 ml-1 animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
