"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addRecurring, updateRecurring, deleteRecurring } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useI18n } from "@/lib/i18n";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, todayISO } from "@/lib/format";
import type { RecurringTransaction, TransactionCategory, TransactionType, RecurringFrequency } from "@/types";

const CATEGORIES: TransactionCategory[] = ["food","transport","housing","utilities","healthcare","entertainment","shopping","education","salary","investment","freelance","other"];
const INCOME_CATEGORIES: TransactionCategory[] = ["salary","investment","freelance","other"];
const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KRW: "₩", HKD: "HK$" };

interface FormState {
  type: TransactionType;
  amount: string;
  category: TransactionCategory;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
}

const defaultForm = (): FormState => ({
  type: "expense", amount: "", category: "housing",
  description: "", frequency: "monthly",
  startDate: todayISO(), endDate: "",
});

export function RecurringManager() {
  const recurringTransactions = useFinanceStore((s) => s.recurringTransactions);
  const loadRecurring = useFinanceStore((s) => s.loadRecurring);
  const { t, currency } = useI18n();
  const r = t.recurring;
  const ex = t.expenses;
  const symbol = CURRENCY_SYMBOL[currency] ?? "$";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);

  const visibleCategories = form.type === "income"
    ? INCOME_CATEGORIES
    : CATEGORIES.filter((c) => !INCOME_CATEGORIES.includes(c));

  const openAdd = () => { setEditing(null); setForm(defaultForm()); setOpen(true); };
  const openEdit = (rule: RecurringTransaction) => {
    setEditing(rule);
    setForm({
      type: rule.type, amount: String(rule.amount), category: rule.category,
      description: rule.description, frequency: rule.frequency,
      startDate: rule.startDate, endDate: rule.endDate ?? "",
    });
    setOpen(true);
  };

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const handleTypeChange = (type: TransactionType) => {
    set({ type, category: type === "income" ? "salary" : "housing" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error(ex.invalidAmount); return; }
    if (!form.description.trim()) { toast.error(ex.descriptionPlaceholder); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateRecurring(editing.id!, {
          amount, category: form.category, description: form.description.trim(),
          frequency: form.frequency, startDate: form.startDate,
          endDate: form.endDate || null,
        });
      } else {
        await addRecurring({
          type: form.type, amount, category: form.category,
          description: form.description.trim(), frequency: form.frequency,
          startDate: form.startDate, endDate: form.endDate || null,
          dayOfMonth: null,
        });
      }
      await loadRecurring();
      setOpen(false);
    } catch {
      toast.error(r.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: RecurringTransaction) => {
    if (!confirm(r.deleteConfirm(rule.description))) return;
    try {
      await deleteRecurring(rule.id!);
      await loadRecurring();
      toast.success(r.deleteSuccess);
    } catch {
      toast.error(r.saveError);
    }
  };

  const labelStyle: React.CSSProperties = { fontFeatureSettings: '"ss01"', color: "#273951", fontSize: "13px" };
  const inputStyle = { borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "14px", fontFeatureSettings: '"ss01"' };

  return (
    <>
      <Button
        onClick={openAdd}
        variant="outline"
        style={{ borderRadius: "4px", fontSize: "13px", fontFeatureSettings: '"ss01"', border: "1px solid #e5edf5", color: "#273951" }}
      >
        ↻ {r.title}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ borderRadius: "8px", border: "1px solid #e5edf5", maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.1rem", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.2px" }}>
              {editing ? r.editTitle : r.addTitle}
            </DialogTitle>
          </DialogHeader>

          {/* List of existing rules (shown only when adding) */}
          {!editing && recurringTransactions.length > 0 && (
            <div className="space-y-1.5 pb-2" style={{ borderBottom: "1px solid #f0f4f8" }}>
              <p style={{ fontSize: "11px", color: "#64748d", textTransform: "uppercase", letterSpacing: "0.06em", fontFeatureSettings: '"ss01"', marginBottom: 6 }}>{r.manageTitle}</p>
              {recurringTransactions.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded px-3 py-2" style={{ background: "#f8fafc", border: "1px solid #e5edf5", borderRadius: "5px" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryBadge category={rule.category} />
                    <div className="min-w-0">
                      <p className="truncate" style={{ fontSize: "13px", color: "#061b31", fontFeatureSettings: '"ss01"' }}>{rule.description}</p>
                      <p style={{ fontSize: "11px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                        {rule.frequency === "weekly" ? r.weekly : r.monthly} · {formatCurrency(rule.amount, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-2 shrink-0">
                    <button onClick={() => openEdit(rule)} style={{ fontSize: "11px", color: "#273951", background: "rgba(39,57,81,0.06)", border: "1px solid rgba(39,57,81,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>
                      {t.common.edit}
                    </button>
                    <button onClick={() => handleDelete(rule)} style={{ fontSize: "11px", color: "#ea2261", background: "rgba(234,34,97,0.06)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {!editing && (
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid #e5edf5" }}>
                {(["expense", "income"] as TransactionType[]).map((tp) => (
                  <button key={tp} type="button" onClick={() => handleTypeChange(tp)} className="flex-1 py-2 text-[13px] transition-colors"
                    style={{ fontFeatureSettings: '"ss01"', background: form.type === tp ? "#533afd" : "transparent", color: form.type === tp ? "#fff" : "#273951", border: "none", cursor: "pointer" }}>
                    {tp === "income" ? ex.income : ex.expense}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label style={labelStyle}>{ex.descriptionLabel}</Label>
              <Input placeholder={ex.descriptionPlaceholder} value={form.description}
                onChange={(e) => set({ description: e.target.value })} required style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label style={labelStyle}>{ex.amountLabel}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "#64748d" }}>{symbol}</span>
                  <Input type="number" min="0.01" step={currency === "KRW" ? "1" : "0.01"} placeholder={currency === "KRW" ? "0" : "0.00"}
                    value={form.amount} onChange={(e) => set({ amount: e.target.value })} required
                    style={{ paddingLeft: currency === "HKD" ? "44px" : "28px", ...inputStyle }} />
                </div>
              </div>
              <div className="space-y-1">
                <Label style={labelStyle}>{r.frequencyLabel}</Label>
                <Select value={form.frequency} onValueChange={(v) => set({ frequency: v as RecurringFrequency })}>
                  <SelectTrigger style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "13px" }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" style={{ fontSize: "13px" }}>{r.monthly}</SelectItem>
                    <SelectItem value="weekly" style={{ fontSize: "13px" }}>{r.weekly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label style={labelStyle}>{ex.categoryLabel}</Label>
              <Select value={form.category} onValueChange={(v) => set({ category: v as TransactionCategory })}>
                <SelectTrigger style={{ borderRadius: "4px", border: "1px solid #e5edf5", fontSize: "13px" }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {visibleCategories.map((c) => (
                    <SelectItem key={c} value={c} style={{ fontSize: "13px" }}>{ex.categories[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label style={labelStyle}>{r.startDateLabel}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} required style={inputStyle} />
              </div>
              <div className="space-y-1">
                <Label style={labelStyle}>{r.endDateLabel}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full"
              style={{ background: "#533afd", color: "#fff", borderRadius: "4px", fontFeatureSettings: '"ss01"', fontWeight: 400, fontSize: "14px", border: "none" }}>
              {saving ? t.common.saving : editing ? t.common.save : r.addNew.replace("+ ", "")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
