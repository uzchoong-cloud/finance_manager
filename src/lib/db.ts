import Dexie, { type EntityTable } from "dexie";
import type {
  Transaction,
  StockHolding,
  StockTransaction,
  PriceCache,
} from "@/types";

class FinanceDatabase extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  stockHoldings!: EntityTable<StockHolding, "id">;
  stockTransactions!: EntityTable<StockTransaction, "id">;
  priceCache!: EntityTable<PriceCache, "ticker">;

  constructor() {
    super("FinanceManagerDB");

    this.version(1).stores({
      // transactions: indexed by date, type, category for common queries
      transactions: "++id, date, type, category, createdAt",
      // stockHoldings: indexed by ticker (unique)
      stockHoldings: "++id, &ticker, updatedAt",
      // stockTransactions: linked to holding, indexed by date
      stockTransactions: "++id, holdingId, ticker, date, type, createdAt",
      // priceCache: keyed by ticker, fetch timestamp for expiry checks
      priceCache: "ticker, fetchedAt",
    });
  }
}

export const db = new FinanceDatabase();

// ─── Transaction CRUD ─────────────────────────────────────────────

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt">
): Promise<number> {
  const id = await db.transactions.add({ ...data, createdAt: Date.now() });
  return id as number;
}

export async function updateTransaction(
  id: number,
  data: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<void> {
  await db.transactions.update(id, data);
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.transactions.delete(id);
}

export async function getTransactionsByDateRange(
  from: string,
  to: string
): Promise<Transaction[]> {
  return db.transactions
    .where("date")
    .between(from, to, true, true)
    .sortBy("date");
}

export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<Transaction[]> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-31`;
  return getTransactionsByDateRange(from, to);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy("date").reverse().toArray();
}

// ─── Stock Holdings CRUD ──────────────────────────────────────────

export async function addStockHolding(
  ticker: string,
  name: string,
  shares: number,
  pricePerShare: number,
  date: string
): Promise<number> {
  const now = Date.now();
  const holdingId = (await db.stockHoldings.add({
    ticker: ticker.toUpperCase(),
    name,
    shares,
    averageCostPerShare: pricePerShare,
    createdAt: now,
    updatedAt: now,
  })) as number;
  await db.stockTransactions.add({
    holdingId,
    ticker: ticker.toUpperCase(),
    type: "buy",
    shares,
    pricePerShare,
    date,
    createdAt: now,
  });
  return holdingId;
}

export async function buyShares(
  holdingId: number,
  shares: number,
  pricePerShare: number,
  date: string,
  notes?: string
): Promise<void> {
  const holding = await db.stockHoldings.get(holdingId);
  if (!holding) throw new Error(`Holding ${holdingId} not found`);

  // Weighted average cost basis
  const totalShares = holding.shares + shares;
  const newAvgCost =
    (holding.shares * holding.averageCostPerShare + shares * pricePerShare) /
    totalShares;

  const now = Date.now();
  await db.stockHoldings.update(holdingId, {
    shares: totalShares,
    averageCostPerShare: newAvgCost,
    updatedAt: now,
  });
  await db.stockTransactions.add({
    holdingId,
    ticker: holding.ticker,
    type: "buy",
    shares,
    pricePerShare,
    date,
    notes,
    createdAt: now,
  });
}

export async function sellShares(
  holdingId: number,
  shares: number,
  pricePerShare: number,
  date: string,
  notes?: string
): Promise<void> {
  const holding = await db.stockHoldings.get(holdingId);
  if (!holding) throw new Error(`Holding ${holdingId} not found`);
  if (shares > holding.shares)
    throw new Error("Cannot sell more shares than held");

  const remainingShares = holding.shares - shares;
  const now = Date.now();

  if (remainingShares === 0) {
    await db.stockHoldings.delete(holdingId);
  } else {
    // Cost basis unchanged on sell (FIFO average)
    await db.stockHoldings.update(holdingId, {
      shares: remainingShares,
      updatedAt: now,
    });
  }

  await db.stockTransactions.add({
    holdingId,
    ticker: holding.ticker,
    type: "sell",
    shares,
    pricePerShare,
    date,
    notes,
    createdAt: now,
  });
}

export async function deleteStockHolding(holdingId: number): Promise<void> {
  await db.transaction("rw", db.stockHoldings, db.stockTransactions, async () => {
    await db.stockTransactions.where("holdingId").equals(holdingId).delete();
    await db.stockHoldings.delete(holdingId);
  });
}

export async function getAllStockHoldings(): Promise<StockHolding[]> {
  return db.stockHoldings.orderBy("ticker").toArray();
}

export async function getStockTransactions(
  holdingId: number
): Promise<StockTransaction[]> {
  return db.stockTransactions
    .where("holdingId")
    .equals(holdingId)
    .sortBy("date");
}

// ─── Price Cache ──────────────────────────────────────────────────

const PRICE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCachedPrice(ticker: string): Promise<number | null> {
  const cached = await db.priceCache.get(ticker.toUpperCase());
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt > PRICE_CACHE_TTL_MS) return null;
  return cached.price;
}

export async function setCachedPrice(
  ticker: string,
  price: number
): Promise<void> {
  await db.priceCache.put({
    ticker: ticker.toUpperCase(),
    price,
    fetchedAt: Date.now(),
  });
}
