import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/useAuth.ts";
import {
  useConversations,
  useDeleteConversation,
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
import { TokenBalanceWidget } from "../features/token/index.ts";
import type { SafeConversation, SafeMessage } from "../features/chat/types/chat.types.ts";
import { useTheme } from "../lib/theme.tsx";
import { CommandPalette } from "../features/chat/components/CommandPalette.tsx";
import { SettingsModal } from "../features/chat/components/SettingsModal.tsx";
import { UserProfileModal } from "../features/auth/components/UserProfileModal.tsx";
import {
  BrainCircuit,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sparkles,
  Search,
  Moon,
  Sun,
  Settings,
  Command,
  PanelLeftClose,
} from "lucide-react";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Desktop sidebar collapse state with persistence
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("lumina_sidebar_open");
      if (stored !== null) {
        return stored === "true";
      }
    } catch {
      // ignore
    }
    return true;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lumina_sidebar_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Modals state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);

  const deleteConversationMutation = useDeleteConversation();

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Global keydown for Cmd+K / Ctrl+K and Cmd+B / Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    targetId: string
  ) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      await deleteConversationMutation.mutateAsync(targetId);
      if (conversationId === targetId) {
        navigate("/app", { replace: true });
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const fetchedConversationIdsRef = useRef<Set<string>>(new Set());
  const { data: conversations, isLoading: isLoadingConversations } = useConversations();

  // Auto-resolve real titles for legacy chats
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    conversations.forEach(async (conv) => {
      if (!isLegacyTitle(conv.title)) return;
      if (fetchedConversationIdsRef.current.has(conv.id)) return;

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

      fetchedConversationIdsRef.current.add(conv.id);

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
      } catch {
        // ignore
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
    navigate("/app", { state: { resetDraft: Date.now() } });
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen h-[100dvh] bg-white dark:bg-[#0d0d0d] text-slate-900 dark:text-[#ececec] flex flex-col md:flex-row overflow-hidden select-none transition-colors">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#0d0d0d] backdrop-blur-md border-b border-slate-200 dark:border-[#1a1a1e] z-30 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight">
            Lumina AI
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {actualTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 bg-white dark:bg-[#0d0d0d] md:bg-slate-50/90 dark:md:bg-[#0d0d0d] flex flex-col justify-between z-50 transition-all duration-200 ease-in-out ${
          mobileMenuOpen
            ? "translate-x-0 w-64 lg:w-72 shadow-2xl border-r border-slate-200/90 dark:border-[#1a1a1e]"
            : "-translate-x-full md:translate-x-0"
        } ${
          sidebarOpen
            ? "md:w-64 lg:w-72 md:border-r md:border-slate-200/90 dark:md:border-[#1a1a1e] md:opacity-100"
            : "md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0 md:overflow-hidden"
        }`}
      >
        <div className="w-64 lg:w-72 h-full flex flex-col justify-between flex-shrink-0">
          {/* Sidebar Top: Logo & New Chat */}
          <div className="p-3 pb-2 flex flex-col gap-2.5">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-[#1a1a1d] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-[#2a2a2e] shadow-xs">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-[#ececec] text-base tracking-tight">
                  Lumina AI
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#1c1c20] transition-colors cursor-pointer"
                  title={`Switch to ${actualTheme === "dark" ? "Light" : "Dark"} mode`}
                >
                  {actualTheme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#1c1c20] transition-colors cursor-pointer"
                  title="Close sidebar (Ctrl+B)"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Drawer Header */}
            <div className="flex md:hidden items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-[#1a1a1d] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-[#2a2a2e] shadow-xs">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-[#ececec] text-base tracking-tight">
                  Lumina AI
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#1c1c20] transition-colors cursor-pointer"
                title="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          {/* Quick Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200/80 dark:hover:bg-[#222226] text-slate-500 dark:text-[#b4b4b4] text-xs transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:border-[#26262a]"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search or jump to...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#2a2a2e] rounded text-slate-400">
              <Command className="w-2.5 h-2.5" />
            </kbd>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-[#1c1c20] dark:hover:bg-[#242429] text-white dark:text-[#ececec] dark:border dark:border-[#2c2c32] text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-98 group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white dark:text-[#ececec]" />
              <span>New chat</span>
            </div>
          </button>
        </div>

        {/* Sidebar Middle: Recents Section */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 select-text custom-scrollbar">
          <div className="flex items-center justify-between px-2 pt-2.5 pb-1.5 text-xs font-semibold text-slate-500 dark:text-[#737373]">
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-[#ececec] transition-colors">
              <span>Recents</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373]" />
            </div>
            {conversations && conversations.length > 0 && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-[#737373] tabular-nums">
                {conversations.length}
              </span>
            )}
          </div>

          {isLoadingConversations ? (
            <div className="space-y-1.5 px-1 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-slate-200/60 dark:bg-[#212121] animate-pulse"
                />
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = conv.id === conversationId;
              const displayTitle = resolveConversationTitle(conv.id, conv.title);
              const isMenuOpen = openMenuId === conv.id;

              return (
                <div key={conv.id} className="relative group w-full">
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-all cursor-pointer select-none ${
                      isActive
                        ? "bg-white dark:bg-[#1c1c20] text-slate-900 dark:text-[#ffffff] font-medium shadow-xs border border-slate-200/90 dark:border-[#2c2c32] pr-9"
                        : "text-slate-600 dark:text-[#b4b4b4] hover:bg-slate-200/60 dark:hover:bg-[#18181b] hover:text-slate-900 dark:hover:text-[#ffffff] pr-9"
                    }`}
                    title={displayTitle}
                  >
                    <span className="truncate flex-1 leading-relaxed">
                      {displayTitle}
                    </span>
                  </button>

                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : conv.id);
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        isMenuOpen
                          ? "bg-slate-200 dark:bg-[#242429] text-slate-900 dark:text-white opacity-100"
                          : isActive
                          ? "text-slate-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-white opacity-100"
                          : "text-slate-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-white opacity-0 group-hover:opacity-100"
                      }`}
                      title="Chat options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#2c2c32] rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          disabled={deleteConversationMutation.isPending}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300/80 dark:border-[#222226] p-4 text-center mx-1 my-2">
              <p className="text-xs text-slate-600 dark:text-[#737373] font-medium">
                No chats yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-[#555555] mt-1">
                Click &quot;New chat&quot; to begin
              </p>
            </div>
          )}
        </div>

        {/* Token Balance Indicator */}
        <TokenBalanceWidget />

        {/* Plans & Billing Shortcut */}
        <div className="px-3 pb-1.5">
          <button
            type="button"
            onClick={() => {
              navigate("/app/billing");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-[#18181b] dark:to-[#18181b] border border-indigo-200/80 dark:border-[#28282d] text-indigo-700 dark:text-[#ececec] hover:from-indigo-100 hover:to-indigo-200/60 dark:hover:bg-[#222226] transition-all shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-amber-400 flex-shrink-0" />
              <span>{user?.plan === "pro" ? "Subscription Active" : "Upgrade Plan"}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white dark:bg-[#0d0d0d] text-indigo-700 dark:text-amber-300 border border-indigo-200 dark:border-[#2c2c32]">
              {user?.plan || "free"}
            </span>
          </button>
        </div>

        {/* Sidebar Bottom: User Profile Area, Settings & Logout */}
        <div className="p-3 border-t border-slate-200/90 dark:border-[#1a1a1e] bg-white/70 dark:bg-[#0d0d0d]">
          <div className="flex items-center justify-between gap-1.5">
            {/* Clickable Profile Card */}
            <div
              onClick={() => setUserProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1c1c1f] transition-colors cursor-pointer"
              title="View account profile"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-[#222226] text-indigo-700 dark:text-white border border-indigo-200/80 dark:border-[#2c2c32] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#ececec] truncate">
                  {user?.name || "User"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-[#737373] truncate max-w-[90px]">
                    {user?.email || ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Icon */}
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#737373] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1f] transition-colors flex-shrink-0 cursor-pointer"
              title="Settings & Instructions"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:text-[#737373] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0 cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100dvh-57px)] md:h-screen overflow-hidden bg-white dark:bg-[#0d0d0d] text-slate-900 dark:text-[#ececec] select-text transition-colors">
        <Outlet context={{ sidebarOpen, toggleSidebar, setSidebarOpen }} />
      </main>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenProfile={() => setUserProfileModalOpen(true)}
        onOpenExport={() => {
          // handled in ChatPage if conversation active
          const exportBtn = document.getElementById("trigger-chat-export");
          if (exportBtn) exportBtn.click();
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />
    </div>
  );
};
