import React from "react";
import { BrainCircuit, Sparkles, Code, Cpu, Lightbulb, Zap } from "lucide-react";
import { useModel } from "../context/ModelContext.tsx";
import { Galaxy3DBackground } from "./Galaxy3DBackground.tsx";

interface EmptyChatViewProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const EmptyChatView: React.FC<EmptyChatViewProps> = ({ onSelectPrompt }) => {
  const { selectedModel } = useModel();

  const suggestions = [
    {
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      title: "System Architecture",
      desc: "Design a fault-tolerant multi-agent orchestrator with event queues and checkpointing.",
      prompt: "Design a fault-tolerant multi-agent orchestrator with event queues and checkpointing.",
    },
    {
      icon: <Code className="w-4 h-4 text-emerald-400" />,
      title: "Clean Code & Refactor",
      desc: "Write a high-performance TypeScript token bucket rate limiter with Redis backing.",
      prompt: "Write a high-performance TypeScript token bucket rate limiter with Redis backing.",
    },
    {
      icon: <Cpu className="w-4 h-4 text-violet-400" />,
      title: "Deep Reasoning & Math",
      desc: "Derive and explain the mathematical formulation behind self-attention and KV caching.",
      prompt: "Derive and explain the mathematical formulation behind self-attention and KV caching.",
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      title: "SaaS Product Strategy",
      desc: "What are the most critical metrics and guardrails when launching an AI agent product?",
      prompt: "What are the most critical metrics and guardrails when launching an AI agent product?",
    },
  ];

  return (
    <div className="relative w-full h-full min-h-[75vh] flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-hidden select-none">
      {/* Expansive 3D Cosmic Galaxy Vortex (Full-Screen) */}
      <Galaxy3DBackground />

      {/* Foreground Content with Crisp Legibility (pointer-events-none allows dragging background 3D canvas) */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto my-auto animate-in fade-in duration-300 pointer-events-none">
        {/* Sleek Hero Icon */}
        <div className="relative mb-3.5 pointer-events-auto">
          <div className="w-13 h-13 rounded-2xl bg-white/95 dark:bg-[#161618]/90 backdrop-blur-md border border-slate-200/80 dark:border-[#28282c] text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <BrainCircuit className="w-6.5 h-6.5" />
          </div>
        </div>

        {/* Model Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-[#161618]/80 backdrop-blur-md border border-slate-200/80 dark:border-[#28282c] text-indigo-700 dark:text-[#ececec] text-xs font-semibold mb-3 shadow-xs pointer-events-auto">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Powered by {selectedModel.name}</span>
        </div>

        {/* Crisp High-Contrast Typography */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-[#ffffff] tracking-tight mb-2 select-text">
          How can Lumina assist your workflow today?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#b4b4b4] mb-8 max-w-md leading-relaxed select-text">
          Autonomous reasoning, full-stack architecture design, multimodal image comprehension, and production-grade code generation.
        </p>

        {/* Suggestion Cards with Frosted Glassmorphism for 3D Depth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pointer-events-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
              className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#141416]/80 backdrop-blur-md border border-slate-200/80 dark:border-[#242428] hover:border-indigo-400 dark:hover:border-[#3a3a42] dark:hover:bg-[#1a1a1e]/90 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1 rounded-lg bg-slate-100 dark:bg-[#202025] group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-[#ececec] group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#b4b4b4] line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
