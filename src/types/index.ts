export type TransactionType = "expense" | "income";

export type TransactionCategory =
  | "food" | "transport" | "housing" | "utilities" | "healthcare"
  | "entertainment" | "shopping" | "education" | "salary"
  | "investment" | "freelance" | "other";

export interface Transaction {
  id?: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  createdAt: number;
}

export type StockTransactionType = "buy" | "sell";

export interface StockHolding {
  id?: string;
  userId?: string;
  ticker: string;
  name: string;
  shares: number;
  averageCostPerShare: number;
  createdAt: number;
  updatedAt: number;
}

export interface StockTransaction {
  id?: string;
  userId?: string;
  holdingId: string;
  ticker: string;
  type: StockTransactionType;
  shares: number;
  pricePerShare: number;
  date: string;
  notes?: string;
  createdAt: number;
}

export interface StockWithValue extends StockHolding {
  currentPrice: number | null;
  currentValue: number | null;
  costBasis: number;
  gainLoss: number | null;
  gainLossPercent: number | null;
}

export interface PortfolioSummary {
  totalValue: number | null;
  totalCostBasis: number;
  totalGainLoss: number | null;
  totalGainLossPercent: number | null;
  holdings: StockWithValue[];
}

export interface ExpenseSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  byCategory: Record<TransactionCategory, number>;
}

export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  language: "en" | "ko";
  currency: "USD" | "KRW" | "HKD";
  startingBalance: number;
}
