export type TransactionType = "expense" | "income";

export type TransactionCategory =
  | "food"
  | "transport"
  | "housing"
  | "utilities"
  | "healthcare"
  | "entertainment"
  | "shopping"
  | "education"
  | "salary"
  | "investment"
  | "freelance"
  | "other";

export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: number; // Unix timestamp ms
}

export type StockTransactionType = "buy" | "sell";

export interface StockHolding {
  id?: number;
  ticker: string;
  name: string;
  shares: number;
  averageCostPerShare: number; // weighted average cost basis
  createdAt: number;
  updatedAt: number;
}

export interface StockTransaction {
  id?: number;
  holdingId: number;
  ticker: string;
  type: StockTransactionType;
  shares: number;
  pricePerShare: number;
  date: string; // ISO date string YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface PriceCache {
  ticker: string;
  price: number;
  fetchedAt: number; // Unix timestamp ms
}

// Derived / computed types
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
