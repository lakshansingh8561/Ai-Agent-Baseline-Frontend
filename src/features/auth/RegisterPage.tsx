import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.ts";
import { AxiosError } from "axios";
import type { ApiErrorResponse } from "../../types/auth.ts";
import { BrainCircuit, User as UserIcon, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
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

    const clientErrors: Record<string, string[]> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      clientErrors.name = ["Full name must be at least 2 characters"];
    }
    if (!trimmedEmail) {
      clientErrors.email = ["Email address is required"];
    }
    if (!password || password.length < 8) {
      clientErrors.password = ["Password must be at least 8 characters"];
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Account created successfully. Please sign in.",
          email: trimmedEmail,
        },
      });
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const errorData = error.response.data as ApiErrorResponse;
        if (error.response.status === 409) {
          setErrorMessage("Email is already registered. Please sign in or use another email.");
        } else if (errorData?.message) {
          setErrorMessage(errorData.message);
        } else {
          setErrorMessage("Registration failed. Please verify your details and try again.");
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

  const isPasswordLengthValid = password.length >= 8;
  const isNameValid = name.trim().length >= 2;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner ring-1 ring-indigo-500/20">
          <BrainCircuit className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Create an Account</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
          Get started with NexaMind to experience intelligent autonomous AI workflows
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
              <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Jane Doe"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-50 transition-all ${
                    fieldErrors.name ? "border-rose-500/80" : "border-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>
              {fieldErrors.name ? (
                <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.name[0]}</p>
              ) : name && !isNameValid ? (
                <p className="mt-1.5 text-xs text-slate-400">At least 2 characters required</p>
              ) : null}
            </div>

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
                <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.email[0]}</p>
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="At least 8 characters"
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
              {fieldErrors.password ? (
                <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.password[0]}</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 transition-colors ${
                      isPasswordLengthValid ? "text-emerald-400" : "text-slate-600"
                    }`}
                  />
                  <span className={isPasswordLengthValid ? "text-emerald-400" : "text-slate-400"}>
                    Must be at least 8 characters
                  </span>
                </div>
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
