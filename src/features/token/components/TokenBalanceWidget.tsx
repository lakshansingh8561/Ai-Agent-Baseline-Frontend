import React from "react";
import { Coins, AlertCircle, RefreshCw } from "lucide-react";
import { useTokenBalance } from "../hooks/useTokenQueries.ts";

export const TokenBalanceWidget: React.FC = () => {
  const { data: balanceData, isLoading, error, refetch, isFetching } = useTokenBalance();

  if (isLoading) {
    return (
      <div className="mx-3 my-1.5 p-3 rounded-xl bg-slate-200/50 border border-slate-200/80 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-16 bg-slate-300/70 rounded" />
          <div className="h-3 w-20 bg-slate-300/70 rounded" />
        </div>
        <div className="h-1.5 w-full bg-slate-300/70 rounded-full" />
      </div>
    );
  }

  if (error || !balanceData) {
    return (
      <div className="mx-3 my-1.5 p-2.5 rounded-xl bg-slate-200/40 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-[11px]">Tokens unavailable</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-indigo-600 hover:text-indigo-700 p-1 cursor-pointer transition-colors"
          title="Retry loading tokens"
          aria-label="Retry loading tokens"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
  }

  const { balance, totalAllocated } = balanceData;

  // Safe percentage calculation handling 0 totalAllocated and bounds
  const percentage =
    totalAllocated > 0
      ? Math.max(0, Math.min(100, (balance / totalAllocated) * 100))
      : 0;

  const isExhausted = balance <= 0;
  const isLow = !isExhausted && percentage <= 20;

  return (
    <div className="mx-3 my-1.5 p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">Tokens</span>
        </div>

        {isExhausted ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Exhausted
          </span>
        ) : isLow ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Low
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight tabular-nums">
          {balance.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400 tabular-nums">
          / {totalAllocated.toLocaleString()}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isExhausted
              ? "bg-rose-500"
              : isLow
              ? "bg-amber-500"
              : "bg-indigo-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Exhaustion Notice */}
      {isExhausted && (
        <p className="mt-1.5 text-[10px] text-rose-600 leading-tight">
          No remaining tokens. Requests will be paused until allocation refreshes.
        </p>
      )}
    </div>
  );
};
