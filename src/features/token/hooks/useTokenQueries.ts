import { useQuery } from "@tanstack/react-query";
import { fetchTokenBalance } from "../api/token.api.ts";
import type { TokenBalance } from "../types/token.types.ts";

export const tokenKeys = {
  all: ["tokens"] as const,
  balance: () => [...tokenKeys.all, "balance"] as const,
};

export const useTokenBalance = () => {
  return useQuery<TokenBalance, Error>({
    queryKey: tokenKeys.balance(),
    queryFn: fetchTokenBalance,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
};
