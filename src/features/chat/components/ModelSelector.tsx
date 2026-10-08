import React, { useState, useRef, useEffect } from "react";
import { useModel } from "../context/ModelContext.tsx";
import { AVAILABLE_MODELS, type AIModel } from "../types/models.ts";
import { useAuth } from "../../auth/useAuth.ts";
import {
  ChevronDown,
  Zap,
  Sparkles,
  Brain,
  Bot,
  Lock,
  Check,
  Cpu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useModel();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getModelIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "zap":
        return <Zap className={className} />;
      case "brain":
        return <Brain className={className} />;
      case "sparkles":
        return <Sparkles className={className} />;
      case "bot":
      default:
        return <Bot className={className} />;
    }
  };

  const handleSelectModel = (model: AIModel) => {
    if (model.tierRequired === "pro" && !isPro) {
      setIsOpen(false);
      navigate("/app/billing");
      return;
    }
    setSelectedModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#383838] hover:border-slate-300 dark:hover:border-[#4d4d4d] text-slate-800 dark:text-[#ececec] text-xs sm:text-sm font-medium shadow-xs transition-all cursor-pointer select-none"
        aria-label="Select AI Model"
      >
        <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
          {getModelIcon(selectedModel.iconName, "w-3.5 h-3.5")}
        </span>
        <span className="font-semibold tracking-tight">{selectedModel.name}</span>
        {selectedModel.badge && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {selectedModel.badge}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-[#737373] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#161618] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#28282c] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-[#242428] mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#b4b4b4] uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Model Selection</span>
            </div>
            {!isPro && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Free Tier
              </span>
            )}
          </div>

          <div className="space-y-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = selectedModel.id === model.id;
              const isLocked = model.tierRequired === "pro" && !isPro;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-[#202025] border border-indigo-200/80 dark:border-indigo-500/50"
                      : "hover:bg-slate-100 dark:hover:bg-[#1e1e22] border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-[#202025] text-slate-600 dark:text-[#ececec]"
                      }`}
                    >
                      {getModelIcon(model.iconName, "w-4 h-4")}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-[#ececec]">
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-[#202025] text-slate-700 dark:text-[#ececec] border border-transparent dark:border-[#2e2e34]">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4] mt-0.5 line-clamp-2 leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-[#737373]">
                        <span>{model.contextWindow}</span>
                        <span>•</span>
                        <span>{model.speed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-shrink-0 mt-1">
                    {isLocked ? (
                      <span
                        className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        title="Pro plan required"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {!isPro && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#2d2d2d]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/app/billing");
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock Gemini 2.5 Pro & Claude 3.7</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
