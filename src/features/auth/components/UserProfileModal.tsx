import React from "react";
import { useAuth } from "../useAuth.ts";
import { useTokenBalance } from "../../token/hooks/useTokenQueries.ts";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Coins,
  Sparkles,
  LogOut,
  X,
  CreditCard,
  CheckCircle,
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const { data: tokenData } = useTokenBalance();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isPro = user?.plan === "pro";
  const balance = tokenData?.balance ?? 0;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#383838] p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-slate-800 dark:text-[#ececec]">
              Account & Profile
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#282828] border border-slate-200/80 dark:border-[#383838]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-[#ececec] truncate">
              {user?.name || "Developer"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#b4b4b4] truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{user?.email}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isPro
                    ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : "bg-slate-200 dark:bg-[#212121] text-slate-700 dark:text-[#ececec] border border-slate-300 dark:border-[#383838]"
                }`}
              >
                {isPro && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                {user?.plan || "free"} plan
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Token Balance Stats */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#b4b4b4] font-medium">
                Available Token Balance
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-[#ececec] tabular-nums">
                {balance.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-400 dark:text-[#737373]">tokens</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/app/billing");
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#212121] hover:bg-slate-50 dark:hover:bg-[#303030] text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-[#383838] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Top up
          </button>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/app/billing");
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-semibold text-slate-800 dark:text-[#ececec] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-violet-500" />
              <span>Subscription & Billing Details</span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
              Manage →
            </span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-semibold text-slate-800 dark:text-[#ececec] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>AI Preferences & Custom Instructions</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-[#737373]">Settings →</span>
            </button>
          )}
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#2d2d2d]">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out of account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
