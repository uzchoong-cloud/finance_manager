"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  totalExpenses: number;
}

export function BudgetBar({ totalExpenses }: BudgetBarProps) {
  const profile = useAuthStore((s) => s.profile);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const { t, currency } = useI18n();
  const b = t.budget;

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const budget = profile?.monthlyBudget ?? null;
  const pct = budget !== null && budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isNear = pct >= 75 && pct < 100;
  const isOver = pct >= 100;

  // Color states
  const barColor = isOver ? "#ea2261" : isNear ? "#f59e0b" : "#533afd";
  const barBg = isOver ? "rgba(234,34,97,0.1)" : isNear ? "rgba(245,158,11,0.1)" : "rgba(83,58,253,0.08)";

  const handleSave = async () => {
    const val = parseFloat(inputValue);
    if (!val || val <= 0) { toast.error(t.expenses.invalidAmount); return; }
    setSaving(true);
    try {
      await updateSettings({ monthlyBudget: val });
      toast.success(b.saved);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateSettings({ monthlyBudget: null });
      toast.success(b.removed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  };

  const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", KRW: "₩", HKD: "HK$" };
  const symbol = CURRENCY_SYMBOL[currency] ?? "$";

  // No budget set — show a quiet prompt
  if (budget === null && !editing) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "rgba(83,58,253,0.04)", border: "1px dashed rgba(83,58,253,0.2)", borderRadius: "6px" }}>
        <p style={{ fontSize: "13px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>{b.setBudgetPrompt}</p>
        <button
          onClick={() => { setInputValue(""); setEditing(true); }}
          style={{ fontSize: "12px", color: "#533afd", background: "rgba(83,58,253,0.08)", border: "1px solid rgba(83,58,253,0.2)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12, fontFeatureSettings: '"ss01"' }}
        >
          {b.set}
        </button>
      </div>
    );
  }

  // Edit mode — inline input
  if (editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg" style={{ background: "var(--wt-surface-2)", border: "1px solid var(--wt-border)", borderRadius: "6px" }}>
        <span style={{ fontSize: "13px", color: "var(--wt-text-2)", fontFeatureSettings: '"ss01"', whiteSpace: "nowrap" }}>{b.label}</span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--wt-muted)" }}>{symbol}</span>
            <input
              type="number"
              min="1"
              step={currency === "KRW" ? "1000" : "1"}
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={b.placeholder}
              style={{ width: "160px", paddingLeft: currency === "HKD" ? "40px" : "26px", paddingRight: "8px", paddingTop: "6px", paddingBottom: "6px", fontSize: "14px", fontFeatureSettings: '"tnum"', border: "1px solid #533afd", borderRadius: "4px", outline: "none", color: "var(--wt-text)", background: "var(--wt-surface)" }}
            />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ fontSize: "12px", color: "#fff", background: "#533afd", border: "none", borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontFeatureSettings: '"ss01"', whiteSpace: "nowrap" }}>
            {saving ? "…" : t.common.save}
          </button>
          {budget !== null && (
            <button onClick={handleRemove} disabled={saving}
              style={{ fontSize: "12px", color: "#ea2261", background: "rgba(234,34,97,0.06)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: "4px", padding: "6px 10px", cursor: "pointer", fontFeatureSettings: '"ss01"', whiteSpace: "nowrap" }}>
              {b.remove}
            </button>
          )}
          <button onClick={() => setEditing(false)}
            style={{ fontSize: "12px", color: "var(--wt-muted)", background: "none", border: "none", cursor: "pointer", paddingLeft: "2px" }}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Active budget — progress bar
  const clampedPct = Math.min(pct, 100);
  const overAmount = isOver ? totalExpenses - budget! : 0;

  return (
    <div className="px-4 py-3 rounded-lg" style={{ background: barBg, border: `1px solid ${isOver ? "rgba(234,34,97,0.2)" : isNear ? "rgba(245,158,11,0.2)" : "rgba(83,58,253,0.15)"}`, borderRadius: "6px" }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--wt-text-2)", fontFeatureSettings: '"ss01"' }}>{b.label}</span>
          {isOver && (
            <span style={{ fontSize: "11px", color: "#ea2261", background: "rgba(234,34,97,0.1)", border: "1px solid rgba(234,34,97,0.25)", borderRadius: "4px", padding: "1px 7px", fontFeatureSettings: '"ss01"', fontWeight: 400 }}>
              {formatCurrency(overAmount, currency)} {b.over}
            </span>
          )}
          {isNear && !isOver && (
            <span style={{ fontSize: "11px", color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "4px", padding: "1px 7px", fontFeatureSettings: '"ss01"' }}>
              {b.warningNear}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "12px", color: isOver ? "#ea2261" : "var(--wt-muted)", fontFeatureSettings: '"tnum"' }}>
            {formatCurrency(totalExpenses, currency)} {b.of} {formatCurrency(budget!, currency)}
          </span>
          <button
            onClick={() => { setInputValue(String(budget)); setEditing(true); }}
            style={{ fontSize: "11px", color: "var(--wt-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontFeatureSettings: '"ss01"' }}
          >
            {b.edit}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "999px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${clampedPct}%`,
            background: barColor,
            borderRadius: "999px",
            transition: "width 0.4s ease, background 0.3s ease",
          }}
        />
      </div>

      {/* Footer row */}
      <div className="flex justify-between mt-1.5">
        <span style={{ fontSize: "11px", color: "var(--wt-muted)", fontFeatureSettings: '"ss01"' }}>
          {Math.round(pct)}% {b.spent}
        </span>
        {!isOver && (
          <span style={{ fontSize: "11px", color: "var(--wt-muted)", fontFeatureSettings: '"tnum"' }}>
            {formatCurrency(Math.max(budget! - totalExpenses, 0), currency)} {b.remaining}
          </span>
        )}
      </div>
    </div>
  );
}
