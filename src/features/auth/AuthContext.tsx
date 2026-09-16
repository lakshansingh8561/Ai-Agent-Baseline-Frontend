import React, { useEffect, useState, useCallback } from "react";
import type { User, LoginCredentials, RegisterData, AuthResponse, CurrentUserResponse } from "../../types/auth.ts";
import { AuthContext, type AuthContextType } from "./AuthContextType.ts";
import { api } from "../../lib/api.ts";
import { getStoredToken, setStoredToken, removeStoredToken } from "../../lib/token.ts";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Bootstrap session on startup
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.get<CurrentUserResponse>("/api/auth/me");
        if (isMounted) {
          setUser(response.data.data.user);
          setToken(storedToken);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Session bootstrap failed; clearing stale token:", error);
        removeStoredToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const response = await api.post<AuthResponse>("/api/auth/login", credentials);
    const { token: newToken, user: newUser } = response.data.data;
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    // Register the account, but DO NOT store the token and DO NOT establish an authenticated session
    await api.post<AuthResponse>("/api/auth/register", data);
  }, []);


  const logout = useCallback((): void => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
