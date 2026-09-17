export type SubscriptionPlan = "free" | "pro";

export type SubscriptionStatus = "active" | "cancelled" | "expired";

export type SubscriptionProvider = "none" | "polar";

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  providerSubscriptionId: string | null;
  providerProductId: string | null;
  price: number;
  currency: string;
  tokensPerPeriod: number;
  billingInterval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
  data: Subscription;
}
