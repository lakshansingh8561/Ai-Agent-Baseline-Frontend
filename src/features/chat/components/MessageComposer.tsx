import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (content: string, onSuccess: () => void) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHAR_COUNT = 10000;

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  placeholder = "Message Lumina AI... (Shift+Enter for newline)",
}) => {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [content]);

  // Focus textarea on mount or reset
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading || disabled || trimmed.length > MAX_CHAR_COUNT) return;

    onSendMessage(trimmed, () => {
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
        textareaRef.current.focus();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const trimmedLength = content.trim().length;
  const isTooLong = content.length > MAX_CHAR_COUNT;
  const canSubmit = Boolean(trimmedLength) && !isLoading && !disabled && !isTooLong;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-t border-slate-200/90 p-2.5 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={placeholder}
            rows={1}
            maxLength={MAX_CHAR_COUNT + 100}
            className="flex-1 max-h-44 min-h-[44px] bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 px-3 py-2.5 focus:outline-none resize-none leading-relaxed disabled:opacity-50 selection:bg-indigo-600"
          />

          <div className="flex items-center gap-2 flex-shrink-0 mb-0.5">
            {content.length > 0 && (
              <span
                className={`text-[10px] tabular-nums transition-colors hidden sm:inline ${
                  isTooLong
                    ? "text-rose-500 font-bold"
                    : content.length > MAX_CHAR_COUNT * 0.8
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                {content.length}/{MAX_CHAR_COUNT}
              </span>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 cursor-pointer active:scale-95"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              aria-label="Send message"
              title={
                isLoading
                  ? "Generating response..."
                  : isTooLong
                  ? "Message is too long"
                  : "Send message (Enter)"
              }
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 mt-1.5">
          <p className="text-[11px] text-slate-400 truncate">
            Lumina AI Engine • Press Enter to send, Shift+Enter for new line
          </p>
          {content.length > 0 && (
            <span
              className={`text-[10px] tabular-nums sm:hidden ${
                isTooLong ? "text-rose-500 font-bold" : "text-slate-400"
              }`}
            >
              {content.length}/{MAX_CHAR_COUNT}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
