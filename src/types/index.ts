export type TransactionType = "expense" | "income";

/** Kept as string so user-defined category keys (UUIDs) work alongside built-in keys */
export type TransactionCategory = string;

export interface Category {
  id?: string;
  userId?: string;
  key: string;       // stored in transactions.category — stable even if label changes
  label: string;     // display name, user-editable
  color: string;     // hex e.g. "#533afd"
  sortOrder: number;
}

export interface Transaction {
  id?: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  notes?: string;
  date: string;
  createdAt: number;
}

export type RecurringFrequency = "weekly" | "monthly";

export interface RecurringTransaction {
  id?: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  dayOfMonth: number | null;
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
  /** Currency of this holding's prices (e.g. "KRW", "USD") */
  currency: string;
}

export interface PortfolioSummary {
  totalValue: number | null;
  totalCostBasis: number;
  totalGainLoss: number | null;
  totalGainLossPercent: number | null;
  holdings: StockWithValue[];
  /** True when holdings span multiple currencies — totals cannot be meaningfully summed */
  mixedCurrencies: boolean;
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
  monthlyBudget: number | null;
}
