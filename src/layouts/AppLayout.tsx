import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/useAuth.ts";
import {
  useConversations,
  chatKeys,
} from "../features/chat/hooks/useChatQueries.ts";
import { fetchMessages } from "../features/chat/api/chat.api.ts";
import {
  resolveConversationTitle,
  setStoredDerivedTitle,
  getStoredDerivedTitle,
  deriveConversationTitle,
  isLegacyTitle,
} from "../features/chat/utils/title.utils.ts";
import type { SafeConversation, SafeMessage } from "../features/chat/types/chat.types.ts";
import {
  BrainCircuit,
  Plus,
  ChevronDown,
  MoreHorizontal,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set of conversation IDs already fetched or in-flight to prevent duplicate API requests
  const fetchedConversationIdsRef = useRef<Set<string>>(new Set());

  const { data: conversations, isLoading: isLoadingConversations } =
    useConversations();

  // Background hydration: auto-resolve real titles for legacy conversations ("New Chat" or "Untitled")
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    conversations.forEach(async (conv) => {
      // 1. Only process legacy titles exactly "New Chat" or "Untitled"
      if (!isLegacyTitle(conv.title)) return;

      // 2. Avoid duplicate API requests: skip if already fetched/checked in this session
      if (fetchedConversationIdsRef.current.has(conv.id)) return;

      // 3. If title is already in local UI storage cache, use it and update query cache if needed
      const stored = getStoredDerivedTitle(conv.id);
      if (stored) {
        fetchedConversationIdsRef.current.add(conv.id);
        if (conv.title !== stored) {
          queryClient.setQueryData<SafeConversation[]>(
            chatKeys.conversations(),
            (old = []) =>
              old.map((c) => (c.id === conv.id ? { ...c, title: stored } : c))
          );
        }
        return;
      }

      // Mark in-flight immediately to prevent race conditions across renders
      fetchedConversationIdsRef.current.add(conv.id);

      // 4. Check if messages are already available in React Query cache
      const cachedMessages = queryClient.getQueryData<SafeMessage[]>(
        chatKeys.messages(conv.id)
      );
      if (cachedMessages && cachedMessages.length > 0) {
        const firstUserMsg = cachedMessages.find((m) => m.role === "user");
        if (firstUserMsg && firstUserMsg.content) {
          const derived = deriveConversationTitle(firstUserMsg.content);
          setStoredDerivedTitle(conv.id, derived);
          queryClient.setQueryData<SafeConversation[]>(
            chatKeys.conversations(),
            (old = []) =>
              old.map((c) => (c.id === conv.id ? { ...c, title: derived } : c))
          );
        }
        return;
      }

      // 5. Fetch existing messages via existing GET /api/chat/conversations/:id/messages
      try {
        const msgs = await fetchMessages(conv.id);
        const firstUserMsg = msgs.find((m) => m.role === "user");
        if (firstUserMsg && firstUserMsg.content) {
          const derived = deriveConversationTitle(firstUserMsg.content);
          setStoredDerivedTitle(conv.id, derived);
          queryClient.setQueryData<SafeConversation[]>(
            chatKeys.conversations(),
            (old = []) =>
              old.map((c) => (c.id === conv.id ? { ...c, title: derived } : c))
          );
        }
        // If no user messages (empty conversation), keep server title "New Chat" without creating fake titles
      } catch {
        // Handle failed message-history requests gracefully: keep server title, sidebar does not break
      }
    });
  }, [conversations, queryClient]);


  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleSelectConversation = (id: string) => {
    navigate(`/app/${id}`);
    setMobileMenuOpen(false);
  };

  const handleNewChat = () => {
    navigate("/app");
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden select-none">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">NexaMind</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 lg:w-72 bg-slate-900/95 md:bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Top: Header & ChatGPT-style New Chat */}
        <div className="p-3 pb-2 flex flex-col gap-2.5">
          <div className="hidden md:flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">NexaMind</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-98 group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>New chat</span>
            </div>
          </button>
        </div>

        {/* Sidebar Middle: Recents Section (ChatGPT Style) */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 select-text custom-scrollbar">
          <div className="flex items-center justify-between px-2 pt-2.5 pb-1.5 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors">
              <span>Recents</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            {conversations && conversations.length > 0 && (
              <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                {conversations.length}
              </span>
            )}
          </div>

          {isLoadingConversations ? (
            <div className="space-y-1.5 px-1 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = conv.id === conversationId;
              const displayTitle = resolveConversationTitle(conv.id, conv.title);

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer select-none ${
                    isActive
                      ? "bg-slate-800 text-white font-medium shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                  title={displayTitle}
                >
                  <span className="truncate flex-1 pr-2 leading-relaxed text-[13px] sm:text-sm">
                    {displayTitle}
                  </span>
                  <div
                    className={`flex-shrink-0 transition-opacity ${
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800/80 p-4 text-center mx-1 my-2">
              <p className="text-xs text-slate-300 font-medium">No chats yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;New chat&quot; to begin
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Bottom: User Profile Area & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0 shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                    {user?.email || ""}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {user?.plan || "free"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0 cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100dvh-57px)] md:h-screen overflow-hidden bg-slate-950 select-text">
        <Outlet />
      </main>
    </div>
  );
};

