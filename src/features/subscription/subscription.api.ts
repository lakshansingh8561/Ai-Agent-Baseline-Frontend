import { api } from "../../lib/api.ts";
import type {
  Subscription,
  SubscriptionResponse,
} from "./subscription.types.ts";

export const fetchCurrentSubscription = async (): Promise<Subscription> => {
  const response = await api.get<SubscriptionResponse>("/api/subscriptions/me");
  return response.data.data;
};
