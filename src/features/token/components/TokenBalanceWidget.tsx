import React from "react";
import { Coins, AlertCircle, RefreshCw } from "lucide-react";
import { useTokenBalance } from "../hooks/useTokenQueries.ts";

export const TokenBalanceWidget: React.FC = () => {
  const { data: balanceData, isLoading, error, refetch, isFetching } = useTokenBalance();

  if (isLoading) {
    return (
      <div className="mx-3 my-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-3 w-20 bg-slate-800 rounded" />
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full" />
      </div>
    );
  }

  if (error || !balanceData) {
    return (
      <div className="mx-3 my-1.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[11px]">Tokens unavailable</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-indigo-400 hover:text-indigo-300 p-1 cursor-pointer transition-colors"
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
    <div className="mx-3 my-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-xs">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Tokens</span>
        </div>

        {isExhausted ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Exhausted
          </span>
        ) : isLow ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Low
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight tabular-nums">
          {balance.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400 tabular-nums">
          / {totalAllocated.toLocaleString()}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isExhausted
              ? "bg-rose-500"
              : isLow
              ? "bg-amber-500"
              : "bg-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Exhaustion Notice */}
      {isExhausted && (
        <p className="mt-1.5 text-[10px] text-rose-400 leading-tight">
          No remaining tokens. Requests will be paused until allocation refreshes.
        </p>
      )}
    </div>
  );
};
