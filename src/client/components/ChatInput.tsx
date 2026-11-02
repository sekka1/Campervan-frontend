import React, { useRef, useEffect } from "react";
import { Send, CornerDownLeft, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  placeholder = "Ask about DC wire sizing, fuse ratings, Ford/Sprinter BEMM limits...",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLoading && input.trim()) onSubmit();
        }}
        className="relative flex items-end gap-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl focus-within:border-sky-500/70 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 max-h-[180px] bg-transparent text-slate-100 placeholder-slate-400 text-sm sm:text-base resize-none focus:outline-none px-3 py-2 leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1.5 shrink-0 pr-1 pb-1">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            title="Send prompt (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-3 pt-2">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">Shift + Enter</kbd> for new line
        </span>
        <span className="hidden sm:inline text-slate-400">
          Powered by DeepSeek & Campervan MCP
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
