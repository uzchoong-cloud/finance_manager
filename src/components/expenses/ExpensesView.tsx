"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { addTransaction, deleteTransaction } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { StatCard } from "@/components/shared/StatCard";
import { ExpenseCalendar } from "./ExpenseCalendar";
import { BudgetBar } from "./BudgetBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatCurrencyCompact, formatDate, todayISO, getMonthName } from "@/lib/format";
import type { TransactionCategory, TransactionType } from "@/types";

const CATEGORIES: TransactionCategory[] = ["food","transport","housing","utilities","healthcare","entertainment","shopping","education","salary","investment","freelance","other"];
const INCOME_CATEGORIES: TransactionCategory[] = ["salary","investment","freelance","other"];

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KRW: "₩", HKD: "HK$" };

export function ExpensesView() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const profile = useAuthStore((s) => s.profile);
  const loadTransactions = useFinanceStore((s) => s.loadTransactions);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const selectedYear = useFinanceStore((s) => s.selectedYear);
  const setSelectedPeriod = useFinanceStore((s) => s.setSelectedPeriod);
  const getExpenseSummary = useFinanceStore((s) => s.getExpenseSummary);
  const transactions = useFinanceStore((s) => s.transactions);
  const transactionsLoaded = useFinanceStore((s) => s.transactionsLoaded);

  const { t, currency, lang } = useI18n();
  const ex = t.expenses;
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const symbol = CURRENCY_SYMBOL[currency] ?? "$";

  const { totalIncome, totalExpenses, netCashFlow } = getExpenseSummary();
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(monthKey)),
    [transactions, monthKey]
  );

  const visibleTransactions = useMemo(
    () => selectedDate
      ? monthTransactions.filter((tx) => tx.date === selectedDate)
      : monthTransactions,
    [monthTransactions, selectedDate]
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === "income" ? "salary" : "food");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { toast.error(ex.invalidAmount); return; }
    setSaving(true);
    try {
      await addTransaction({ type, amount: parsedAmount, category, description, date });
      await loadTransactions();
      toast.success(ex.addSuccess(type === "income" ? ex.income : ex.expense));
      // Warn if this expense tips user over budget (only for current month)
      const budget = profile?.monthlyBudget;
      const isCurrentMonth = date.startsWith(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
      if (type === "expense" && budget !== null && budget !== undefined && isCurrentMonth) {
        const newTotal = totalExpenses + parsedAmount;
        if (newTotal > budget && totalExpenses <= budget) {
          toast.error(t.budget.warningOver(formatCurrency(newTotal - budget, currency)), { duration: 5000 });
        }
      }
      setOpen(false);
      setAmount(""); setDescription(""); setDate(todayISO());
    } catch { toast.error(ex.saveError); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ex.deleteConfirm)) return;
    await deleteTransaction(id);
    await loadTransactions();
  };

  const prevMonth = () => {
    setSelectedDate(null);
    if (selectedMonth === 1) setSelectedPeriod(selectedYear - 1, 12);
    else setSelectedPeriod(selectedYear, selectedMonth - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1) return;
    setSelectedDate(null);
    if (selectedMonth === 12) setSelectedPeriod(selectedYear + 1, 1);
    else setSelectedPeriod(selectedYear, selectedMonth + 1);
  };

  const isNextMonthDisabled = (() => {
    const now = new Date();
    return selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
  })();

  const visibleCategories = type === "income" ? INCOME_CATEGORIES : CATEGORIES.filter((c) => !INCOME_CATEGORIES.includes(c));
  const listLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString(locale, { month: "long", day: "numeric" })
    : getMonthName(selectedMonth, locale);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "#061b31", lineHeight: 1.2 }}>{ex.title}</h1>
          <p style={{ fontSize: "14px", color: "#64748d", fontWeight: 300, marginTop: 4, fontFeatureSettings: '"ss01"' }}>{ex.subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)} style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none", padding: "8px 16px" }}>
          {ex.addTransaction}
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent style={{ borderRadius: "8px", border: "1px solid #e5edf5", maxWidth: 440 }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{ex.addTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid #e5edf5" }}>
                {(["expense", "income"] as TransactionType[]).map((tp) => (
                  <button key={tp} type="button" onClick={() => handleTypeChange(tp)} className="flex-1 py-2 text-[13px] transition-colors"
                    style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, background: type === tp ? "#533afd" : "transparent", color: type === tp ? "#fff" : "#273951", border: "none", cursor: "pointer" }}>
                    {tp === "income" ? ex.income : ex.expense}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>{ex.amountLabel}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "#64748d" }}>{symbol}</span>
                  <Input type="number" min="0.01" step={currency === "KRW" ? "1" : "0.01"} placeholder={currency === "KRW" ? "0" : "0.00"} value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ paddingLeft: currency === "HKD" ? "44px" : "28px", fontFeatureSettings: '"tnum"', fontSize: "14px", borderRadius: "4px", border: "1px solid #e5edf5" }} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>{ex.categoryLabel}</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
                  <SelectTrigger style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "13px", fontFeatureSettings: '"ss01"' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {visibleCategories.map((c) => (
                      <SelectItem key={c} value={c} style={{ fontSize: "13px", fontFeatureSettings: '"ss01"' }}>
                        {ex.categories[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>{ex.descriptionLabel}</Label>
                <Input placeholder={ex.descriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} required
                  style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" }}>{ex.dateLabel}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                  style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px" }} />
              </div>
              <Button type="submit" disabled={saving} className="w-full"
                style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
                {saving ? t.common.saving : ex.submitAdd}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ExpenseCalendar year={selectedYear} month={selectedMonth} transactions={monthTransactions}
        selectedDate={selectedDate} onSelectDate={setSelectedDate} onPrevMonth={prevMonth} onNextMonth={nextMonth} isNextMonthDisabled={isNextMonthDisabled} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={ex.totalIncome} value={formatCurrencyCompact(totalIncome, currency)} trend="up" />
        <StatCard label={ex.totalExpenses} value={formatCurrencyCompact(totalExpenses, currency)} trend="down" />
        <StatCard label={ex.netCashFlow} value={formatCurrencyCompact(netCashFlow, currency)} trend={netCashFlow >= 0 ? "up" : "down"} />
      </div>

      <BudgetBar totalExpenses={totalExpenses} />

      <div>
        <h2 style={{ fontSize: "15px", fontWeight: 400, color: "#061b31", fontFeatureSettings: '"ss01"', marginBottom: 12 }}>{listLabel}</h2>
        {!transactionsLoaded ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-md animate-pulse" style={{ background: "#f0f4f8" }} />)}</div>
        ) : visibleTransactions.length === 0 ? (
          <div className="py-12 text-center rounded-lg" style={{ border: "1px dashed #b9b9f9" }}>
            <p style={{ fontSize: "14px", color: "#64748d", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>{ex.noTransactions}</p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5edf5", boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px" }}>
            {visibleTransactions.map((tx, idx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-[#fafbfc] transition-colors group"
                style={{ borderTop: idx > 0 ? "1px solid #e5edf5" : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryBadge category={tx.category} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "14px", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"' }}>{tx.description}</p>
                    <p style={{ fontSize: "11px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>{formatDate(tx.date, locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <span style={{ fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums", color: tx.type === "income" ? "#108c3d" : "#061b31", whiteSpace: "nowrap" }}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                  </span>
                  <button onClick={() => tx.id && handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-1.5 py-0.5 rounded"
                    style={{ color: "#ea2261", background: "rgba(234,34,97,0.08)", border: "none", cursor: "pointer", borderRadius: "4px" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
