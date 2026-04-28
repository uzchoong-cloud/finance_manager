import { supabase } from "./supabase";
import type { Transaction, StockHolding, StockTransaction } from "@/types";

// ─── Transactions ─────────────────────────────────────────────

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "userId">
): Promise<void> {
  const { error } = await supabase.from("transactions").insert({
    type: data.type, amount: data.amount, category: data.category,
    description: data.description, date: data.date,
  });
  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTransaction);
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string, userId: row.user_id as string,
    type: row.type as Transaction["type"], amount: Number(row.amount),
    category: row.category as Transaction["category"],
    description: row.description as string, date: row.date as string,
    createdAt: new Date(row.created_at as string).getTime(),
  };
}

// ─── Stock Holdings ───────────────────────────────────────────

export async function addStockHolding(
  ticker: string, name: string, shares: number, pricePerShare: number, date: string
): Promise<string> {
  const { data: holding, error: holdingErr } = await supabase
    .from("stock_holdings")
    .insert({ ticker: ticker.toUpperCase(), name, shares, average_cost_per_share: pricePerShare })
    .select().single();
  if (holdingErr) throw new Error(holdingErr.message);
  const { error: txErr } = await supabase.from("stock_transactions").insert({
    holding_id: holding.id, ticker: ticker.toUpperCase(),
    type: "buy", shares, price_per_share: pricePerShare, date,
  });
  if (txErr) throw new Error(txErr.message);
  return holding.id as string;
}

export async function buyShares(
  holdingId: string, shares: number, pricePerShare: number, date: string, notes?: string
): Promise<void> {
  const { data: h, error } = await supabase
    .from("stock_holdings").select("shares, average_cost_per_share, ticker").eq("id", holdingId).single();
  if (error || !h) throw new Error("Holding not found");
  const totalShares = Number(h.shares) + shares;
  const newAvg = (Number(h.shares) * Number(h.average_cost_per_share) + shares * pricePerShare) / totalShares;
  await supabase.from("stock_holdings")
    .update({ shares: totalShares, average_cost_per_share: newAvg, updated_at: new Date().toISOString() })
    .eq("id", holdingId);
  await supabase.from("stock_transactions").insert({
    holding_id: holdingId, ticker: h.ticker, type: "buy", shares, price_per_share: pricePerShare, date, notes,
  });
}

export async function sellShares(
  holdingId: string, shares: number, pricePerShare: number, date: string, notes?: string
): Promise<void> {
  const { data: h, error } = await supabase
    .from("stock_holdings").select("shares, ticker").eq("id", holdingId).single();
  if (error || !h) throw new Error("Holding not found");
  if (shares > Number(h.shares)) throw new Error("Cannot sell more shares than held");
  const remaining = Number(h.shares) - shares;
  if (remaining === 0) {
    await deleteStockHolding(holdingId);
  } else {
    await supabase.from("stock_holdings")
      .update({ shares: remaining, updated_at: new Date().toISOString() }).eq("id", holdingId);
  }
  await supabase.from("stock_transactions").insert({
    holding_id: holdingId, ticker: h.ticker, type: "sell", shares, price_per_share: pricePerShare, date, notes,
  });
}

export async function deleteStockHolding(holdingId: string): Promise<void> {
  const { error } = await supabase.from("stock_holdings").delete().eq("id", holdingId);
  if (error) throw new Error(error.message);
}

export async function getAllStockHoldings(): Promise<StockHolding[]> {
  const { data, error } = await supabase.from("stock_holdings").select("*").order("ticker");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string, userId: row.user_id as string,
    ticker: row.ticker as string, name: row.name as string,
    shares: Number(row.shares), averageCostPerShare: Number(row.average_cost_per_share),
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }));
}

export async function getStockTransactions(holdingId: string): Promise<StockTransaction[]> {
  const { data, error } = await supabase
    .from("stock_transactions").select("*").eq("holding_id", holdingId).order("date");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string, userId: row.user_id as string, holdingId: row.holding_id as string,
    ticker: row.ticker as string, type: row.type as StockTransaction["type"],
    shares: Number(row.shares), pricePerShare: Number(row.price_per_share),
    date: row.date as string, notes: row.notes as string | undefined,
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

// ─── Price cache (localStorage, 5 min TTL) ────────────────────
const PRICE_TTL_MS = 5 * 60 * 1000;

export function getCachedPrice(ticker: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`price_${ticker}`);
    if (!raw) return null;
    const { price, fetchedAt } = JSON.parse(raw) as { price: number; fetchedAt: number };
    if (Date.now() - fetchedAt > PRICE_TTL_MS) return null;
    return price;
  } catch { return null; }
}

export function setCachedPrice(ticker: string, price: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`price_${ticker}`, JSON.stringify({ price, fetchedAt: Date.now() }));
}
