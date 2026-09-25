export type SubscriptionPlan = "free" | "plus" | "pro";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";

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

export interface SafeCheckoutSession {
  checkoutUrl: string;
  id?: string;
  status?: string;
  expiresAt?: string | null;
  upgradedDirectly?: boolean;
  plan?: "plus" | "pro";
}

export interface CheckoutSessionResponse {
  success: boolean;
  message?: string;
  data: SafeCheckoutSession;
}

export interface CreateCheckoutRequest {
  plan: "plus" | "pro";
}

