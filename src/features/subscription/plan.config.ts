import type { SubscriptionPlan } from "./subscription.types.ts";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfigItem {
  id: SubscriptionPlan;
  name: string;
  price: string;
  rawPrice: number;
  currency: string;
  interval: string;
  description: string;
  tokens: string;
  popular?: boolean;
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfigItem> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    rawPrice: 0,
    currency: "USD",
    interval: "USD / month",
    description: "Explore the platform with basic AI access and essential tools.",
    tokens: "10,000 tokens / month",
    features: [
      "10,000 monthly AI tokens",
      "Full conversation history retention",
      "Standard Gemini response speed",
      "Standard context memory (up to 50 messages)",
      "Community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$6",
    rawPrice: 6,
    currency: "USD",
    interval: "USD / month",
    description: "Expanded token budget and faster performance for daily power users.",
    tokens: "50,000 tokens / month",
    popular: true,
    features: [
      "50,000 monthly AI tokens (5x Free)",
      "Higher priority generation queue",
      "Full conversation context retention",
      "Early access to new agent tools",
      "Seamless Polar subscription management",
      "Standard email support",
    ],
  },
  plus: {
    id: "plus",
    name: "Plus",
    price: "$20",
    rawPrice: 20,
    currency: "USD",
    interval: "USD / month",
    description: "Maximum generation allowance and top-tier priority for serious builders.",
    tokens: "100,000 tokens / month",
    popular: false,
    features: [
      "100,000 monthly AI tokens (10x Free)",
      "Highest priority model response speeds",
      "Maximum conversational context depth",
      "Instant fallback model routing",
      "Seamless Polar subscription management",
      "Priority customer support",
    ],
  },
};

export const ORDERED_PLANS: SubscriptionPlan[] = ["free", "pro", "plus"];
