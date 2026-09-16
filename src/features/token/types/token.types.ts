export interface TokenBalance {
  balance: number;
  totalAllocated: number;
  totalUsed: number;
  reservedTokens: number;
}

export interface TokenBalanceResponse {
  success: boolean;
  message?: string;
  data: TokenBalance;
}
