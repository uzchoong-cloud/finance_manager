"use client";

import { useState } from "react";
import { toast } from "sonner";
import { confirmRecurring, skipRecurring } from "@/lib/db";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useI18n } from "@/lib/i18n";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurringTransaction } from "@/types";

function getPendingItems(recurring: RecurringTransaction[]): Array<{ rule: RecurringTransaction; dueDate: string }> {
  const today = new Date().toISOString().split("T")[0];
  const items: Array<{ rule: RecurringTransaction; dueDate: string }> = [];

  for (const rule of recurring) {
    let due = rule.nextDueDate;
    // Collect all overdue dates up to today (handles missed periods)
    while (due <= today) {
      if (rule.endDate && due > rule.endDate) break;
      items.push({ rule, dueDate: due });
      // Advance to see if there's another overdue period — but only show one per rule at a time
      // (avoid infinite loop; we show the earliest pending per rule)
      break;
    }
  }

  // Sort by due date ascending
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function PendingTransactions() {
  const recurringTransactions = useFinanceStore((s) => s.recurringTransactions);
  const recurringLoaded = useFinanceStore((s) => s.recurringLoaded);
  const loadRecurring = useFinanceStore((s) => s.loadRecurring);
  const loadTransactions = useFinanceStore((s) => s.loadTransactions);
  const { t, currency, lang } = useI18n();
  const r = t.recurring;
  const locale = lang === "ko" ? "ko-KR" : "en-US";

  const [processing, setProcessing] = useState<string | null>(null);

  const pending = getPendingItems(recurringTransactions);

  if (!recurringLoaded || pending.length === 0) return null;

  const handleConfirm = async (rule: RecurringTransaction, dueDate: string) => {
    setProcessing(rule.id! + dueDate);
    try {
      await confirmRecurring(rule, dueDate);
      await Promise.all([loadRecurring(), loadTransactions()]);
      toast.success(r.confirmSuccess(rule.description));
    } catch {
      toast.error(r.saveError);
    } finally {
      setProcessing(null);
    }
  };

  const handleSkip = async (rule: RecurringTransaction, dueDate: string) => {
    setProcessing(rule.id! + dueDate + "skip");
    try {
      await skipRecurring(rule, dueDate);
      await loadRecurring();
      toast.success(r.skipSuccess);
    } catch {
      toast.error(r.saveError);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(83,58,253,0.2)", borderRadius: "6px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(83,58,253,0.05)", borderBottom: "1px solid rgba(83,58,253,0.12)" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#533afd", fontFeatureSettings: '"ss01"', letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {r.pendingTitle}
          </span>
          <span style={{ fontSize: "11px", background: "#533afd", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontWeight: 500 }}>
            {pending.length}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
          {r.pendingSubtitle(pending.length)}
        </span>
      </div>

      {/* Pending items */}
      {pending.map(({ rule, dueDate }, idx) => {
        const key = rule.id! + dueDate;
        const isProcessing = processing?.startsWith(rule.id! + dueDate);
        return (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-3 bg-white"
            style={{ borderTop: idx > 0 ? "1px solid #f0f4f8" : undefined }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <CategoryBadge category={rule.category} />
              <div className="min-w-0">
                <p className="truncate" style={{ fontSize: "14px", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"' }}>
                  {rule.description}
                </p>
                <p style={{ fontSize: "11px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                  {r.due} {formatDate(dueDate, locale)} · {rule.frequency === "weekly" ? r.weekly : r.monthly}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-3 shrink-0">
              <span style={{ fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"tnum"', color: rule.type === "income" ? "#108c3d" : "#061b31" }}>
                {rule.type === "income" ? "+" : "-"}{formatCurrency(rule.amount, currency)}
              </span>
              <button
                onClick={() => handleConfirm(rule, dueDate)}
                disabled={!!isProcessing}
                style={{ fontSize: "12px", color: "#fff", background: "#533afd", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1, fontFeatureSettings: '"ss01"' }}
              >
                {r.confirm}
              </button>
              <button
                onClick={() => handleSkip(rule, dueDate)}
                disabled={!!isProcessing}
                style={{ fontSize: "12px", color: "#64748d", background: "rgba(100,116,141,0.08)", border: "1px solid rgba(100,116,141,0.2)", borderRadius: "4px", padding: "4px 10px", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1, fontFeatureSettings: '"ss01"' }}
              >
                {r.skip}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
