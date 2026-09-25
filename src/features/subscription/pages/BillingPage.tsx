import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth.ts";
import {
  useCurrentSubscription,
  useSubscriptionCatalog,
  useCreateCheckout,
  useConfirmCheckout,
} from "../useSubscriptionQueries.ts";
import { PLAN_CONFIGS, ORDERED_PLANS, type PlanConfigItem } from "../plan.config.ts";
import { PlanCard } from "../components/PlanCard.tsx";
import { SuccessCelebrationModal } from "../components/SuccessCelebrationModal.tsx";
import type { SubscriptionPlan } from "../subscription.types.ts";

export const BillingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [selectedTarget, setSelectedTarget] = useState<"plus" | "pro" | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    data: subscription,
    refetch: refetchSubscription,
    isFetching: isFetchingSub,
  } = useCurrentSubscription();

  const { data: catalogPlans } = useSubscriptionCatalog();
  const createCheckoutMutation = useCreateCheckout();
  const confirmCheckoutMutation = useConfirmCheckout();

  // Resolve current active plan from subscription document or user profile (default to 'free')
  const currentPlan: SubscriptionPlan =
    (subscription?.plan as SubscriptionPlan) ||
    (user?.plan as SubscriptionPlan) ||
    "free";

  // Check for Polar checkout return callback
  const isCheckoutSuccess = searchParams.get("checkout") === "success";
  const checkoutId = searchParams.get("checkout_id");

  // Determine if payment is confirmed by backend
  const isConfirmed = currentPlan === "plus" || currentPlan === "pro";

  // Auto-trigger celebratory animation modal on upgrade or return
  useEffect(() => {
    const userIdentifier = user?.id || user?.email;
    if (currentPlan === "free" || !userIdentifier) return;

    const storageKey = `celebrated_${userIdentifier}_${currentPlan}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);

    if (isCheckoutSuccess || !alreadyCelebrated || searchParams.get("celebrate") === "true") {
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [currentPlan, user?.id, user?.email, isCheckoutSuccess, searchParams]);

  const confirmedCheckoutIdRef = useRef<string | null>(null);

  // When checkoutId returns, confirm exactly ONCE via Polar API
  useEffect(() => {
    if (
      checkoutId &&
      isCheckoutSuccess &&
      !isConfirmed &&
      confirmedCheckoutIdRef.current !== checkoutId
    ) {
      confirmedCheckoutIdRef.current = checkoutId;
      confirmCheckoutMutation.mutate(checkoutId, {
        onSuccess: () => {
          refetchSubscription();
          refreshUser?.();
          setShowCelebration(true);
          handleDismissSuccess();
        },
        onError: () => {
          // Even if checkout lookup is delayed or rate-limited, sync local DB state
          refetchSubscription();
          refreshUser?.();
        },
      });
    }
  }, [checkoutId, isCheckoutSuccess, isConfirmed]);

  const handleDismissSuccess = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("checkout");
    nextParams.delete("checkout_id");
    nextParams.delete("celebrate");
    setSearchParams(nextParams, { replace: true });
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    const userIdentifier = user?.id || user?.email;
    if (userIdentifier && currentPlan !== "free") {
      localStorage.setItem(`celebrated_${userIdentifier}_${currentPlan}`, "true");
    }
    handleDismissSuccess();
  };

  const handleUpgrade = async (targetPlan: "plus" | "pro") => {
    setErrorNotice(null);
    setSelectedTarget(targetPlan);

    try {
      const result = await createCheckoutMutation.mutateAsync(targetPlan);
      if (result?.upgradedDirectly) {
        setSelectedTarget(null);
        setShowCelebration(true);
        void Promise.allSettled([
          refetchSubscription(),
          refreshUser?.(),
        ]);
      }
    } catch (err: any) {
      console.error("Failed to initiate checkout:", err);
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to redirect to checkout. Please try again.";
      setErrorNotice(apiMessage);
      setSelectedTarget(null);
    }
  };

  // Merge authoritative backend catalog into PLAN_CONFIGS
  const mergedPlans = useMemo<Record<SubscriptionPlan, PlanConfigItem>>(() => {
    const base = { ...PLAN_CONFIGS };
    if (!catalogPlans || !Array.isArray(catalogPlans)) {
      return base;
    }

    catalogPlans.forEach((remotePlan) => {
      const planId = remotePlan.id as SubscriptionPlan;
      if (planId === "free" || planId === "plus" || planId === "pro") {
        base[planId] = {
          ...base[planId],
          name: remotePlan.name || base[planId].name,
          price: `$${remotePlan.price}`,
          rawPrice: remotePlan.price,
          currency: remotePlan.currency || base[planId].currency,
          interval: remotePlan.interval || base[planId].interval,
          tokens: remotePlan.tokensDisplay || base[planId].tokens,
          description: remotePlan.description || base[planId].description,
          features: remotePlan.features?.length ? remotePlan.features : base[planId].features,
          popular: remotePlan.popular ?? base[planId].popular,
        };
      }
    });

    return base;
  }, [catalogPlans]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/60 select-text">
      {/* Animated Post-Checkout Celebration Modal & Confetti */}
      {showCelebration && (currentPlan === "pro" || currentPlan === "plus") && (
        <SuccessCelebrationModal
          plan={currentPlan}
          tokensDisplay={mergedPlans[currentPlan]?.tokens}
          onClose={handleCloseCelebration}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation & Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>

          {/* Active status indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Your current plan:</span>
            <span className="px-2.5 py-0.5 rounded-md font-bold uppercase text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {currentPlan}
            </span>
            {currentPlan !== "free" && (
              <button
                type="button"
                onClick={() => setShowCelebration(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition-colors cursor-pointer"
                title="View plan perks and celebration"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>View Perks</span>
              </button>
            )}
          </div>
        </div>

        {/* Checkout Return Status Banner */}
        {isCheckoutSuccess && (
          <div
            className={`mb-8 p-4 sm:p-5 rounded-2xl border shadow-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              isConfirmed
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-start gap-3">
              {isConfirmed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isConfirmed
                    ? "Subscription Confirmed!"
                    : "Your payment was received. We're confirming your subscription..."}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                  {isConfirmed
                    ? `Your account has been upgraded to the ${currentPlan.toUpperCase()} plan. Your upgraded token budget is ready.`
                    : "Polar has received your payment. Our webhook is synchronizing your subscription status..."}
                  {checkoutId && (
                    <span className="block mt-1 font-mono text-[11px] opacity-75">
                      Session ID: {checkoutId}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isConfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    refetchSubscription();
                    refreshUser?.();
                  }}
                  disabled={isFetchingSub}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingSub ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDismissSuccess}
                className={`text-xs font-semibold px-2 py-1 cursor-pointer hover:underline ${
                  isConfirmed ? "text-emerald-700" : "text-blue-700"
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorNotice && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{errorNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Header Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Upgrade your plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed">
            Choose the plan that fits your agentic workflow. Unlock higher token allowances,
            priority responses, and intelligent tools.
          </p>

          {/* Segmented Pill Selector: Personal vs Business */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-200/90 mt-6 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "personal"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "business"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Business</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Personal */}
        {activeTab === "personal" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {ORDERED_PLANS.map((planId) => (
              <PlanCard
                key={planId}
                plan={mergedPlans[planId]}
                currentPlan={currentPlan}
                onUpgrade={handleUpgrade}
                isPending={createCheckoutMutation.isPending}
                selectedTarget={selectedTarget}
              />
            ))}
          </div>
        ) : (
          /* Tab Content: Business */
          <div className="max-w-xl mx-auto p-8 sm:p-10 rounded-2xl bg-white border border-slate-200/90 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-4 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3 inline-block">
              Coming Soon
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
              NexaMind for Teams & Enterprise
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              We are finalizing team-wide shared token pools, centralized member management,
              custom role permissions, and enterprise single sign-on.
            </p>
            <button
              type="button"
              disabled
              className="py-2.5 px-6 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs sm:text-sm border border-slate-200 cursor-not-allowed"
            >
              Business Plans Coming Soon
            </button>
          </div>
        )}

        {/* Security & Guarantee Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>Encrypted payment processing handled by Polar</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Cancel anytime from your billing settings</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Instant activation upon confirmation</span>
        </div>
      </div>
    </div>
  );
};
