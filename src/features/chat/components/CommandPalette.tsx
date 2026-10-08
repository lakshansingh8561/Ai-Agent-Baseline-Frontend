import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConversations } from "../hooks/useChatQueries.ts";
import { useTheme } from "../../../lib/theme.tsx";
import { useModel } from "../context/ModelContext.tsx";
import { AVAILABLE_MODELS } from "../types/models.ts";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Settings,
  User,
  CreditCard,
  Download,
  Cpu,
  MessageSquare,
  ArrowRight,
  Command,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenProfile,
  onOpenExport,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { data: conversations } = useConversations();
  const { actualTheme, toggleTheme } = useTheme();
  const { selectModelById } = useModel();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keybinding for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter actions and conversations
  const q = query.toLowerCase().trim();

  const standardActions = [
    {
      id: "new-chat",
      title: "Start New Chat",
      category: "Action",
      icon: <Plus className="w-4 h-4 text-emerald-500" />,
      run: () => {
        navigate("/app", { state: { resetDraft: Date.now() } });
        onClose();
      },
    },
    {
      id: "toggle-theme",
      title: `Switch to ${actualTheme === "dark" ? "Light" : "Dark"} Mode`,
      category: "Appearance",
      icon:
        actualTheme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500" />
        ),
      run: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: "open-settings",
      title: "Open Preferences & Settings",
      category: "Preferences",
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      run: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: "open-profile",
      title: "View Profile & Usage",
      category: "Account",
      icon: <User className="w-4 h-4 text-indigo-500" />,
      run: () => {
        onClose();
        onOpenProfile();
      },
    },
    {
      id: "go-billing",
      title: "Upgrade Plan & Token Billing",
      category: "Account",
      icon: <CreditCard className="w-4 h-4 text-violet-500" />,
      run: () => {
        navigate("/app/billing");
        onClose();
      },
    },
    ...(conversationId
      ? [
          {
            id: "export-chat",
            title: "Export Current Chat (Markdown, JSON, PDF)",
            category: "Action",
            icon: <Download className="w-4 h-4 text-sky-500" />,
            run: () => {
              onClose();
              onOpenExport();
            },
          },
        ]
      : []),
  ];

  const modelActions = AVAILABLE_MODELS.map((m) => ({
    id: `model-${m.id}`,
    title: `Switch Model: ${m.name}`,
    category: "Models",
    icon: <Cpu className="w-4 h-4 text-indigo-500" />,
    badge: m.badge,
    run: () => {
      selectModelById(m.id);
      onClose();
    },
  }));

  const conversationActions = (conversations || []).map((conv) => ({
    id: `conv-${conv.id}`,
    title: conv.title,
    category: "Conversations",
    icon: <MessageSquare className="w-4 h-4 text-slate-400" />,
    run: () => {
      navigate(`/app/${conv.id}`);
      onClose();
    },
  }));

  const allItems = [...standardActions, ...modelActions, ...conversationActions].filter(
    (item) => item.title.toLowerCase().includes(q)
  );

  const handleKeyDownInList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#383838] overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownInList}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-[#2d2d2d]">
          <Search className="w-5 h-5 text-slate-400 dark:text-[#737373]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search past chats..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-[#ececec] placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-[#737373] bg-slate-100 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-[#737373]">
              No matching commands or conversations found.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-[#2f2f2f] text-indigo-900 dark:text-[#ececec] font-medium"
                      : "text-slate-700 dark:text-[#ececec] hover:bg-slate-50 dark:hover:bg-[#282828]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1 rounded-lg bg-slate-100 dark:bg-[#282828] flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.title}</span>
                    {(item as any).badge && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-[#282828] text-indigo-700 dark:text-[#ececec] border border-transparent dark:border-[#383838]">
                        {(item as any).badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 dark:text-[#737373] uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#1a1a1a] border-t border-slate-100 dark:border-[#2d2d2d] text-[11px] text-slate-400 dark:text-[#737373] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <Command className="w-3 h-3" />
            <span>K anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};
