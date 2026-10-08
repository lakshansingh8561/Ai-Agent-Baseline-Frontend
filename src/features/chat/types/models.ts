export interface AIModel {
  id: string;
  name: string;
  provider: "Google" | "Anthropic" | "OpenAI";
  badge?: "Default" | "Pro" | "Reasoning" | "Fast";
  description: string;
  contextWindow: string;
  tierRequired: "free" | "pro";
  speed: "Ultra Fast" | "Fast" | "Balanced";
  iconName: "zap" | "sparkles" | "brain" | "bot";
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    badge: "Default",
    description: "Ultra-fast response with high multimodal intelligence.",
    contextWindow: "1M tokens",
    tierRequired: "free",
    speed: "Ultra Fast",
    iconName: "zap",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    badge: "Reasoning",
    description: "Deep analytical reasoning, complex code generation, and complex math.",
    contextWindow: "2M tokens",
    tierRequired: "pro",
    speed: "Balanced",
    iconName: "brain",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    badge: "Fast",
    description: "Lowest token consumption, ideal for quick queries and summarize tasks.",
    contextWindow: "1M tokens",
    tierRequired: "free",
    speed: "Ultra Fast",
    iconName: "zap",
  },
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    badge: "Pro",
    description: "State-of-the-art coding, nuanced architecture, and natural conversational writing.",
    contextWindow: "200k tokens",
    tierRequired: "pro",
    speed: "Balanced",
    iconName: "sparkles",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    badge: "Pro",
    description: "Omni model with balanced intelligence across general knowledge and data science.",
    contextWindow: "128k tokens",
    tierRequired: "pro",
    speed: "Fast",
    iconName: "bot",
  },
];
