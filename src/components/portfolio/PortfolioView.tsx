"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addStockHolding, buyShares, sellShares, deleteStockHolding } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatCurrencyCompact, formatPercent, formatShares, todayISO } from "@/lib/format";
import type { StockHolding } from "@/types";

type DialogMode = "add" | "buy" | "sell";

export function PortfolioView() {
  const [dialogMode, setDialogMode] = useState<DialogMode>("add");
  const [open, setOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<StockHolding | null>(null);
  const [saving, setSaving] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const loadStockHoldings = useFinanceStore((s) => s.loadStockHoldings);
  const fetchStockPrices = useFinanceStore((s) => s.fetchStockPrices);
  const getPortfolioSummary = useFinanceStore((s) => s.getPortfolioSummary);
  const priceFetchState = useFinanceStore((s) => s.priceFetchState);
  const holdingsLoaded = useFinanceStore((s) => s.holdingsLoaded);

  const { totalValue, totalCostBasis, totalGainLoss, totalGainLossPercent, holdings } = getPortfolioSummary();

  const resetForm = () => { setTicker(""); setName(""); setShares(""); setPrice(""); setDate(todayISO()); setNotes(""); setSelectedHolding(null); };

  const openAdd = () => { resetForm(); setDialogMode("add"); setOpen(true); };
  const openBuy = (h: StockHolding) => { resetForm(); setSelectedHolding(h); setDialogMode("buy"); setOpen(true); };
  const openSell = (h: StockHolding) => { resetForm(); setSelectedHolding(h); setDialogMode("sell"); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedShares = parseFloat(shares), parsedPrice = parseFloat(price);
    if (!parsedShares || parsedShares <= 0 || !parsedPrice || parsedPrice <= 0) { toast.error("Enter valid shares and price"); return; }
    setSaving(true);
    try {
      if (dialogMode === "add") {
        if (!ticker.trim() || !name.trim()) { toast.error("Enter ticker and company name"); return; }
        await addStockHolding(ticker.trim(), name.trim(), parsedShares, parsedPrice, date);
        toast.success(`${ticker.toUpperCase()} added to portfolio`);
      } else if (dialogMode === "buy" && selectedHolding?.id) {
        await buyShares(selectedHolding.id, parsedShares, parsedPrice, date, notes || undefined);
        toast.success(`Bought ${parsedShares} shares of ${selectedHolding.ticker}`);
      } else if (dialogMode === "sell" && selectedHolding?.id) {
        await sellShares(selectedHolding.id, parsedShares, parsedPrice, date, notes || undefined);
        toast.success(`Sold ${parsedShares} shares of ${selectedHolding.ticker}`);
      }
      await loadStockHoldings();
      await fetchStockPrices();
      setOpen(false); resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (holdingId: string, ticker: string) => {
    if (!confirm(`Remove ${ticker} and all its transaction history?`)) return;
    await deleteStockHolding(holdingId);
    await loadStockHoldings();
    toast.success(`${ticker} removed`);
  };

  const dialogTitle = dialogMode === "add" ? "Add New Position" : dialogMode === "buy" ? `Buy More ${selectedHolding?.ticker}` : `Sell ${selectedHolding?.ticker}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "#061b31", lineHeight: 1.2 }}>Portfolio</h1>
          <p style={{ fontSize: "14px", color: "#64748d", fontWeight: 300, marginTop: 4, fontFeatureSettings: '"ss01"' }}>Stock holdings & performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStockPrices} variant="outline" style={{ borderRadius: "4px", fontSize: "13px", fontFeatureSettings: '"ss01"', border: "1px solid #e5edf5", color: "#273951" }}>↻ Refresh</Button>
          <Button onClick={openAdd} style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>+ Add Stock</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Portfolio Value" value={totalValue === null ? "Fetching…" : formatCurrencyCompact(totalValue)} subValue={totalValue !== null ? formatCurrency(totalValue) : undefined} trend="neutral" />
        <StatCard label="Cost Basis" value={formatCurrencyCompact(totalCostBasis)} subValue={formatCurrency(totalCostBasis)} trend="neutral" />
        <StatCard label="Total Return" value={totalGainLoss === null ? "—" : `${totalGainLoss >= 0 ? "+" : ""}${formatCurrencyCompact(totalGainLoss)}`} subValue={totalGainLossPercent !== null ? formatPercent(totalGainLossPercent) : undefined} trend={totalGainLoss === null ? "neutral" : totalGainLoss >= 0 ? "up" : "down"} />
      </div>

      {!holdingsLoaded ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "#f0f4f8" }} />)}</div>
      ) : holdings.length === 0 ? (
        <div className="py-16 text-center rounded-lg" style={{ border: "1px dashed #b9b9f9" }}>
          <p style={{ fontSize: "14px", color: "#64748d", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>
            No positions yet.{" "}
            <button onClick={openAdd} style={{ color: "#533afd", background: "none", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>Add your first stock →</button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {holdings.map((h) => {
            const fetchState = priceFetchState[h.ticker];
            const isLoading = fetchState === "loading";
            const isError = fetchState === "error";
            const gainColor = h.gainLoss === null ? "#64748d" : h.gainLoss >= 0 ? "#108c3d" : "#ea2261";
            return (
              <div key={h.id} className="rounded-lg p-4" style={{ background: "#ffffff", border: "1px solid #e5edf5", borderRadius: "6px", boxShadow: "rgba(23,23,23,0.06) 0px 3px 6px" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "15px", fontWeight: 400, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{h.ticker}</span>
                      <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(83,58,253,0.08)", color: "#533afd", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", fontFeatureSettings: '"tnum"' }}>{formatShares(h.shares)} sh</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>{h.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {isLoading ? <div className="h-5 w-20 rounded animate-pulse" style={{ background: "#f0f4f8" }} />
                      : isError ? <span style={{ fontSize: "12px", color: "#ea2261" }}>Price unavailable</span>
                      : h.currentValue !== null ? (
                        <>
                          <p style={{ fontSize: "15px", fontWeight: 400, fontFeatureSettings: '"tnum"', color: "#061b31" }}>{formatCurrency(h.currentValue)}</p>
                          <p style={{ fontSize: "12px", fontFeatureSettings: '"tnum"', color: gainColor }}>
                            {h.gainLoss !== null && h.gainLoss >= 0 ? "+" : ""}{h.gainLoss !== null ? formatCurrency(h.gainLoss) : ""}{h.gainLossPercent !== null ? ` (${formatPercent(h.gainLossPercent)})` : ""}
                          </p>
                        </>
                      ) : <span style={{ fontSize: "12px", color: "#64748d" }}>—</span>}
                  </div>
                </div>
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #e5edf5" }}>
                  <span style={{ fontSize: "12px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                    Avg cost: <span style={{ fontFeatureSettings: '"tnum"', color: "#273951" }}>{formatCurrency(h.averageCostPerShare)}</span>
                    {" · "}Basis: <span style={{ fontFeatureSettings: '"tnum"', color: "#273951" }}>{formatCurrency(h.costBasis)}</span>
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openBuy(h)} style={{ fontSize: "11px", color: "#533afd", background: "rgba(83,58,253,0.06)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>Buy</button>
                    <button onClick={() => openSell(h)} style={{ fontSize: "11px", color: "#273951", background: "rgba(39,57,81,0.06)", border: "1px solid rgba(39,57,81,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>Sell</button>
                    <button onClick={() => h.id && handleDelete(h.id, h.ticker)} style={{ fontSize: "11px", color: "#ea2261", background: "rgba(234,34,97,0.06)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ borderRadius: "8px", border: "1px solid #e5edf5", maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {dialogMode === "add" && (
              <>
                <div className="space-y-1">
                  <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Ticker Symbol</Label>
                  <Input placeholder="AAPL" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
                </div>
                <div className="space-y-1">
                  <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Company Name</Label>
                  <Input placeholder="Apple Inc." value={name} onChange={(e) => setName(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Shares</Label>
                <Input type="number" min="0.0001" step="any" placeholder="10" value={shares} onChange={(e) => setShares(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Price per Share</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: "#64748d" }}>$</span>
                  <Input type="number" min="0.01" step="0.01" placeholder="150.00" value={price} onChange={(e) => setPrice(e.target.value)} required className="pl-7" style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px" }} />
            </div>
            {dialogMode !== "add" && (
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>Notes (optional)</Label>
                <Input placeholder="e.g. Q1 earnings buy" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
              </div>
            )}
            {shares && price && (
              <div className="rounded px-3 py-2 text-[13px]" style={{ background: "rgba(83,58,253,0.04)", border: "1px solid rgba(83,58,253,0.15)", borderRadius: "4px", fontFeatureSettings: '"tnum"', color: "#273951" }}>
                Total: {formatCurrency(parseFloat(shares) * parseFloat(price))}
              </div>
            )}
            <Button type="submit" disabled={saving} className="w-full" style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
              {saving ? "Saving…" : dialogMode === "add" ? "Add Position" : dialogMode === "buy" ? "Record Buy" : "Record Sell"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
