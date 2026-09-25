import React from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { PlanConfigItem } from "../plan.config.ts";
import type { SubscriptionPlan } from "../subscription.types.ts";

interface PlanCardProps {
  plan: PlanConfigItem;
  currentPlan: SubscriptionPlan;
  onUpgrade: (planId: "plus" | "pro") => void;
  isPending: boolean;
  selectedTarget: "plus" | "pro" | null;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlan,
  onUpgrade,
  isPending,
  selectedTarget,
}) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isTargetingThis = isPending && selectedTarget === plan.id;

  // Strict hierarchy: free (0) < pro (1) < plus (2)
  const planWeights: Record<SubscriptionPlan, number> = {
    free: 0,
    pro: 1,
    plus: 2,
  };

  const isLowerTier = planWeights[plan.id] < planWeights[currentPlan];

  const getButtonText = () => {
    if (isTargetingThis) return "Creating checkout...";
    if (isCurrentPlan) return "Current plan";
    if (isLowerTier) return "Included in your plan";
    if (plan.id === "plus") return "Upgrade to Plus";
    if (plan.id === "pro") return "Upgrade to Pro";
    return "Select plan";
  };

  const isButtonDisabled = isCurrentPlan || isLowerTier || isPending;

  // Dynamic card hover accent tailored per plan, with NO permanently stuck border
  const getCardBorderAndHoverClass = () => {
    if (isCurrentPlan) {
      return "border-slate-300 bg-slate-50/40 shadow-xs hover:border-slate-400 hover:shadow-md hover:-translate-y-1";
    }
    if (plan.id === "plus") {
      return "border-slate-200/90 shadow-xs hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1";
    }
    if (plan.id === "pro") {
      return "border-slate-200/90 shadow-xs hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1";
    }
    return "border-slate-200/90 shadow-xs hover:border-slate-400 hover:shadow-md hover:-translate-y-1";
  };

  return (
    <div
      className={`group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-white transition-all duration-300 ease-out border ${getCardBorderAndHoverClass()}`}
    >
      {/* Top Badges */}
      <div className="absolute -top-3 left-6 flex items-center gap-2">
        {plan.popular && !isCurrentPlan && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3 h-3" />
            Popular
          </span>
        )}
        {isCurrentPlan && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-slate-800 text-white shadow-xs">
            Current plan
          </span>
        )}
      </div>

      {/* Header & Pricing */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {plan.name}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mb-5 min-h-[38px] leading-relaxed">
          {plan.description}
        </p>

        {/* Pricing Display */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {plan.price}
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-500">
            {plan.interval}
          </span>
        </div>

        <p className="text-[11px] font-medium text-indigo-600 mb-6">
          {plan.tokens}
        </p>

        {/* Action Button */}
        <button
          type="button"
          disabled={isButtonDisabled}
          onClick={() => {
            if (plan.id === "plus" || plan.id === "pro") {
              onUpgrade(plan.id);
            }
          }}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 select-none ${
            isCurrentPlan
              ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
              : isLowerTier
              ? "bg-slate-50 text-slate-400 border border-slate-200/60 cursor-not-allowed"
              : plan.id === "plus"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
              : plan.id === "pro"
              ? "bg-slate-900 hover:bg-black text-white shadow-xs active:scale-[0.99] cursor-pointer"
              : "bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
          } ${isPending && isTargetingThis ? "opacity-90 cursor-wait" : isPending ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isTargetingThis && (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          )}
          <span>{getButtonText()}</span>
        </button>
      </div>

      {/* Feature Section Divider & List */}
      <div className="mt-7 pt-6 border-t border-slate-100 flex-1 flex flex-col justify-start">
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3.5">
          What&apos;s included
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-snug">
              <div className="p-0.5 rounded-full bg-emerald-50 text-emerald-600 mt-0.5 flex-shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
