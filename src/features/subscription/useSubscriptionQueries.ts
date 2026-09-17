import { useQuery } from "@tanstack/react-query";
import { fetchCurrentSubscription } from "./subscription.api.ts";
import type { Subscription } from "./subscription.types.ts";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  current: () => [...subscriptionKeys.all, "me"] as const,
};

export const useCurrentSubscription = () => {
  return useQuery<Subscription, Error>({
    queryKey: subscriptionKeys.current(),
    queryFn: fetchCurrentSubscription,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });
};
