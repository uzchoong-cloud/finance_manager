import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Transaction, StockHolding, StockWithValue, PortfolioSummary, ExpenseSummary, TransactionCategory, RecurringTransaction } from "@/types";
import { getAllTransactions, getAllStockHoldings, getCachedPrice, setCachedPrice, getAllRecurring } from "@/lib/db";


interface PriceFetchState { [ticker: string]: "idle" | "loading" | "error" }

interface FinanceState {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  recurringLoaded: boolean;
  stockHoldings: StockHolding[];
  stockPrices: Record<string, number>;
  stockCurrencies: Record<string, string>;
  priceFetchState: PriceFetchState;
  transactionsLoaded: boolean;
  holdingsLoaded: boolean;
  selectedMonth: number;
  selectedYear: number;
  loadTransactions: () => Promise<void>;
  loadStockHoldings: () => Promise<void>;
  loadRecurring: () => Promise<void>;
  loadAll: () => Promise<void>;
  setStockPrice: (ticker: string, price: number) => void;
  fetchStockPrices: () => Promise<void>;
  setSelectedPeriod: (year: number, month: number) => void;
  getPortfolioSummary: () => PortfolioSummary;
  getExpenseSummary: () => ExpenseSummary;
  getNetWorth: (startingBalance?: number) => number | null;
  getMonthlyTransactions: () => Transaction[];
}

export const useFinanceStore = create<FinanceState>()(
  subscribeWithSelector((set, get) => ({
    transactions: [],
    recurringTransactions: [],
    recurringLoaded: false,
    stockHoldings: [],
    stockPrices: {},
    stockCurrencies: {},
    priceFetchState: {},
    transactionsLoaded: false,
    holdingsLoaded: false,
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),

    loadTransactions: async () => {
      const transactions = await getAllTransactions();
      set({ transactions, transactionsLoaded: true });
    },

    loadStockHoldings: async () => {
      const stockHoldings = await getAllStockHoldings();
      set({ stockHoldings, holdingsLoaded: true });
    },

    loadRecurring: async () => {
      const recurringTransactions = await getAllRecurring();
      set({ recurringTransactions, recurringLoaded: true });
    },

    loadAll: async () => {
      const { loadTransactions, loadStockHoldings, loadRecurring, fetchStockPrices } = get();
      await Promise.all([loadTransactions(), loadStockHoldings(), loadRecurring()]);
      await fetchStockPrices();
    },

    setStockPrice: (ticker, price) =>
      set((s) => ({ stockPrices: { ...s.stockPrices, [ticker]: price } })),

    fetchStockPrices: async () => {
      const { stockHoldings } = get();
      if (stockHoldings.length === 0) return;
      await Promise.allSettled(
        stockHoldings.map(async ({ ticker }) => {
          set((s) => ({ priceFetchState: { ...s.priceFetchState, [ticker]: "loading" } }));
          const cached = getCachedPrice(ticker);
          if (cached !== null) {
            set((s) => ({
              stockPrices: { ...s.stockPrices, [ticker]: cached.price },
              stockCurrencies: { ...s.stockCurrencies, [ticker]: cached.currency },
              priceFetchState: { ...s.priceFetchState, [ticker]: "idle" },
            }));
            return;
          }
          try {
            const res = await fetch(`/api/price?ticker=${encodeURIComponent(ticker)}`);
            if (!res.ok) throw new Error();
            const { price, currency } = (await res.json()) as { price: number; currency: string };
            setCachedPrice(ticker, price, currency);
            set((s) => ({
              stockPrices: { ...s.stockPrices, [ticker]: price },
              stockCurrencies: { ...s.stockCurrencies, [ticker]: currency },
              priceFetchState: { ...s.priceFetchState, [ticker]: "idle" },
            }));
          } catch {
            set((s) => ({ priceFetchState: { ...s.priceFetchState, [ticker]: "error" } }));
          }
        })
      );
    },

    setSelectedPeriod: (year, month) => set({ selectedYear: year, selectedMonth: month }),

    getMonthlyTransactions: () => {
      const { transactions, selectedYear, selectedMonth } = get();
      const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
      return transactions.filter((t) => t.date.startsWith(prefix));
    },

    getExpenseSummary: (): ExpenseSummary => {
      const monthly = get().getMonthlyTransactions();
      const byCategory = {} as Record<TransactionCategory, number>;
      let totalIncome = 0, totalExpenses = 0;
      for (const t of monthly) {
        if (t.type === "income") totalIncome += t.amount;
        else { totalExpenses += t.amount; byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount; }
      }
      return { totalIncome, totalExpenses, netCashFlow: totalIncome - totalExpenses, byCategory };
    },

    getPortfolioSummary: (): PortfolioSummary => {
      const { stockHoldings, stockPrices, stockCurrencies } = get();
      const holdings: StockWithValue[] = stockHoldings.map((h) => {
        // Infer currency: prefer fetched value, fall back to KRW for 6-digit tickers
        const currency = stockCurrencies[h.ticker] ?? (/^\d{6}$/.test(h.ticker) ? "KRW" : "USD");
        const currentPrice = stockPrices[h.ticker] ?? null;
        const costBasis = h.shares * h.averageCostPerShare;
        const currentValue = currentPrice !== null ? currentPrice * h.shares : null;
        const gainLoss = currentValue !== null ? currentValue - costBasis : null;
        const gainLossPercent = gainLoss !== null && costBasis > 0 ? (gainLoss / costBasis) * 100 : null;
        return { ...h, currentPrice, currentValue, costBasis, gainLoss, gainLossPercent, currency };
      });
      const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
      const hasAllPrices = holdings.length > 0 && holdings.every((h) => h.currentValue !== null);
      // Only sum totals when all holdings share the same currency (mixing USD + KRW is meaningless)
      const currencies = [...new Set(holdings.map((h) => h.currency))];
      const mixedCurrencies = currencies.length > 1;
      const totalValue = hasAllPrices && !mixedCurrencies
        ? holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0)
        : null;
      const totalGainLoss = totalValue !== null ? totalValue - totalCostBasis : null;
      const totalGainLossPercent = totalGainLoss !== null && totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : null;
      return { totalValue, totalCostBasis, totalGainLoss, totalGainLossPercent, holdings, mixedCurrencies };
    },

    getNetWorth: (startingBalance = 0): number | null => {
      const { transactions } = get();
      const { totalValue, mixedCurrencies } = get().getPortfolioSummary();
      const cashBalance = transactions.reduce((sum, t) => t.type === "income" ? sum + t.amount : sum - t.amount, 0);
      // Can't compute a single net worth figure when portfolio spans multiple currencies
      if (mixedCurrencies || totalValue === null) return null;
      return startingBalance + cashBalance + totalValue;
    },
  }))
);
