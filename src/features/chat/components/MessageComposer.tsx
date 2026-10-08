import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2, Paperclip, X, AlertCircle, Sparkles } from "lucide-react";
import { useModel } from "../context/ModelContext.tsx";

interface MessageComposerProps {
  onSendMessage: (content: string, file: File | null, onSuccess: () => void) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

const MAX_CHAR_COUNT = 10000;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  placeholder = "Message Lumina AI or upload an image...",
  initialValue = "",
}) => {
  const [content, setContent] = useState(initialValue);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { selectedModel } = useModel();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialValue when edit is triggered
  useEffect(() => {
    if (initialValue) {
      setContent(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [content]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError("Please upload a JPG, PNG, WEBP, or GIF image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError(`Image must be smaller than ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    const hasImage = Boolean(selectedFile);

    if ((!trimmed && !hasImage) || isLoading || disabled || trimmed.length > MAX_CHAR_COUNT) {
      return;
    }

    const messageToSend = trimmed;
    const fileToSend = selectedFile;

    handleRemoveFile();
    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.focus();
    }

    onSendMessage(messageToSend, fileToSend, () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const preference = localStorage.getItem("lumina_send_shortcut") || "enter";

    if (preference === "ctrl_enter") {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const trimmedLength = content.trim().length;
  const isTooLong = content.length > MAX_CHAR_COUNT;
  const canSubmit =
    (Boolean(trimmedLength) || Boolean(selectedFile)) &&
    !isLoading &&
    !disabled &&
    !isTooLong;

  return (
    <div className="w-full bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0d0d0d] dark:via-[#0d0d0d]/95 dark:to-transparent pt-2 pb-3 px-3 sm:px-6">
      <div className="max-w-3xl lg:max-w-4xl mx-auto">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={disabled || isLoading}
        />

        {/* Validation error */}
        {fileError && (
          <div className="mb-2 p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Preview */}
        {previewUrl && (
          <div className="mb-2 flex items-center">
            <div className="relative inline-flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#28282c] rounded-2xl shadow-xs group">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#28282c]"
              />
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-[#ececec] truncate max-w-[140px] sm:max-w-[220px]">
                  {selectedFile?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-[#737373]">
                  {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input box: ChatGPT Pill style */}
        <div className="relative flex items-end gap-1.5 bg-[#f4f4f4] dark:bg-[#18181b] border border-slate-200/80 dark:border-[#28282c] rounded-[26px] p-2 sm:p-2.5 focus-within:border-slate-400 dark:focus-within:border-[#404048] transition-all shadow-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-slate-500 hover:text-slate-800 dark:text-[#ececec] hover:bg-slate-200 dark:hover:bg-[#242428] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
            title="Attach image"
            aria-label="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              selectedFile
                ? "Ask a question about this image..."
                : placeholder
            }
            rows={1}
            maxLength={MAX_CHAR_COUNT + 100}
            className="flex-1 max-h-44 min-h-[40px] bg-transparent border-none text-sm text-slate-900 dark:text-[#ececec] placeholder-slate-400 dark:placeholder-[#8e8e8e] px-2 py-2 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
            {content.length > 0 && (
              <span
                className={`text-[10px] tabular-nums transition-colors hidden sm:inline mr-1 ${
                  isTooLong
                    ? "text-rose-500 font-bold"
                    : content.length > MAX_CHAR_COUNT * 0.8
                    ? "text-amber-500"
                    : "text-slate-400 dark:text-[#737373]"
                }`}
              >
                {content.length}/{MAX_CHAR_COUNT}
              </span>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                canSubmit
                  ? "bg-black text-white hover:opacity-85 dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer active:scale-95 shadow-xs"
                  : "bg-slate-200 dark:bg-[#383838] text-slate-400 dark:text-[#666666] cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-2 mt-2 text-[11px] text-slate-400 dark:text-[#737373]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span className="font-medium text-slate-600 dark:text-[#b4b4b4]">
                {selectedModel.name}
              </span>
            </span>
            <span>•</span>
            <span className="hidden sm:inline">
              Lumina can make mistakes. Verify important info.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] text-[10px] font-mono text-slate-500 dark:text-[#b4b4b4]">
                Ctrl+K
              </kbd>{" "}
              Commands
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
