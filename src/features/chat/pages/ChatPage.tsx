import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import {
  BrainCircuit,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Zap,
  Sparkles,
} from "lucide-react";
import { useTokenBalance } from "../../token/hooks/useTokenQueries.ts";

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Unique request counter and active request ID for strict stale-request isolation
  const requestIdCounter = useRef<number>(0);
  const activeRequestIdRef = useRef<number>(0);

  // Track the active conversation ID to prevent in-flight responses from old conversations leaking into new/other conversations
  const activeConversationIdRef = useRef<string | undefined>(conversationId);
  // Track when we are intentionally transitioning from draft (/app) to a newly created conversation (/app/:id)
  const isTransitioningFromDraftRef = useRef(false);

  const { data: conversations, isLoading: isLoadingConversations } =
    useConversations();
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useMessages(conversationId);

  const createConversationMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage(conversationId);
  const deleteConversationMutation = useDeleteConversation();
  const { data: tokenData } = useTokenBalance();

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

  const [composerKey, setComposerKey] = useState(0);
  const [pendingUserContent, setPendingUserContent] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTokenLimitError, setIsTokenLimitError] = useState(false);

  const isTokenExhausted =
    (tokenData !== undefined && tokenData.balance <= 0) || isTokenLimitError;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef(conversationId);
  const prevResetDraftRef = useRef(location.state?.resetDraft);

  // Sync activeConversationIdRef whenever conversationId changes
  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  // Cleanly redirect to /app if requested conversation is not found or deleted (404)
  useEffect(() => {
    if ((messagesError as any)?.response?.status === 404) {
      navigate("/app", { replace: true });
    }
  }, [messagesError, navigate]);

  // Reset UI state when switching conversations or when New Chat is explicitly clicked
  useEffect(() => {
    const conversationChanged = prevConversationIdRef.current !== conversationId;
    const resetDraftTriggered =
      location.state?.resetDraft &&
      location.state.resetDraft !== prevResetDraftRef.current;

    prevConversationIdRef.current = conversationId;
    prevResetDraftRef.current = location.state?.resetDraft;

    if (resetDraftTriggered) {
      // Explicit New Chat requested: invalidate any in-flight request identity
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
        // Seamless transition from draft to newly created conversation: keep pending state intact
        return;
      }
      // User switched conversations: invalidate any in-flight request identity
      activeRequestIdRef.current = ++requestIdCounter.current;
      setPendingUserContent(null);
      setErrorMessage(null);
      setIsTokenLimitError(false);
      setComposerKey((k) => k + 1);
    }
  }, [conversationId, location.state]);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages?.length, pendingUserContent]);

  // Synchronize and resolve actual title for active conversation if it shows "New Chat" or "Untitled"
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
    onSuccessCallback?: () => void
  ) => {
    if (isTokenExhausted) {
      setIsTokenLimitError(true);
      setErrorMessage(
        "Your token balance is exhausted. Please upgrade your plan to Pro or Plus to continue chatting."
      );
      return;
    }

    if (sendMessageMutation.isPending || createConversationMutation.isPending) {
      return;
    }

    setErrorMessage(null);
    setIsTokenLimitError(false);
    setPendingUserContent(content);

    if (!conversationId) {
      // Draft flow: generate unique request ID
      const currentRequestId = ++requestIdCounter.current;
      activeRequestIdRef.current = currentRequestId;
      isTransitioningFromDraftRef.current = true;

      try {
        const title = deriveConversationTitle(content);
        const newConversation = await createConversationMutation.mutateAsync({
          title,
        });

        // DRAFT RACE CHECK:
        // If user clicked New Chat or navigated away while createConversation was in-flight, abort immediately.
        if (
          activeRequestIdRef.current !== currentRequestId ||
          activeConversationIdRef.current !== undefined
        ) {
          isTransitioningFromDraftRef.current = false;
          return;
        }

        const targetConversationId = newConversation.id;

        // Optimistically populate conversation message cache so the prompt is immediately visible
        // even if user navigates to New Chat and immediately re-opens this conversation
        const optimisticMsg: SafeMessage = {
          id: `temp_${Date.now()}`,
          conversationId: targetConversationId,
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<SafeMessage[]>(
          chatKeys.messages(targetConversationId),
          [optimisticMsg]
        );

        // Navigate using React Router replace so URL reflects new conversation without reload
        navigate(`/app/${targetConversationId}`, { replace: true });
        activeConversationIdRef.current = targetConversationId;

        // Send message to the newly created conversation
        sendMessageMutation.mutate(
          { content, targetConversationId },
          {
            onSuccess: () => {
              isTransitioningFromDraftRef.current = false;
              // STALE-REQUEST ISOLATION:
              // Only update UI if this exact request still belongs to the currently active conversation
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
              // Remove temporary optimistic message on failure
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
        // Conversation creation failed before navigation:
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

    // Existing conversation flow:
    const targetConversationId = conversationId;
    const currentRequestId = ++requestIdCounter.current;
    activeRequestIdRef.current = currentRequestId;

    const optimisticMsg: SafeMessage = {
      id: `temp_${Date.now()}`,
      conversationId: targetConversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<SafeMessage[]>(
      chatKeys.messages(targetConversationId),
      (old = []) => [...old, optimisticMsg]
    );

    sendMessageMutation.mutate(
      { content, targetConversationId },
      {
        onSuccess: () => {
          // STALE-REQUEST ISOLATION:
          // Only update UI if this exact request still belongs to the currently active conversation
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
    // Invalidate in-flight request identity immediately
    activeRequestIdRef.current = ++requestIdCounter.current;
    isTransitioningFromDraftRef.current = false;
    activeConversationIdRef.current = undefined;

    setPendingUserContent(null);
    setErrorMessage(null);
    setIsTokenLimitError(false);
    setComposerKey((k) => k + 1);

    navigate("/app", { state: { resetDraft: Date.now() } });
  };

  const currentConversation = conversations?.find((c) => c.id === conversationId);

  // State 1: Invalid / missing conversation ID error (e.g. 404 or 400 malformed ID)
  const isInvalidConversation =
    Boolean(conversationId) &&
    Boolean(messagesError) &&
    messagesError instanceof AxiosError &&
    (messagesError.response?.status === 404 || messagesError.response?.status === 400);

  if (isInvalidConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
          Conversation Not Found
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
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
          <button
            type="button"
            onClick={handleStartNewChat}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Return to Chats</span>
          </button>
        </div>
      </div>
    );
  }

  const activeErrorMessage = errorMessage;

  const messageList: SafeMessage[] = messages ?? [];
  const hasMessages = messageList.length > 0;
  const lastMessage = hasMessages ? messageList[messageList.length - 1] : null;
  const isGenerating =
    Boolean(pendingUserContent) ||
    (sendMessageMutation.isPending && activeConversationIdRef.current === conversationId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60">
      {/* Conversation Top Bar */}
      <header className="px-4 py-3 border-b border-slate-200/90 bg-white/80 backdrop-blur flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex-shrink-0 shadow-xs">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {conversationId
                ? resolveConversationTitle(
                    conversationId,
                    currentConversation?.title,
                    messages?.find((m) => m.role === "user")?.content
                  )
                : isLoadingConversations
                ? "Loading..."
                : "New Chat"}
            </h1>
            <p className="text-[11px] text-slate-500">Lumina AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversationId && (
            <button
              type="button"
              onClick={handleDeleteActiveConversation}
              disabled={deleteConversationMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Delete Chat"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Error Banners */}
      {activeErrorMessage && (
        <div
          className={`mx-4 mt-3 p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 shadow-xs ${
            isTokenLimitError
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{activeErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsTokenLimitError(false);
            }}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-1">
        {!conversationId ? (
          // DRAFT VIEW: Only on /app without conversationId
          pendingUserContent ? (
            <>
              {/* Temporary pending user message */}
              <div className="flex justify-end mb-4 px-2 sm:px-4 opacity-80">
                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-600">You</span>
                    <span>•</span>
                    <span>Sending...</span>
                  </div>
                  <div className="rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-3 text-sm text-white shadow-sm leading-relaxed whitespace-pre-wrap break-words">
                    {pendingUserContent}
                  </div>
                </div>
              </div>

              {/* Assistant Generating Indicator */}
              <div className="flex justify-start mb-6 px-2 sm:px-4">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-xs">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-600">Lumina AI</span>
                      <span>•</span>
                      <span className="text-slate-500">Generating response...</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 px-4 py-3.5 text-sm text-slate-700 shadow-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                      <span className="text-xs text-slate-500 ml-1">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
              <div ref={messagesEndRef} />
            </>
          ) : (
            <EmptyChatView
              onSelectPrompt={(prompt) => {
                if (isTokenExhausted) {
                  setIsTokenLimitError(true);
                  setErrorMessage(
                    "Your token balance is exhausted. Please upgrade your plan to Pro or Plus to continue chatting."
                  );
                  return;
                }
                handleSendMessage(prompt);
              }}
            />
          )
        ) : isLoadingMessages && !hasMessages ? (
          // CONVERSATION LOADING VIEW (when first mounting an existing conversation)
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-medium">Loading message history...</p>
          </div>
        ) : (
          // ACTIVE CONVERSATION VIEW (Never renders EmptyChatView on a real conversation)
          <>
            {messageList.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}

            {/* Assistant Generating Indicator */}
            {isGenerating && (
              <div className="flex justify-start mb-6 px-2 sm:px-4">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-xs">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-600">Lumina AI</span>
                      <span>•</span>
                      <span className="text-slate-500">Generating response...</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 px-4 py-3.5 text-sm text-slate-700 shadow-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                      <span className="text-xs text-slate-500 ml-1">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interrupted Response Notice with Retry */}
            {!isGenerating && hasMessages && lastMessage?.role === "user" && (
              <div className="flex justify-start mb-6 px-2 sm:px-4">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">Lumina AI</span>
                      <span>•</span>
                      <span className="text-amber-600 font-medium">Response was interrupted</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 px-4 py-3 shadow-xs flex flex-col gap-2.5">
                      <p className="text-xs text-slate-600">
                        Lumina AI was unable to complete the response due to high demand or network timeout.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastMessage.content)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer w-fit active:scale-95"
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
        <div className="mx-4 mb-2 p-3 sm:p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                AI Tokens Finished (0 Remaining)
              </p>
              <p className="text-[11px] text-slate-500">
                You've used all your tokens. Upgrade to Pro (50,000 tokens) or Plus (100,000 tokens) to chat more.
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

      {/* Bottom Composer */}
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
    </div>
  );
};
