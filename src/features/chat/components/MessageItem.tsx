import React, { useState } from "react";
import type { SafeMessage } from "../types/chat.types.ts";
import { BrainCircuit, Copy, Check } from "lucide-react";

interface MessageItemProps {
  message: SafeMessage;
}

/**
 * Renders inline text with support for inline code `code` and bold **text**.
 */
const renderInlineText = (text: string): React.ReactNode => {
  // Regex to split by inline code `...` and bold **...**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-300/80 font-mono text-xs text-indigo-700 break-all"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

/**
 * Formatted code block with copy button and language badge.
 */
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API unavailable
    }
  };

  return (
    <div className="my-3 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[11px] text-slate-400">
        <span className="font-mono uppercase font-semibold text-slate-300">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * XSS-safe markdown renderer for assistant responses.
 */
const FormattedAssistantMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];

  let currentListItems: React.ReactNode[] = [];
  let isOrderedList = false;

  const flushList = (keyPrefix: string) => {
    if (currentListItems.length > 0) {
      if (isOrderedList) {
        elements.push(
          <ol key={`${keyPrefix}-ol`} className="list-decimal list-outside ml-5 my-2 space-y-1 text-slate-700 text-sm">
            {currentListItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`${keyPrefix}-ul`} className="list-disc list-outside ml-5 my-2 space-y-1 text-slate-700 text-sm">
            {currentListItems}
          </ul>
        );
      }
      currentListItems = [];
    }
  };

  lines.forEach((line, idx) => {
    // Code block delimiters
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        flushList(`flush-precode-${idx}`);
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      } else {
        elements.push(
          <CodeBlock
            key={`code-${idx}`}
            language={codeBlockLang}
            code={codeBlockLines.join("\n")}
          />
        );
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Unordered list items: - or *
    const unorderedMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (isOrderedList) flushList(`flush-ol-${idx}`);
      isOrderedList = false;
      currentListItems.push(
        <li key={`li-${idx}`} className="leading-relaxed pl-1">
          {renderInlineText(unorderedMatch[2])}
        </li>
      );
      return;
    }

    // Ordered list items: 1.
    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!isOrderedList) flushList(`flush-ul-${idx}`);
      isOrderedList = true;
      currentListItems.push(
        <li key={`oli-${idx}`} className="leading-relaxed pl-1">
          {renderInlineText(orderedMatch[2])}
        </li>
      );
      return;
    }

    // Not a list line -> flush any pending list
    flushList(`flush-${idx}`);

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-base font-bold text-slate-900 mt-3 mb-1 tracking-tight">
          {renderInlineText(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${idx}`} className="text-lg font-bold text-slate-900 mt-4 mb-1.5 tracking-tight border-b border-slate-200 pb-1">
          {renderInlineText(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${idx}`} className="text-xl font-extrabold text-slate-900 mt-4 mb-2 tracking-tight">
          {renderInlineText(line.slice(2))}
        </h1>
      );
      return;
    }

    // Empty line / spacer
    if (!line.trim()) {
      elements.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-slate-700 leading-relaxed my-1">
        {renderInlineText(line)}
      </p>
    );
  });

  // Flush remaining list if any
  flushList("final-flush");

  // If still in code block at end of content
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <CodeBlock
        key="code-unclosed"
        language={codeBlockLang}
        code={codeBlockLines.join("\n")}
      />
    );
  }

  return <div className="space-y-1 text-slate-800">{elements}</div>;
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === "user";

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 px-2 sm:px-4">
        <div className="flex flex-col items-end max-w-[90%] sm:max-w-[80%] md:max-w-[70%]">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-600">You</span>
            <span>•</span>
            <span>{formattedTime}</span>
          </div>
          <div className="rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-3 text-sm text-white shadow-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden selection:bg-indigo-800">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 px-2 sm:px-4">
      <div className="flex gap-3 max-w-[98%] sm:max-w-[90%] md:max-w-[85%] w-full">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
          <BrainCircuit className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
            <span className="font-semibold text-indigo-600">Lumina AI</span>
            <span>•</span>
            <span className="text-slate-500">{formattedTime}</span>
          </div>
          <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 px-4 py-3.5 shadow-xs overflow-hidden break-words">
            <FormattedAssistantMessage content={message.content} />
          </div>
        </div>
      </div>
    </div>
  );
};
