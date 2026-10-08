import React, { useState } from "react";
import type { SafeMessage } from "../types/chat.types.ts";
import {
  Download,
  FileText,
  FileCode,
  Printer,
  Copy,
  Check,
  Share2,
  X,
} from "lucide-react";

interface ChatExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  messages: SafeMessage[];
}

export const ChatExportModal: React.FC<ChatExportModalProps> = ({
  isOpen,
  onClose,
  title,
  messages,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# ${title || "Chat Export"}\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((msg) => {
      const roleName = msg.role === "user" ? "User" : "Assistant";
      md += `### ${roleName}\n\n${msg.content || ""}\n\n`;
      if (msg.attachment?.url) {
        md += `![Attachment](${msg.attachment.url})\n\n`;
      }
      md += `---\n\n`;
    });

    return md;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${(title || "chat").toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const data = {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachment: m.attachment?.url,
        createdAt: m.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${(title || "chat").toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    try {
      const text = generateMarkdown();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyShareLink = async () => {
    try {
      // Share current URL
      await navigator.clipboard.writeText(window.location.href);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#383838] p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2d2d2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-[#282828] text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-[#383838]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#ececec]">
                Export & Share Conversation
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#b4b4b4] line-clamp-1">
                {title || "Current Conversation"} ({messages.length} messages)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Link Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#282828] border border-slate-200/80 dark:border-[#383838] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#ececec] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Shareable Conversation Link
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#737373]">Direct workspace link</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-[#ececec] font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
            >
              {shareLinkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:border-indigo-400 dark:hover:border-[#555555] hover:bg-indigo-50/50 dark:hover:bg-[#282828] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-[#ececec] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-[#ececec]">
                Markdown (.md)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4]">
                Full text with formatting
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:border-indigo-400 dark:hover:border-[#555555] hover:bg-indigo-50/50 dark:hover:bg-[#282828] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-[#ececec] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-[#ececec]">
                Structured JSON (.json)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4]">
                Machine-readable format
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:border-indigo-400 dark:hover:border-[#555555] hover:bg-indigo-50/50 dark:hover:bg-[#282828] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-[#ececec] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-[#ececec]">
                Print / Save as PDF
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4]">
                Clean browser print dialog
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:border-indigo-400 dark:hover:border-[#555555] hover:bg-indigo-50/50 dark:hover:bg-[#282828] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-[#ececec] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-[#ececec]">
                {copied ? "Copied to Clipboard!" : "Copy Raw Transcript"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4]">
                Paste anywhere directly
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
