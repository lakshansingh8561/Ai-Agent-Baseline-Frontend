import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useCreateConversation,
  useDeleteConversation,
  chatKeys,
} from "../hooks/useChatQueries.ts";
import {
  deriveConversationTitle,
  resolveConversationTitle,
  setStoredDerivedTitle,
  isLegacyTitle,
} from "../utils/title.utils.ts";
import type { SafeConversation, SafeMessage } from "../types/chat.types.ts";
import { MessageItem } from "../components/MessageItem.tsx";
import { MessageComposer } from "../components/MessageComposer.tsx";
import { EmptyChatView } from "../components/EmptyChatView.tsx";
import { ModelSelector } from "../components/ModelSelector.tsx";
import { ChatExportModal } from "../components/ChatExportModal.tsx";
import {
  BrainCircuit,
  Plus,
  Loader2,
  AlertCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Zap,
  Sparkles,
  Share2,
  PanelLeftOpen,
} from "lucide-react";
import { useTokenBalance } from "../../token/hooks/useTokenQueries.ts";

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const requestIdCounter = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);
  const activeConversationIdRef = useRef<string | undefined>(conversationId);
  const isTransitioningFromDraftRef = useRef(false);

  const { data: conversations } = useConversations();
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useMessages(conversationId);

  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage(conversationId);
  const deleteConversationMutation = useDeleteConversation();
  const { data: tokenData } = useTokenBalance();

  const outletContext = useOutletContext<{
    sidebarOpen: boolean;
    toggleSidebar: () => void;
  } | undefined>();
  const sidebarOpen = outletContext?.sidebarOpen ?? true;
  const toggleSidebar = outletContext?.toggleSidebar;

  const [composerKey, setComposerKey] = useState(0);
  const [pendingUserContent, setPendingUserContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTokenLimitError, setIsTokenLimitError] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const isTokenExhausted =
    (tokenData !== undefined && tokenData.balance <= 0) || isTokenLimitError;

  const hasServerGeneratingMessage = (messages ?? []).some(
    (m) =>
      m.role === "assistant" &&
      (m.status === "generating" || m.status === "pending")
  );

  const isGenerating =
    Boolean(pendingUserContent) ||
    (sendMessageMutation.isPending &&
      activeConversationIdRef.current === conversationId) ||
    hasServerGeneratingMessage;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef(conversationId);
  const prevResetDraftRef = useRef(location.state?.resetDraft);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if ((messagesError as any)?.response?.status === 404) {
      navigate("/app", { replace: true });
    }
  }, [messagesError, navigate]);

  useEffect(() => {
    const conversationChanged = prevConversationIdRef.current !== conversationId;
    const resetDraftTriggered =
      location.state?.resetDraft &&
      location.state.resetDraft !== prevResetDraftRef.current;

    prevConversationIdRef.current = conversationId;
    prevResetDraftRef.current = location.state?.resetDraft;

    if (resetDraftTriggered) {
      activeRequestIdRef.current = ++requestIdCounter.current;
      isTransitioningFromDraftRef.current = false;
      activeConversationIdRef.current = undefined;

      setPendingUserContent(null);
      setErrorMessage(null);
      setIsTokenLimitError(false);
      setComposerKey((k) => k + 1);
      return;
    }

    if (conversationChanged) {
      if (isTransitioningFromDraftRef.current) {
        return;
      }
      activeRequestIdRef.current = ++requestIdCounter.current;
      setPendingUserContent(null);
      setErrorMessage(null);
      setIsTokenLimitError(false);
      setComposerKey((k) => k + 1);
    }
  }, [conversationId, location.state]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages?.length, pendingUserContent, isGenerating]);

  useEffect(() => {
    if (!conversationId || !messages || messages.length === 0) return;

    const currentConv = conversations?.find((c) => c.id === conversationId);
    if (!currentConv || isLegacyTitle(currentConv.title)) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        const derived = deriveConversationTitle(firstUserMsg.content);
        setStoredDerivedTitle(conversationId, derived);
        queryClient.setQueryData<SafeConversation[]>(
          chatKeys.conversations(),
          (old = []) =>
            old.map((c) => (c.id === conversationId ? { ...c, title: derived } : c))
        );
      }
    }
  }, [conversationId, messages, conversations, queryClient]);

  const handleSendError = (err: unknown) => {
    setPendingUserContent(null);
    if (err instanceof AxiosError && err.response) {
      if (err.response.status === 402) {
        setIsTokenLimitError(true);
        setErrorMessage(
          "Your token balance is exhausted. Please upgrade your plan when available."
        );
      } else if (err.response.status === 404) {
        setErrorMessage(
          "Conversation not found. Please select or create another chat."
        );
      } else {
        setErrorMessage(
          (err.response.data as { message?: string })?.message ||
            "Failed to generate response. Please try again."
        );
      }
    } else {
      setErrorMessage("Network error: unable to send message to the server.");
    }
  };

  const handleSendMessage = async (
    content: string,
    file?: File | null,
    onSuccessCallback?: () => void
  ) => {
    if (isTokenExhausted) {
      setIsTokenLimitError(true);
      setErrorMessage(
        "Your token balance is exhausted. Please upgrade your plan to continue chatting."
      );
      return;
    }

    if (sendMessageMutation.isPending || createConversationMutation.isPending) {
      return;
    }

    const resolvedContent = content.trim() || (file ? "Describe this image." : "");
    setErrorMessage(null);
    setIsTokenLimitError(false);
    setPendingUserContent(resolvedContent);

    const optimisticAttachment = file
      ? {
          type: "image" as const,
          url: URL.createObjectURL(file),
          mimeType: file.type,
          name: file.name,
          size: file.size,
        }
      : undefined;

    if (!conversationId) {
      const currentRequestId = ++requestIdCounter.current;
      activeRequestIdRef.current = currentRequestId;
      isTransitioningFromDraftRef.current = true;

      try {
        const title = file && !content.trim()
          ? `Image: ${file.name.slice(0, 30)}`
          : deriveConversationTitle(resolvedContent);

        const newConversation = await createConversationMutation.mutateAsync({
          title,
        });

        if (
          activeRequestIdRef.current !== currentRequestId ||
          activeConversationIdRef.current !== undefined
        ) {
          isTransitioningFromDraftRef.current = false;
          return;
        }

        const targetConversationId = newConversation.id;

        const optimisticMsg: SafeMessage = {
          id: `temp_${Date.now()}`,
          conversationId: targetConversationId,
          role: "user",
          content: resolvedContent,
          attachment: optimisticAttachment,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<SafeMessage[]>(
          chatKeys.messages(targetConversationId),
          [optimisticMsg]
        );

        navigate(`/app/${targetConversationId}`, { replace: true });
        activeConversationIdRef.current = targetConversationId;

        sendMessageMutation.mutate(
          { content: resolvedContent, file, targetConversationId },
          {
            onSuccess: () => {
              isTransitioningFromDraftRef.current = false;
              if (
                activeRequestIdRef.current === currentRequestId &&
                activeConversationIdRef.current === targetConversationId
              ) {
                setPendingUserContent(null);
                onSuccessCallback?.();
              }
            },
            onError: (err) => {
              isTransitioningFromDraftRef.current = false;
              queryClient.setQueryData<SafeMessage[]>(
                chatKeys.messages(targetConversationId),
                (old = []) => old.filter((m) => m.id !== optimisticMsg.id)
              );
              if (
                activeRequestIdRef.current === currentRequestId &&
                activeConversationIdRef.current === targetConversationId
              ) {
                handleSendError(err);
              }
            },
          }
        );
      } catch (err) {
        if (activeRequestIdRef.current === currentRequestId) {
          isTransitioningFromDraftRef.current = false;
          setPendingUserContent(null);
          if (err instanceof AxiosError && err.response) {
            setErrorMessage(
              (err.response.data as { message?: string })?.message ||
                "Failed to create conversation. Please try again."
            );
          } else {
            setErrorMessage(
              "Failed to create conversation. Please check your network connection."
            );
          }
        }
      }
      return;
    }

    // Existing conversation flow
    const targetConversationId = conversationId;
    const currentRequestId = ++requestIdCounter.current;
    activeRequestIdRef.current = currentRequestId;

    const optimisticMsg: SafeMessage = {
      id: `temp_${Date.now()}`,
      conversationId: targetConversationId,
      role: "user",
      content: resolvedContent,
      attachment: optimisticAttachment,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<SafeMessage[]>(
      chatKeys.messages(targetConversationId),
      (old = []) => [...old, optimisticMsg]
    );

    sendMessageMutation.mutate(
      { content: resolvedContent, file, targetConversationId },
      {
        onSuccess: () => {
          if (
            activeRequestIdRef.current === currentRequestId &&
            activeConversationIdRef.current === targetConversationId
          ) {
            setPendingUserContent(null);
            onSuccessCallback?.();
          }
        },
        onError: (err) => {
          queryClient.setQueryData<SafeMessage[]>(
            chatKeys.messages(targetConversationId),
            (old = []) => old.filter((m) => m.id !== optimisticMsg.id)
          );
          if (
            activeRequestIdRef.current === currentRequestId &&
            activeConversationIdRef.current === targetConversationId
          ) {
            handleSendError(err);
          }
        },
      }
    );
  };

  const handleStartNewChat = () => {
    activeRequestIdRef.current = ++requestIdCounter.current;
    isTransitioningFromDraftRef.current = false;
    activeConversationIdRef.current = undefined;

    setPendingUserContent(null);
    setErrorMessage(null);
    setIsTokenLimitError(false);
    setComposerKey((k) => k + 1);

    navigate("/app", { state: { resetDraft: Date.now() } });
  };

  const handleDeleteActiveConversation = async () => {
    if (!conversationId) return;
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteConversationMutation.mutateAsync(conversationId);
        navigate("/app", { replace: true });
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    }
  };

  const currentConversation = conversations?.find((c) => c.id === conversationId);

  const isInvalidConversation =
    Boolean(conversationId) &&
    Boolean(messagesError) &&
    messagesError instanceof AxiosError &&
    (messagesError.response?.status === 404 || messagesError.response?.status === 400);

  if (isInvalidConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-primary)]">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
          Conversation Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          The conversation you requested does not exist or the link may be invalid.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>
      </div>
    );
  }

  const messageList: SafeMessage[] = messages ?? [];
  const hasMessages = messageList.length > 0;
  const lastMessage = hasMessages ? messageList[messageList.length - 1] : null;

  const currentTitle = conversationId
    ? resolveConversationTitle(
        conversationId,
        currentConversation?.title,
        messages?.find((m) => m.role === "user")?.content
      )
    : "New Chat";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-primary)] transition-colors">
      {/* Conversation Top Header Bar */}
      <header className="px-4 py-2.5 border-b border-slate-200/90 dark:border-[#222226] bg-white/90 dark:bg-[#0d0d0d]/95 backdrop-blur-md flex items-center justify-between z-10 shadow-xs">
        {/* Model Switcher and Sidebar Reopen on Left */}
        <div className="flex items-center gap-2 min-w-0">
          {!sidebarOpen && toggleSidebar && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1d] border border-slate-200/80 dark:border-[#28282c] transition-colors cursor-pointer"
              title="Open sidebar (Ctrl+B)"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <ModelSelector />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">

          {/* Export & Share Modal Trigger */}
          {conversationId && hasMessages && (
            <button
              id="trigger-chat-export"
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-[#222226] text-slate-700 dark:text-[#ececec] border border-slate-200 dark:border-[#28282c] shadow-xs transition-colors cursor-pointer text-xs font-semibold"
              title="Export & Share Chat"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {conversationId && (
            <button
              type="button"
              onClick={handleDeleteActiveConversation}
              disabled={deleteConversationMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181b] hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-medium text-slate-600 dark:text-[#b4b4b4] hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#28282c] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Delete Chat"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-[#e0e0e0] text-white dark:text-black text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Error Banners */}
      {errorMessage && (
        <div
          className={`mx-4 mt-3 p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 shadow-xs ${
            isTokenLimitError
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsTokenLimitError(false);
            }}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-1 custom-scrollbar">
        {!conversationId && !pendingUserContent ? (
          <EmptyChatView
            onSelectPrompt={(prompt) => {
              if (isTokenExhausted) {
                setIsTokenLimitError(true);
                setErrorMessage(
                  "Your token balance is exhausted. Please upgrade your plan to continue chatting."
                );
                return;
              }
              handleSendMessage(prompt);
            }}
          />
        ) : isLoadingMessages && !hasMessages && !pendingUserContent ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-medium">Loading message history...</p>
          </div>
        ) : (
          <>
            {messageList.map((msg, idx) => {
              let retryHandler: (() => void) | undefined = undefined;
              if (msg.role === "assistant" && msg.status === "failed") {
                const prevUserMsg = messageList
                  .slice(0, idx)
                  .reverse()
                  .find((m) => m.role === "user");
                if (prevUserMsg) {
                  retryHandler = () => handleSendMessage(prevUserMsg.content);
                }
              }

              const handleRegenerate = () => {
                const prevUserMsg = messageList
                  .slice(0, idx)
                  .reverse()
                  .find((m) => m.role === "user");
                if (prevUserMsg) {
                  handleSendMessage(prevUserMsg.content);
                }
              };

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={retryHandler}
                  onEditPrompt={(newPrompt) => {
                    handleSendMessage(newPrompt);
                  }}
                  onRegenerate={handleRegenerate}
                />
              );
            })}

            {/* Pending User Message while response is generating */}
            {pendingUserContent &&
              !messageList.some(
                (m) => m.role === "user" && m.content === pendingUserContent
              ) && (
                <div className="flex justify-end mb-4 px-2 sm:px-6">
                  <div className="flex flex-col items-end max-w-[90%] sm:max-w-[80%] md:max-w-[70%]">
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        You
                      </span>
                      <span>•</span>
                      <span>Sending...</span>
                    </div>
                    <div className="rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-3 text-sm text-white shadow-sm leading-relaxed whitespace-pre-wrap break-words">
                      {pendingUserContent}
                    </div>
                  </div>
                </div>
              )}

            {/* Assistant Generating Indicator */}
            {isGenerating && !hasServerGeneratingMessage && (
              <div className="flex justify-start mb-6 px-2 sm:px-6">
                <div className="flex gap-3.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-sm">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Lumina Agent
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">Synthesizing answer...</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] px-4 py-3 text-sm text-slate-700 dark:text-[#ececec] shadow-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                      <span className="text-xs text-slate-500 dark:text-[#b4b4b4] ml-1">
                        Reasoning...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interrupted Response Notice */}
            {!isGenerating && !hasServerGeneratingMessage && hasMessages && lastMessage?.role === "user" && (
              <div className="flex justify-start mb-6 px-2 sm:px-6">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#737373]">
                      <span className="font-semibold text-slate-700 dark:text-[#ececec]">
                        Lumina Agent
                      </span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Response was interrupted
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-[#282828] border border-slate-200/90 dark:border-[#383838] px-4 py-3 shadow-xs flex flex-col gap-2.5">
                      <p className="text-xs text-slate-600 dark:text-[#b4b4b4]">
                        The previous generation was interrupted. Would you like to retry?
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastMessage.content)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer w-fit active:scale-95"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry response</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Token Exhaustion Alert Banner */}
      {isTokenExhausted && (
        <div className="mx-4 mb-2 p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                AI Tokens Finished (0 Remaining)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You've used all your tokens. Upgrade to Pro or top up to continue chatting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/billing")}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Upgrade to Pro</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Composer */}
      <MessageComposer
        key={composerKey}
        onSendMessage={handleSendMessage}
        isLoading={
          sendMessageMutation.isPending || createConversationMutation.isPending
        }
        disabled={isLoadingMessages || isTokenExhausted}
        placeholder={
          isTokenExhausted
            ? "Tokens exhausted. Upgrade your plan to continue chatting..."
            : undefined
        }
      />

      {/* Export & Sharing Modal */}
      <ChatExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={currentTitle}
        messages={messageList}
      />
    </div>
  );
};
