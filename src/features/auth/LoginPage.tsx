import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.ts";
import { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../types/auth.ts";
import { BrainCircuit, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: ["Email address is required"] });
      return;
    }
    if (!password) {
      setFieldErrors({ password: ["Password is required"] });
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: trimmedEmail, password });
      navigate("/app", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const errorData = error.response.data as ApiErrorResponse;
        if (errorData?.message) {
          setErrorMessage(errorData.message);
        } else if (error.response.status === 401) {
          setErrorMessage("Invalid email or password. Please check your credentials.");
        } else if (error.response.status === 403) {
          setErrorMessage("User account is inactive. Please contact support.");
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }

        if (errorData?.errors?.fieldErrors) {
          setFieldErrors(errorData.errors.fieldErrors);
        }
      } else {
        setErrorMessage("Network error: unable to reach the server. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner ring-1 ring-indigo-500/20">
          <BrainCircuit className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">NexaMind</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
          Sign in to access your intelligent AI workspaces and conversation history
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 py-8 px-5 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-50 transition-all ${
                    fieldErrors.email ? "border-rose-500/80" : "border-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  {fieldErrors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-50 transition-all ${
                    fieldErrors.password ? "border-rose-500/80" : "border-slate-800 focus:border-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
