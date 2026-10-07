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

  const getCardBorderAndHoverClass = () => {
    if (isCurrentPlan) {
      return "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-1";
    }
    if (plan.id === "plus") {
      return "border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1";
    }
    if (plan.id === "pro") {
      return "border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-900 dark:hover:border-slate-400 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1";
    }
    return "border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-1";
  };

  return (
    <div
      className={`group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 transition-all duration-300 ease-out border ${getCardBorderAndHoverClass()}`}
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-slate-800 dark:bg-slate-700 text-white shadow-xs">
            Current plan
          </span>
        )}
      </div>

      {/* Header & Pricing */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {plan.name}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 min-h-[38px] leading-relaxed">
          {plan.description}
        </p>

        {/* Pricing Display */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {plan.price}
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {plan.interval}
          </span>
        </div>

        <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mb-6">
          {plan.tokens}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            if (plan.id === "plus" || plan.id === "pro") {
              onUpgrade(plan.id);
            }
          }}
          disabled={isButtonDisabled}
          className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
            isCurrentPlan
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
              : isLowerTier
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              : plan.popular
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30"
              : "bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white shadow-sm"
          }`}
        >
          {isTargetingThis && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{getButtonText()}</span>
        </button>
      </div>

      {/* Feature Checklist */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 mb-3 uppercase tracking-wider">
          Included features:
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
