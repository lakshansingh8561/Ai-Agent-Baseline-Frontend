import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../features/auth/AuthContext.tsx";
import { ThemeProvider } from "../lib/theme.tsx";
import { ModelProvider } from "../features/chat/context/ModelContext.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ModelProvider>{children}</ModelProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
