import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentSubscription,
  fetchSubscriptionCatalog,
  createCheckoutSession,
  confirmCheckoutSession,
  type CatalogPlan,
} from "./subscription.api.ts";
import type { Subscription, SafeCheckoutSession } from "./subscription.types.ts";
import { tokenKeys } from "../token/index.ts";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  current: () => [...subscriptionKeys.all, "me"] as const,
  catalog: () => [...subscriptionKeys.all, "plans"] as const,
};

export const useSubscriptionCatalog = () => {
  return useQuery<CatalogPlan[], Error>({
    queryKey: subscriptionKeys.catalog(),
    queryFn: fetchSubscriptionCatalog,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
};

export const useCurrentSubscription = () => {
  return useQuery<Subscription, Error>({
    queryKey: subscriptionKeys.current(),
    queryFn: fetchCurrentSubscription,
    staleTime: 0,
    retry: 1,
  });
};

export const useCreateCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<SafeCheckoutSession, Error, "plus" | "pro">({
    mutationFn: (plan: "plus" | "pro") => createCheckoutSession(plan),
    onSuccess: (data, targetPlan) => {
      if (data?.upgradedDirectly) {
        const activePlan = data.plan || targetPlan;
        queryClient.setQueryData(subscriptionKeys.current(), (old: Subscription | undefined) => {
          if (!old) {
            return {
              id: data.id || "direct_upgrade",
              userId: "",
              plan: activePlan,
              status: "active",
              provider: "polar",
              providerSubscriptionId: data.id || null,
              providerProductId: null,
              price: activePlan === "plus" ? 20 : 6,
              currency: "USD",
              tokensPerPeriod: activePlan === "plus" ? 100000 : 50000,
              billingInterval: "month",
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as Subscription;
          }
          return {
            ...old,
            plan: activePlan,
            status: "active",
            price: activePlan === "plus" ? 20 : 6,
            tokensPerPeriod: activePlan === "plus" ? 100000 : 50000,
          };
        });
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        queryClient.invalidateQueries({ queryKey: tokenKeys.all });
        return;
      }
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
};

export const useConfirmCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<Subscription, Error, string>({
    mutationFn: (checkoutId: string) => confirmCheckoutSession(checkoutId),
    onSuccess: (data) => {
      queryClient.setQueryData(subscriptionKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: tokenKeys.all });
    },
  });
};

