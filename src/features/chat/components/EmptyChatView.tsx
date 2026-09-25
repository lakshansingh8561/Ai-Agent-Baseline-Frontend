import React from "react";
import { BrainCircuit, Sparkles, Code, Cpu, Lightbulb } from "lucide-react";

interface EmptyChatViewProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const EmptyChatView: React.FC<EmptyChatViewProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      title: "Explain a concept",
      desc: "Explain how MongoDB multi-document transactions ensure atomicity.",
      prompt: "Explain how MongoDB multi-document transactions ensure atomicity.",
    },
    {
      icon: <Code className="w-4 h-4 text-emerald-400" />,
      title: "Write clean code",
      desc: "Implement a TypeScript debounce utility function with generic types.",
      prompt: "Implement a TypeScript debounce utility function with generic types.",
    },
    {
      icon: <Cpu className="w-4 h-4 text-amber-400" />,
      title: "Architecture design",
      desc: "What are the core design principles of an agentic AI system?",
      prompt: "What are the core design principles of an agentic AI system?",
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-violet-400" />,
      title: "Brainstorm ideas",
      desc: "Give me 5 practical use cases for autonomous agent workflows.",
      prompt: "Give me 5 practical use cases for autonomous agent workflows.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
        <BrainCircuit className="w-6 h-6" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
        How can Lumina AI assist you today?
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mb-8 max-w-md">
        Ask complex questions, brainstorm architectures, or debug code with high precision.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
            className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/20 transition-all text-left group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {item.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
