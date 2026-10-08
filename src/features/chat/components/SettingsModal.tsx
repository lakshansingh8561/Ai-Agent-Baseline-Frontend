import React, { useState } from "react";
import { useTheme, type Theme } from "../../../lib/theme.tsx";
import { useModel } from "../context/ModelContext.tsx";
import { AVAILABLE_MODELS } from "../types/models.ts";
import { useAuth } from "../../auth/useAuth.ts";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Cpu,
  Database,
  X,
  Shield,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, actualTheme } = useTheme();
  const { selectedModel, setSelectedModel } = useModel();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"appearance" | "ai" | "data">("appearance");

  // Local state for AI instructions (persisted in localStorage)
  const [customInstructions, setCustomInstructions] = useState(() => {
    return localStorage.getItem("lumina_custom_instructions") || "";
  });
  const [sendShortcut, setSendShortcut] = useState(() => {
    return localStorage.getItem("lumina_send_shortcut") || "enter";
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAIPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lumina_custom_instructions", customInstructions);
    localStorage.setItem("lumina_send_shortcut", sendShortcut);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#383838] flex flex-col md:flex-row overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 bg-slate-50 dark:bg-[#171717] p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#2d2d2d] flex flex-row md:flex-col gap-1.5 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 px-2 py-1 mb-3">
            <Settings className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-slate-800 dark:text-[#ececec]">
              Settings
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left w-full ${
              activeTab === "appearance"
                ? "bg-indigo-50 dark:bg-[#282828] text-indigo-700 dark:text-[#ececec] font-semibold"
                : "text-slate-600 dark:text-[#b4b4b4] hover:bg-slate-200/60 dark:hover:bg-[#282828]"
            }`}
          >
            {actualTheme === "dark" ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left w-full ${
              activeTab === "ai"
                ? "bg-indigo-50 dark:bg-[#282828] text-indigo-700 dark:text-[#ececec] font-semibold"
                : "text-slate-600 dark:text-[#b4b4b4] hover:bg-slate-200/60 dark:hover:bg-[#282828]"
            }`}
          >
            <Cpu className="w-4 h-4 text-violet-500" />
            <span>AI & System Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left w-full ${
              activeTab === "data"
                ? "bg-indigo-50 dark:bg-[#282828] text-indigo-700 dark:text-[#ececec] font-semibold"
                : "text-slate-600 dark:text-[#b4b4b4] hover:bg-slate-200/60 dark:hover:bg-[#282828]"
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Data & Privacy</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#2d2d2d]">
            <h3 className="font-bold text-base text-slate-900 dark:text-[#ececec]">
              {activeTab === "appearance" && "Appearance & Display"}
              {activeTab === "ai" && "AI Behavior & Custom Instructions"}
              {activeTab === "data" && "Data Management & Privacy"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1">
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#b4b4b4] uppercase tracking-wider block mb-2.5">
                    Theme Preference
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "light" as Theme,
                        name: "Light",
                        icon: <Sun className="w-5 h-5 text-amber-500" />,
                        desc: "Crisp & bright",
                      },
                      {
                        id: "dark" as Theme,
                        name: "Dark",
                        icon: <Moon className="w-5 h-5 text-indigo-400" />,
                        desc: "ChatGPT Obsidian",
                      },
                      {
                        id: "system" as Theme,
                        name: "System",
                        icon: <Monitor className="w-5 h-5 text-slate-400" />,
                        desc: "Follows OS",
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
                          theme === item.id
                            ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-[#2f2f2f] ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-[#383838] hover:border-slate-300 dark:hover:border-[#4d4d4d] bg-white dark:bg-[#282828]"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#212121]">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-[#ececec]">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-[#737373]">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[#2d2d2d] pt-5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#b4b4b4] uppercase tracking-wider block mb-2">
                    Message Composer Shortcut
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#282828] cursor-pointer">
                      <input
                        type="radio"
                        name="shortcut"
                        checked={sendShortcut === "enter"}
                        onChange={() => {
                          setSendShortcut("enter");
                          localStorage.setItem("lumina_send_shortcut", "enter");
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-[#ececec]">
                          Enter to send, Shift + Enter for new line (Default)
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-[#737373]">
                          Fastest conversational flow
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#282828] cursor-pointer">
                      <input
                        type="radio"
                        name="shortcut"
                        checked={sendShortcut === "ctrl_enter"}
                        onChange={() => {
                          setSendShortcut("ctrl_enter");
                          localStorage.setItem("lumina_send_shortcut", "ctrl_enter");
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-[#ececec]">
                          Ctrl / Cmd + Enter to send
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-[#737373]">
                          Prevents accidental submits on long prompts
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AI Preferences Tab */}
            {activeTab === "ai" && (
              <form onSubmit={handleSaveAIPreferences} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#b4b4b4] uppercase tracking-wider block mb-2">
                    Preferred Default Model
                  </label>
                  <select
                    value={selectedModel.id}
                    onChange={(e) => {
                      const m = AVAILABLE_MODELS.find((x) => x.id === e.target.value);
                      if (m) setSelectedModel(m);
                    }}
                    className="w-full bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-[#ececec] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider}) {m.tierRequired === "pro" ? "— [Pro]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-[#b4b4b4] uppercase tracking-wider">
                      Custom System Instructions
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-[#737373]">
                      Applied to all conversations
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. 'You are a Senior Staff Engineer. Always provide clean, modular TypeScript solutions with edge-case handling. Prefer concise explanations.'"
                    className="w-full bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-[#ececec] placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar resize-none"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-[#737373] mt-1">
                    Tell Lumina how you want it to respond, what tone to adopt, and your preferred coding style.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {savedSuccess ? "Preferences saved successfully!" : ""}
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Save Instructions
                  </button>
                </div>
              </form>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === "data" && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-[#ececec]">
                      Enterprise Data Privacy
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4] mt-0.5 leading-relaxed">
                      Your conversation history is secured with encrypted database storage. Chats are not used to train global public models.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[#2d2d2d] pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-[#ececec]">
                        Signed-in Account
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-[#737373]">{user?.email}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#282828] text-indigo-700 dark:text-[#ececec] border border-indigo-200 dark:border-[#383838]">
                      {user?.plan || "free"} Plan
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
