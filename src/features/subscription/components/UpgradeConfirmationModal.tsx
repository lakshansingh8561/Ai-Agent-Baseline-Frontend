import { Crown, Sparkles, Zap, ShieldCheck, X, Loader2, Check } from "lucide-react";

interface UpgradeConfirmationModalProps {
  isOpen: boolean;
  targetPlan: "plus" | "pro";  
  isLoading: boolean;
  onConfirm: () => void;      
  onClose: () => void;
}    

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({    
  isOpen,
  targetPlan,      
  isLoading,   
  onConfirm,     
  onClose,     
}) => {
  if (!isOpen) return null;

  const isPlus = targetPlan === "plus";
  const newPrice = isPlus ? "$20" : "$6";
  const newTokens = isPlus ? "100,000" : "50,000";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 ring-1 ring-slate-900/10 animate-in zoom-in-95 duration-200 z-10 text-center">
        {/* Top vibrant brand gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-indigo-600 to-purple-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close upgrade confirmation"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Badge & Avatar */}
        <div className="mx-auto mb-4 relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-purple-500 opacity-25 blur-md animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50">
            {isPlus ? (
              <Crown className="w-8 h-8 text-amber-300" />
            ) : (
              <Sparkles className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Plan Upgrade Confirmation</span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Upgrade to {isPlus ? "Plus Plan" : "Pro Plan"}?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
          Unlock higher AI capabilities and double your monthly generation budget.
        </p>

        {/* Plan Comparison & Proration Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Target Plan
              </p>
              <p className="text-base font-bold text-slate-900">
                {isPlus ? "Plus Tier" : "Pro Tier"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-indigo-600 tracking-tight">
                {newPrice} <span className="text-xs font-normal text-slate-500">/ month</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Prorated difference</p>
            </div>
          </div>

          {/* Perks list */}
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span className="font-semibold text-slate-800">{newTokens} monthly tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Highest priority model generation queue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>Full conversational context memory depth</span>
            </div>
          </div>

          {/* Proration Explanation */}
          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 flex items-start gap-2.5 text-[11px] text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="leading-tight">
              Polar will automatically charge your card on file for the prorated difference for the remaining days of your billing cycle. You do not need to re-enter your card details.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Upgrade with Polar...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Confirm & Upgrade ({newPrice}/mo)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto py-3 px-4 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
