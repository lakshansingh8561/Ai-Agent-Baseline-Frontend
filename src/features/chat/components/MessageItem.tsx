import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { SafeMessage } from "../types/chat.types.ts";
import { highlightCode } from "../utils/syntax.utils.ts";
import { formatMathMarkdown } from "../utils/math.utils.ts";
import {
  BrainCircuit,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Edit2,
  Send,
  Sparkles,
  ExternalLink,
  Code2,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api.ts";

interface MessageItemProps {
  message: SafeMessage;
  onRetry?: () => void;
  onEditPrompt?: (newContent: string) => void;
  onRegenerate?: () => void;
}

/**
 * ChatGPT-styled CodeBlock component with Prism.js syntax highlighting and dark background.
 */
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = code.trim();
  const highlightedHtml = useMemo(
    () => highlightCode(cleanCode, language),
    [cleanCode, language]
  );

  const lineCount = cleanCode.split("\n").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-4 rounded-2xl bg-[#f6f8fa] dark:bg-[#171717] border border-slate-200 dark:border-[#2d2d2d] overflow-hidden shadow-xs select-text text-left">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#212121] border-b border-slate-200 dark:border-[#2d2d2d] text-xs text-slate-600 dark:text-[#b4b4b4]">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-mono uppercase font-bold text-slate-700 dark:text-[#ececec] tracking-wider text-[11px]">
            {language || "code"}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-[#737373] font-mono">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#282828] hover:bg-slate-200 dark:hover:bg-[#333333] text-slate-600 dark:text-[#ececec] border border-slate-200 dark:border-[#383838] transition-colors cursor-pointer text-[11px] font-medium"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-slate-900 dark:text-[#ececec] custom-scrollbar">
        <pre className="!bg-transparent !p-0 !m-0">
          <code
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className={`language-${language || "plain"}`}
          />
        </pre>
      </div>
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRetry,
  onEditPrompt,
  onRegenerate,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsEditing(false);
    if (onEditPrompt) {
      onEditPrompt(editContent.trim());
    }
  };

  // Pre-process LaTeX equations from LLMs so remark-math and KaTeX never break or output red error blocks
  const formattedContent = useMemo(
    () => formatMathMarkdown(message.content || ""),
    [message.content]
  );

  const hasAttachment = Boolean(message.attachment?.url);
  const attachmentUrl = message.attachment?.url
    ? message.attachment.url.startsWith("http")
      ? message.attachment.url
      : `${API_BASE_URL.replace("/api", "")}${message.attachment.url}`
    : "";

  // USER MESSAGE VIEW: Right-aligned pill bubble like ChatGPT
  if (isUser) {
    return (
      <div className="group relative w-full py-2.5 px-3 sm:px-6">
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex justify-end">
          <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%]">
            {/* Attachment Preview if user uploaded an image */}
            {hasAttachment && (
              <div className="mb-2">
                <div className="relative group/img rounded-2xl overflow-hidden border border-slate-200 dark:border-[#383838] bg-slate-100 dark:bg-[#282828] shadow-xs max-w-xs">
                  <img
                    src={attachmentUrl}
                    alt={message.attachment?.name || "Uploaded attachment"}
                    className="max-h-60 w-auto object-cover rounded-2xl"
                    loading="lazy"
                  />
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Image</span>
                  </a>
                </div>
              </div>
            )}

            {/* User Edit Mode */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="w-full space-y-2 mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#2f2f2f] border border-indigo-500 text-sm text-slate-900 dark:text-[#ececec] focus:outline-none ring-2 ring-indigo-500/20 custom-scrollbar resize-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-[#b4b4b4] hover:bg-slate-100 dark:hover:bg-[#282828] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Re-send</span>
                  </button>
                </div>
              </form>
            ) : (
              /* User Bubble */
              <div className="relative group/bubble flex items-center gap-2">
                {/* Action buttons on hover */}
                <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 text-slate-400 dark:text-[#737373]">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#282828] hover:text-slate-700 dark:hover:text-[#ececec] cursor-pointer transition-colors"
                    title="Copy prompt"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {onEditPrompt && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#282828] hover:text-slate-700 dark:hover:text-[#ececec] cursor-pointer transition-colors"
                      title="Edit prompt"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] px-4 py-2.5 text-sm sm:text-base text-slate-900 dark:text-[#ececec] leading-relaxed whitespace-pre-wrap break-words shadow-2xs">
                  {message.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ASSISTANT MESSAGE VIEW: Seamlessly sits on main canvas (transparent background, crystal clear text)
  return (
    <div className="group relative w-full py-4 px-3 sm:px-6 bg-transparent">
      <div className="max-w-3xl lg:max-w-4xl mx-auto flex gap-3.5 sm:gap-4.5 items-start">
        {/* Assistant Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs border border-transparent dark:border-[#383838]">
            <BrainCircuit className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-[#ffffff]">
                Lumina Agent
              </span>
              <span className="text-[10px] text-slate-400 dark:text-[#737373]">
                {message.createdAt
                  ? new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>

            {/* Hover Actions Toolbar */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md text-slate-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-1 rounded-md text-slate-400 dark:text-[#737373] hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Assistant Rendered Markdown */}
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[
                [
                  rehypeKatex,
                  {
                    strict: false,
                    trust: true,
                    throwOnError: false,
                    errorColor: "inherit",
                  },
                ],
              ]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const rawString = String(children).replace(/\n$/, "");
                  const isMultiLine = rawString.includes("\n");

                  if (match || isMultiLine) {
                    return (
                      <CodeBlock
                        language={match ? match[1] : "text"}
                        code={rawString}
                      />
                    );
                  }

                  return (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-[#383838]">
                      <table className="w-full text-left text-xs sm:text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </div>

          {/* Thinking / Generating Indicator */}
          {(message.status === "generating" || message.status === "pending") && (
            <div className="mt-3 flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-xs font-medium animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Thinking & synthesizing response...</span>
            </div>
          )}

          {/* Failure Alert with Retry */}
          {message.status === "failed" && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>
                  {message.errorMessage ||
                    "Generation was interrupted. Please retry or verify token balance."}
                </span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
