"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addStockHolding, buyShares, sellShares, deleteStockHolding } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useI18n } from "@/lib/i18n";
import { StatCard } from "@/components/shared/StatCard";
import { AllocationChart } from "./AllocationChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatPercent, formatShares, todayISO } from "@/lib/format";
import type { Currency } from "@/lib/i18n";
import type { StockHolding } from "@/types";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KRW: "₩", HKD: "HK$" };

/** Returns true for 6-digit KRX stock codes (KOSPI / KOSDAQ) */
const isKoreanTicker = (t: string) => /^\d{6}$/.test(t);

/** Strip the [Demo] prefix added by the seed so demo holdings look like real ones */
const displayName = (name: string) => name.replace(/^\[Demo\] /, "");

/** Cast an arbitrary currency string to our supported Currency union */
function asCurrency(c: string): Currency {
  return (c === "KRW" || c === "HKD") ? c : "USD";
}

type DialogMode = "add" | "buy" | "sell";

interface SMSParsed {
  name: string;
  code: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
}

function parseBrokerSMS(text: string): SMSParsed | null {
  const nameMatch = text.match(/종\s*목\s*명\s*:\s*(.+)/);
  const codeMatch = text.match(/종목코드\s*:\s*(\S+)/);
  const typeMatch = text.match(/체결종류\s*:\s*(매수|매도)/);
  const sharesMatch = text.match(/체결수량\s*:\s*([\d,]+)주/);
  const priceMatch = text.match(/체결단가\s*:\s*([\d,]+)원/);
  if (!nameMatch || !sharesMatch || !priceMatch) return null;
  // fallback: check header line for 매수/매도 if 체결종류 line missing
  const isBuy = typeMatch ? typeMatch[1] === "매수" : text.includes("매수");
  return {
    name: nameMatch[1].trim(),
    code: (codeMatch?.[1] ?? "").trim(),
    type: isBuy ? "buy" : "sell",
    shares: parseInt(sharesMatch[1].replace(/,/g, ""), 10),
    price: parseInt(priceMatch[1].replace(/,/g, ""), 10),
  };
}

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

  // SMS paste state
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsParsed, setSmsParsed] = useState<SMSParsed | null>(null);
  const [smsDate, setSmsDate] = useState(todayISO());
  const [smsError, setSmsError] = useState("");

  const loadStockHoldings = useFinanceStore((s) => s.loadStockHoldings);
  const fetchStockPrices = useFinanceStore((s) => s.fetchStockPrices);
  const getPortfolioSummary = useFinanceStore((s) => s.getPortfolioSummary);
  const priceFetchState = useFinanceStore((s) => s.priceFetchState);
  const holdingsLoaded = useFinanceStore((s) => s.holdingsLoaded);

  const { t, currency } = useI18n();
  const p = t.portfolio;
  const symbol = CURRENCY_SYMBOL[currency] ?? "$";

  const { totalValue, totalCostBasis, totalGainLoss, totalGainLossPercent, holdings, mixedCurrencies } = getPortfolioSummary();
  const allPricesLoaded = Object.keys(priceFetchState).length > 0 && Object.values(priceFetchState).every((v) => v !== "loading");

  // If all holdings share one currency use it for the summary totals; otherwise fall back to profile currency
  const holdingCurrencies = [...new Set(holdings.map((h) => h.currency))];
  const summaryCurrency: Currency = holdingCurrencies.length === 1 ? asCurrency(holdingCurrencies[0]) : currency;

  const resetForm = () => { setTicker(""); setName(""); setShares(""); setPrice(""); setDate(todayISO()); setNotes(""); setSelectedHolding(null); };
  const openAdd = () => { resetForm(); setDialogMode("add"); setOpen(true); };
  const openBuy = (h: StockHolding) => { resetForm(); setSelectedHolding(h); setDialogMode("buy"); setOpen(true); };
  const openSell = (h: StockHolding) => { resetForm(); setSelectedHolding(h); setDialogMode("sell"); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedShares = parseFloat(shares), parsedPrice = parseFloat(price);
    if (!parsedShares || parsedShares <= 0 || !parsedPrice || parsedPrice <= 0) { toast.error(p.invalidInput); return; }
    setSaving(true);
    try {
      if (dialogMode === "add") {
        if (!ticker.trim() || !name.trim()) { toast.error(p.invalidTicker); return; }
        await addStockHolding(ticker.trim(), name.trim(), parsedShares, parsedPrice, date);
        toast.success(p.addSuccess(ticker.toUpperCase()));
      } else if (dialogMode === "buy" && selectedHolding?.id) {
        await buyShares(selectedHolding.id, parsedShares, parsedPrice, date, notes || undefined);
        toast.success(p.buySuccess(parsedShares, selectedHolding.ticker));
      } else if (dialogMode === "sell" && selectedHolding?.id) {
        await sellShares(selectedHolding.id, parsedShares, parsedPrice, date, notes || undefined);
        toast.success(p.sellSuccess(parsedShares, selectedHolding.ticker));
      }
      await loadStockHoldings();
      await fetchStockPrices();
      setOpen(false); resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : p.saveError);
    } finally { setSaving(false); }
  };

  const handleDelete = async (holdingId: string, tickerStr: string) => {
    if (!confirm(p.deleteConfirm(tickerStr))) return;
    await deleteStockHolding(holdingId);
    await loadStockHoldings();
    toast.success(p.deleteSuccess(tickerStr));
  };

  const handleSmsParse = () => {
    setSmsError("");
    const result = parseBrokerSMS(smsText);
    if (!result) { setSmsError(p.smsParseError); return; }
    setSmsParsed(result);
  };

  const handleSmsConfirm = async () => {
    if (!smsParsed) return;
    setSaving(true);
    try {
      const { stockHoldings } = useFinanceStore.getState();
      const existing = stockHoldings.find(
        (h) => h.ticker === smsParsed.code || h.name === smsParsed.name
      );
      if (smsParsed.type === "sell") {
        if (!existing?.id) throw new Error(p.smsNoHolding(smsParsed.name));
        await sellShares(existing.id, smsParsed.shares, smsParsed.price, smsDate);
        toast.success(p.smsSellSuccess(smsParsed.name, smsParsed.shares));
      } else {
        if (existing?.id) {
          await buyShares(existing.id, smsParsed.shares, smsParsed.price, smsDate);
        } else {
          await addStockHolding(smsParsed.code || smsParsed.name, smsParsed.name, smsParsed.shares, smsParsed.price, smsDate);
        }
        toast.success(p.smsBuySuccess(smsParsed.name, smsParsed.shares));
      }
      await loadStockHoldings();
      await fetchStockPrices();
      setSmsOpen(false); setSmsText(""); setSmsParsed(null); setSmsDate(todayISO());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : p.smsFail);
    } finally { setSaving(false); }
  };

  const dialogTitle = dialogMode === "add" ? p.addTitle : dialogMode === "buy" ? p.buyTitle(selectedHolding?.ticker ?? "") : p.sellTitle(selectedHolding?.ticker ?? "");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "var(--wt-text)", lineHeight: 1.2 }}>{p.title}</h1>
          <p style={{ fontSize: "14px", color: "var(--wt-muted)", fontWeight: 300, marginTop: 4, fontFeatureSettings: '"ss01"' }}>{p.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStockPrices} variant="outline" style={{ borderRadius: "4px", fontSize: "13px", fontFeatureSettings: '"ss01"', border: "1px solid var(--wt-border)", color: "var(--wt-text-2)" }}>{p.refresh}</Button>
          <Button onClick={() => { setSmsOpen(true); setSmsText(""); setSmsParsed(null); setSmsError(""); setSmsDate(todayISO()); }} variant="outline"
            style={{ borderRadius: "4px", fontSize: "13px", fontFeatureSettings: '"ss01"', border: "1px solid var(--wt-border)", color: "var(--wt-text-2)" }}>
            {p.smsButton}
          </Button>
          <Button onClick={openAdd} style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>{p.addStock}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={p.portfolioValue} value={mixedCurrencies ? "—" : totalValue === null ? (allPricesLoaded ? "—" : t.common.fetching) : formatCurrency(totalValue, summaryCurrency)} subValue={mixedCurrencies ? p.multipleCurrencies : undefined} trend="neutral" />
        <StatCard label={p.costBasis} value={mixedCurrencies ? "—" : formatCurrency(totalCostBasis, summaryCurrency)} subValue={mixedCurrencies ? p.multipleCurrencies : undefined} trend="neutral" />
        <StatCard label={p.totalReturn} value={mixedCurrencies || totalGainLoss === null ? "—" : `${totalGainLoss >= 0 ? "+" : ""}${formatCurrency(totalGainLoss, summaryCurrency)}`} subValue={mixedCurrencies ? p.multipleCurrencies : totalGainLossPercent !== null ? formatPercent(totalGainLossPercent) : undefined} trend={totalGainLoss === null ? "neutral" : totalGainLoss >= 0 ? "up" : "down"} />
      </div>

      {holdings.length > 0 && <AllocationChart holdings={holdings} />}

      {!holdingsLoaded ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "var(--wt-surface-3)" }} />)}</div>
      ) : holdings.length === 0 ? (
        <div className="py-16 text-center rounded-lg" style={{ border: "1px dashed #b9b9f9" }}>
          <p style={{ fontSize: "14px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>
            {p.noPositions}{" "}
            <button onClick={openAdd} style={{ color: "#533afd", background: "none", border: "none", cursor: "pointer", fontFeatureSettings: '"ss01"' }}>{p.addFirst}</button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {holdings.map((h) => {
            const fetchState = priceFetchState[h.ticker];
            const isLoading = fetchState === "loading";
            const isError = fetchState === "error";
            const gainColor = h.gainLoss === null ? "var(--wt-muted)" : h.gainLoss >= 0 ? "#108c3d" : "#ea2261";
            return (
              <div key={h.id} className="rounded-lg p-4" style={{ background: "var(--wt-surface)", border: "1px solid var(--wt-border)", borderRadius: "6px", boxShadow: "var(--wt-shadow-sm)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{h.ticker}</span>
                      <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(83,58,253,0.08)", color: "#533afd", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", fontFeatureSettings: '"tnum"' }}>{formatShares(h.shares)} sh</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{displayName(h.name)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {isLoading ? <div className="h-5 w-20 rounded animate-pulse" style={{ background: "var(--wt-surface-3)" }} />
                      : isError ? <span style={{ fontSize: "12px", color: "#ea2261" }}>{p.priceUnavailable}</span>
                      : h.currentValue !== null ? (
                        <>
                          <p style={{ fontSize: "15px", fontWeight: 400, fontFeatureSettings: '"tnum"', color: "var(--wt-text)" }}>{formatCurrency(h.currentValue, asCurrency(h.currency))}</p>
                          <p style={{ fontSize: "12px", fontFeatureSettings: '"tnum"', color: gainColor }}>
                            {h.gainLoss !== null && h.gainLoss >= 0 ? "+" : ""}{h.gainLoss !== null ? formatCurrency(h.gainLoss, asCurrency(h.currency)) : ""}{h.gainLossPercent !== null ? ` (${formatPercent(h.gainLossPercent)})` : ""}
                          </p>
                        </>
                      ) : <span style={{ fontSize: "12px", color: "var(--wt-muted)" }}>—</span>}
                  </div>
                </div>
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--wt-border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>
                    {p.avgCost}: <span style={{ fontFeatureSettings: '"tnum"', color: "var(--wt-text-2)" }}>{formatCurrency(h.averageCostPerShare, asCurrency(h.currency))}</span>
                    {" · "}{p.basis}: <span style={{ fontFeatureSettings: '"tnum"', color: "var(--wt-text-2)" }}>{formatCurrency(h.costBasis, asCurrency(h.currency))}</span>
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openBuy(h)} style={{ fontSize: "11px", color: "#533afd", background: "rgba(83,58,253,0.06)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>{p.buy}</button>
                    <button onClick={() => openSell(h)} style={{ fontSize: "11px", color: "var(--wt-text-2)", background: "rgba(39,57,81,0.06)", border: "1px solid rgba(39,57,81,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>{p.sell}</button>
                    <button onClick={() => h.id && handleDelete(h.id, h.ticker)} style={{ fontSize: "11px", color: "#ea2261", background: "rgba(234,34,97,0.06)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SMS Paste Dialog */}
      <Dialog open={smsOpen} onOpenChange={(v) => { setSmsOpen(v); if (!v) { setSmsText(""); setSmsParsed(null); setSmsError(""); } }}>
        <DialogContent style={{ borderRadius: "8px", border: "1px solid var(--wt-border)", maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>
              {p.smsDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Step 1: paste area */}
            {!smsParsed && (
              <>
                <textarea
                  value={smsText}
                  onChange={(e) => { setSmsText(e.target.value); setSmsError(""); }}
                  placeholder={p.smsPlaceholder}
                  rows={8}
                  style={{
                    width: "100%", borderRadius: "4px", border: "1px solid var(--wt-border)",
                    background: "var(--wt-surface-2)", color: "var(--wt-text)",
                    fontSize: "13px", fontFamily: "monospace", padding: "10px 12px",
                    resize: "none", outline: "none", lineHeight: 1.6,
                  }}
                />
                {smsError && <p style={{ fontSize: "12px", color: "#ea2261" }}>{smsError}</p>}
                <Button onClick={handleSmsParse} disabled={!smsText.trim()} className="w-full"
                  style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
                  {p.smsParse}
                </Button>
              </>
            )}

            {/* Step 2: confirm parsed result */}
            {smsParsed && (
              <>
                <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--wt-surface-2)", border: "1px solid var(--wt-border)", borderRadius: "6px" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{p.smsTradeType}</span>
                    <span style={{
                      fontSize: "13px", fontWeight: 500, borderRadius: "4px", padding: "2px 10px",
                      background: smsParsed.type === "buy" ? "rgba(16,140,61,0.1)" : "rgba(234,34,97,0.1)",
                      color: smsParsed.type === "buy" ? "#108c3d" : "#ea2261",
                    }}>
                      {smsParsed.type === "buy" ? p.buy : p.sell}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{p.smsStock}</span>
                    <span style={{ fontSize: "13px", color: "var(--wt-text)", fontFeatureSettings: '"ss01"' }}>
                      {smsParsed.name} <span style={{ color: "var(--wt-muted)" }}>({smsParsed.code})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{p.smsQuantity}</span>
                    <span style={{ fontSize: "13px", fontFeatureSettings: '"tnum"', color: "var(--wt-text)" }}>{smsParsed.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{p.smsPrice}</span>
                    <span style={{ fontSize: "13px", fontFeatureSettings: '"tnum"', color: "var(--wt-text)" }}>{formatCurrency(smsParsed.price, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ borderTop: "1px solid var(--wt-border)", paddingTop: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{p.smsTotal}</span>
                    <span style={{ fontSize: "14px", fontWeight: 500, fontFeatureSettings: '"tnum"', color: "var(--wt-text)" }}>
                      {formatCurrency(smsParsed.shares * smsParsed.price, currency)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.smsDate}</Label>
                  <input type="date" value={smsDate} onChange={(e) => setSmsDate(e.target.value)}
                    style={{ width: "100%", borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", padding: "8px 12px", background: "var(--wt-surface)", color: "var(--wt-text)", outline: "none" }} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSmsParsed(null)} className="flex-1"
                    style={{ borderRadius: "4px", fontSize: "13px", border: "1px solid var(--wt-border)", color: "var(--wt-text-2)" }}>
                    {p.smsReset}
                  </Button>
                  <Button onClick={handleSmsConfirm} disabled={saving} className="flex-1"
                    style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
                    {saving ? p.smsConfirming : p.smsConfirm}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ borderRadius: "8px", border: "1px solid var(--wt-border)", maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {(() => {
              // Determine the active ticker's currency for the form
              const formTicker = dialogMode === "add" ? ticker : (selectedHolding?.ticker ?? "");
              const formIsKrw = isKoreanTicker(formTicker);
              const formCurrency: Currency = formIsKrw ? "KRW" : currency;
              const formSymbol = CURRENCY_SYMBOL[formCurrency] ?? "$";
              const priceStep = formIsKrw ? "1" : "0.01";
              const priceMin = formIsKrw ? "1" : "0.01";
              const pricePlaceholder = formIsKrw ? "75000" : "150.00";

              return (
            <>
            {dialogMode === "add" && (
              <>
                <div className="space-y-1">
                  <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.tickerLabel}</Label>
                  <Input placeholder={p.tickerPlaceholder} value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
                </div>
                <div className="space-y-1">
                  <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.nameLabel}</Label>
                  <Input placeholder={p.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.sharesLabel}</Label>
                <Input type="number" min="0.0001" step="any" placeholder="10" value={shares} onChange={(e) => setShares(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.priceLabel}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--wt-muted)" }}>{formSymbol}</span>
                  <Input type="number" min={priceMin} step={priceStep} placeholder={pricePlaceholder} value={price} onChange={(e) => setPrice(e.target.value)} required
                    style={{ paddingLeft: formCurrency === "HKD" ? "44px" : "28px", borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"tnum"' }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{t.expenses.dateLabel}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px" }} />
            </div>
            {dialogMode !== "add" && (
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{p.notesLabel}</Label>
                <Input placeholder={p.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
              </div>
            )}
            {shares && price && (
              <div className="rounded px-3 py-2 text-[13px]" style={{ background: "rgba(83,58,253,0.04)", border: "1px solid rgba(83,58,253,0.15)", borderRadius: "4px", fontFeatureSettings: '"tnum"', color: "var(--wt-text-2)" }}>
                {p.total}: {formatCurrency(parseFloat(shares) * parseFloat(price), formCurrency)}
              </div>
            )}
            <Button type="submit" disabled={saving} className="w-full" style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
              {saving ? t.common.saving : dialogMode === "add" ? p.submitAdd : dialogMode === "buy" ? p.submitBuy : p.submitSell}
            </Button>
            </>
              );
            })()}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
