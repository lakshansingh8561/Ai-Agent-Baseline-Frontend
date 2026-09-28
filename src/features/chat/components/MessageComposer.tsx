import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2, Paperclip, X, AlertCircle } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (content: string, file: File | null, onSuccess: () => void) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
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
  placeholder = "Message Lumina AI or ask about an image... (Shift+Enter for newline)",
}) => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Cleanup object URL when component unmounts
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

    // Reset previous error
    setFileError(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError("Please upload a JPG, PNG, WEBP, or GIF image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError(`Image must be smaller than ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Revoke old preview if present
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Reset input value so re-selecting same file triggers change
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

    // Must have either text or image, and not be loading/disabled/exceeding character count
    if ((!trimmed && !hasImage) || isLoading || disabled || trimmed.length > MAX_CHAR_COUNT) {
      return;
    }

    const messageToSend = trimmed;
    const fileToSend = selectedFile;

    // Clear local state
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    <div className="w-full bg-white/90 backdrop-blur-md border-t border-slate-200/90 p-2.5 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          disabled={disabled || isLoading}
        />

        {/* Client-side validation alert */}
        {fileError && (
          <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="p-0.5 hover:bg-rose-100 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Image Preview Area */}
        {previewUrl && (
          <div className="mb-2 flex items-center">
            <div className="relative inline-flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs group">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[220px]">
                  {selectedFile?.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Image ready
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Remove image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="relative flex items-end gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
            title="Attach image (JPG, PNG, WEBP, GIF)"
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
                ? "Ask a question about this image... (or press send to describe)"
                : placeholder
            }
            rows={1}
            maxLength={MAX_CHAR_COUNT + 100}
            className="flex-1 max-h-44 min-h-[44px] bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 px-2 py-2.5 focus:outline-none resize-none leading-relaxed disabled:opacity-50 selection:bg-indigo-600"
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
            Lumina AI Engine • Attach image or press Enter to send, Shift+Enter for new line
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
