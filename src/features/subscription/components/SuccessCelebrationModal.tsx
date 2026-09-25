import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, Zap, ArrowRight, X, Bot, Crown } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import type { SubscriptionPlan } from "../subscription.types";

interface SuccessCelebrationModalProps {
  plan: SubscriptionPlan;
  tokensDisplay?: string;
  onClose: () => void;
}

export const SuccessCelebrationModal: React.FC<SuccessCelebrationModalProps> = ({
  plan,
  tokensDisplay = plan === "plus" ? "100,000 tokens / month" : "50,000 tokens / month",
  onClose,
}) => {
  const navigate = useNavigate();
  const planTitle = plan === "plus" ? "Plus" : plan === "pro" ? "Pro" : "Premium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-300">
      <ConfettiCanvas durationMs={4500} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 ring-1 ring-slate-900/10 animate-in zoom-in-95 duration-300 z-10 text-center">
        {/* Top vibrant brand gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-indigo-600 to-purple-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close celebration modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Icon Avatar */}
        <div className="mx-auto mb-5 relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 opacity-20 blur-lg animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50">
            {plan === "plus" ? (
              <Crown className="w-10 h-10 text-amber-300 animate-bounce" />
            ) : (
              <Sparkles className="w-10 h-10 text-white animate-bounce" />
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Payment Confirmed</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Welcome to {planTitle}!
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Your account is now upgraded. You have unlocked enhanced AI performance and higher token allowances.
        </p>

        {/* Plan Perk Highlights Card */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Tier
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
              {planTitle} Plan
            </span>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
            <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{tokensDisplay}</p>
              <p className="text-[11px] text-slate-500">Instant monthly token allocation ready for use</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Priority AI Generation Queue</p>
              <p className="text-[11px] text-slate-500">Ultra-fast responses & full context memory retention</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/app");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Stay on Billing
          </button>
        </div>
      </div>
    </div>
  );
};
