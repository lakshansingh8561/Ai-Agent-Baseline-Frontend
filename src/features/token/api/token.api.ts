import { api } from "../../../lib/api.ts";
import type { TokenBalance, TokenBalanceResponse } from "../types/token.types.ts";

export const fetchTokenBalance = async (): Promise<TokenBalance> => {
  const response = await api.get<TokenBalanceResponse>("/api/tokens/balance");
  return response.data.data;
};
