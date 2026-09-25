import { api } from "../../lib/api.ts";
import type {
  Subscription,
  SubscriptionResponse,
  SafeCheckoutSession,
  CheckoutSessionResponse,
} from "./subscription.types.ts";

export interface CatalogPlan {
  id: "free" | "plus" | "pro";
  name: string;
  price: number;
  rawPrice: number;
  currency: string;
  interval: string;
  polarProductId: string | null;
  tokens: number;
  tokensDisplay: string;
  popular?: boolean;
  description: string;
  features: string[];
}

export interface CatalogResponse {
  success: boolean;
  message: string;
  data: {
    plans: CatalogPlan[];
  };
}

export const fetchCurrentSubscription = async (): Promise<Subscription> => {
  const response = await api.get<SubscriptionResponse>("/api/subscriptions/me");
  return response.data.data;
};

export const fetchSubscriptionCatalog = async (): Promise<CatalogPlan[]> => {
  const response = await api.get<CatalogResponse>("/api/subscriptions/plans");
  return response.data.data.plans;
};

export const createCheckoutSession = async (
  plan: "plus" | "pro"
): Promise<SafeCheckoutSession> => {
  const response = await api.post<CheckoutSessionResponse>(
    "/api/subscriptions/checkout",
    { plan }
  );
  return response.data.data;
};

export const confirmCheckoutSession = async (
  checkoutId: string
): Promise<Subscription> => {
  const response = await api.post<SubscriptionResponse>(
    "/api/subscriptions/confirm",
    { checkoutId }
  );
  return response.data.data;
};

