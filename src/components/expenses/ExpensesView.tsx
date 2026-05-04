"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { addTransaction, deleteTransaction, updateTransaction } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ExpenseCalendar } from "./ExpenseCalendar";
import { BudgetBar } from "./BudgetBar";
import { PendingTransactions } from "./PendingTransactions";
import { RecurringManager } from "./RecurringManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate, todayISO, getMonthName } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KRW: "₩", HKD: "HK$" };

export function ExpensesView() {
  const [open, setOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const profile = useAuthStore((s) => s.profile);
  const categories = useFinanceStore((s) => s.categories);
  const loadTransactions = useFinanceStore((s) => s.loadTransactions);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const selectedYear = useFinanceStore((s) => s.selectedYear);
  const setSelectedPeriod = useFinanceStore((s) => s.setSelectedPeriod);
  const transactions = useFinanceStore((s) => s.transactions);
  const transactionsLoaded = useFinanceStore((s) => s.transactionsLoaded);

  const { t, currency, lang } = useI18n();
  const ex = t.expenses;
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const symbol = CURRENCY_SYMBOL[currency] ?? "$";

  const getExpenseSummary = useFinanceStore((s) => s.getExpenseSummary);
  const { totalExpenses } = getExpenseSummary();
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

  const defaultCategory = (t: TransactionType) =>
    categories.find((c) => t === "income" ? c.key === "salary" : c.key === "food")?.key
    ?? categories[0]?.key ?? "other";

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(defaultCategory(newType));
  };

  const openAdd = () => {
    setEditingTx(null);
    setType("expense"); setAmount(""); setCategory(defaultCategory("expense")); setDescription(""); setNotes(""); setDate(todayISO());
    setOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setType(tx.type); setAmount(String(tx.amount)); setCategory(tx.category);
    setDescription(tx.description); setNotes(tx.notes === "__demo__" ? "" : (tx.notes ?? "")); setDate(tx.date);
    setOpen(true);
  };

  const handleDialogChange = (val: boolean) => {
    setOpen(val);
    if (!val) { setEditingTx(null); setAmount(""); setDescription(""); setNotes(""); setDate(todayISO()); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { toast.error(ex.invalidAmount); return; }
    setSaving(true);
    try {
      const trimmedNotes = notes.trim() || undefined;
      if (editingTx) {
        await updateTransaction(editingTx.id!, { type, amount: parsedAmount, category, description, notes: trimmedNotes, date });
        await loadTransactions();
        toast.success(ex.editSuccess);
      } else {
        await addTransaction({ type, amount: parsedAmount, category, description, notes: trimmedNotes, date });
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
      }
      setOpen(false);
      setEditingTx(null); setAmount(""); setDescription(""); setNotes(""); setDate(todayISO());
    } catch (err) { toast.error(err instanceof Error ? err.message : ex.saveError); }
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

  const listLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString(locale, { month: "long", day: "numeric" })
    : getMonthName(selectedMonth, locale);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "var(--wt-text)", lineHeight: 1.2 }}>{ex.title}</h1>
          <p style={{ fontSize: "14px", color: "var(--wt-muted)", fontWeight: 300, marginTop: 4, fontFeatureSettings: '"ss01"' }}>{ex.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <RecurringManager />
          <Button onClick={openAdd} style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none", padding: "8px 16px" }}>
            {ex.addTransaction}
          </Button>
        </div>

        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogContent style={{ borderRadius: "8px", border: "1px solid var(--wt-border)", maxWidth: 440 }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: "1.125rem", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>{editingTx ? ex.editTitle : ex.addTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--wt-border)" }}>
                {(["expense", "income"] as TransactionType[]).map((tp) => (
                  <button key={tp} type="button" onClick={() => handleTypeChange(tp)} className="flex-1 py-2 text-[13px] transition-colors"
                    style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, background: type === tp ? "#533afd" : "transparent", color: type === tp ? "#fff" : "var(--wt-text-2)", border: "none", cursor: "pointer" }}>
                    {tp === "income" ? ex.income : ex.expense}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{ex.amountLabel}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--wt-muted)" }}>{symbol}</span>
                  <Input type="number" min={currency === "KRW" ? "1" : "0.01"} step={currency === "KRW" ? "1" : "0.01"} placeholder={currency === "KRW" ? "0" : "0.00"} value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ paddingLeft: currency === "HKD" ? "44px" : "28px", fontFeatureSettings: '"tnum"', fontSize: "14px", borderRadius: "4px", border: "1px solid var(--wt-border)" }} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{ex.categoryLabel}</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "13px", fontFeatureSettings: '"ss01"' }}>
                    <span>{categories.find((c) => c.key === category)?.label ?? category}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.key} value={c.key} style={{ fontSize: "13px", fontFeatureSettings: '"ss01"' }}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{ex.descriptionLabel}</Label>
                <Input placeholder={ex.descriptionPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} required
                  style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{ex.notesLabel}</Label>
                <Input placeholder={ex.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)}
                  style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px", fontFeatureSettings: '"ss01"' }} />
              </div>
              <div className="space-y-1">
                <Label style={{ fontFeatureSettings: '"ss01"', color: "var(--wt-text-2)", fontSize: "13px" }}>{ex.dateLabel}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                  style={{ borderRadius: "4px", border: "1px solid var(--wt-border)", fontSize: "14px" }} />
              </div>
              <Button type="submit" disabled={saving} className="w-full"
                style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
                {saving ? t.common.saving : editingTx ? ex.submitEdit : ex.submitAdd}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ExpenseCalendar year={selectedYear} month={selectedMonth} transactions={monthTransactions}
        selectedDate={selectedDate} onSelectDate={setSelectedDate} onPrevMonth={prevMonth} onNextMonth={nextMonth} isNextMonthDisabled={isNextMonthDisabled} />

      <BudgetBar totalExpenses={totalExpenses} />

      <PendingTransactions />

      <div>
        <h2 style={{ fontSize: "15px", fontWeight: 400, color: "var(--wt-text)", fontFeatureSettings: '"ss01"', marginBottom: 12 }}>{listLabel}</h2>
        {!transactionsLoaded ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-md animate-pulse" style={{ background: "var(--wt-surface-3)" }} />)}</div>
        ) : visibleTransactions.length === 0 ? (
          <div className="py-12 text-center rounded-lg" style={{ border: "1px dashed #b9b9f9" }}>
            <p style={{ fontSize: "14px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>{ex.noTransactions}</p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--wt-border)", boxShadow: "var(--wt-shadow)" }}>
            {visibleTransactions.map((tx, idx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 transition-colors group"
                style={{ background: "var(--wt-surface)", borderTop: idx > 0 ? "1px solid var(--wt-border)" : "none" }}>
                {/* Left: badge + title + date */}
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryBadge category={tx.category} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "14px", fontWeight: 300, color: "var(--wt-text)", fontFeatureSettings: '"ss01"' }}>{tx.description}</p>
                    <p style={{ fontSize: "11px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{formatDate(tx.date, locale)}</p>
                  </div>
                </div>
                {/* Right: buttons (hover) + amount + note (hover) */}
                <div className="relative flex items-end flex-col ml-4 flex-shrink-0 gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button onClick={() => openEdit(tx)}
                        className="px-1.5 py-0.5"
                        style={{ color: "#533afd", background: "rgba(83,58,253,0.08)", border: "none", cursor: "pointer", borderRadius: "4px", lineHeight: 1 }}
                        title="Edit">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button onClick={() => tx.id && handleDelete(tx.id)}
                        className="text-[11px] px-1.5 py-0.5"
                        style={{ color: "#ea2261", background: "rgba(234,34,97,0.08)", border: "none", cursor: "pointer", borderRadius: "4px" }}>✕</button>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums", color: tx.type === "income" ? "#108c3d" : "var(--wt-text)", whiteSpace: "nowrap" }}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                  {tx.notes && tx.notes !== "__demo__" && (
                    <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 truncate"
                      style={{ fontSize: "11px", color: "#533afd", fontFeatureSettings: '"ss01"', maxWidth: "220px", textAlign: "right" }}>
                      💬 {tx.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
