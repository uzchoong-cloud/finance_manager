"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { TransactionCategory } from "@/types";

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  food:          "#f97316",
  transport:     "#06b6d4",
  housing:       "#533afd",
  utilities:     "#8b5cf6",
  healthcare:    "#15be53",
  entertainment: "#e879f9",
  shopping:      "#ea2261",
  education:     "#f59e0b",
  salary:        "#15be53",
  investment:    "#533afd",
  freelance:     "#06b6d4",
  other:         "#94a3b8",
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  const sweep = Math.min(end - start, 359.999);
  const o1 = polarToCartesian(cx, cy, outerR, start);
  const o2 = polarToCartesian(cx, cy, outerR, start + sweep);
  const i1 = polarToCartesian(cx, cy, innerR, start + sweep);
  const i2 = polarToCartesian(cx, cy, innerR, start);
  const large = sweep > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

interface Props {
  byCategory: Partial<Record<TransactionCategory, number>>;
  totalExpenses: number;
}

export function ExpenseBreakdown({ byCategory, totalExpenses }: Props) {
  const { t, currency } = useI18n();
  const ex = t.expenses;
  const [hovered, setHovered] = useState<TransactionCategory | null>(null);

  const entries = (Object.entries(byCategory) as [TransactionCategory, number][])
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  const slices = entries.map(([cat, amount]) => ({
    cat,
    amount,
    pct: (amount / totalExpenses) * 100,
    color: CATEGORY_COLORS[cat],
  }));

  // Donut
  const cx = 110, cy = 110, outerR = 90, innerR = 56;
  let cursor = 0;
  const segments = slices.map((s) => {
    const start = cursor;
    const sweep = (s.pct / 100) * 360;
    cursor += sweep;
    return { ...s, start, sweep };
  });

  const active = hovered ? slices.find((s) => s.cat === hovered) : null;

  return (
    <div className="rounded-lg p-5" style={{ background: "var(--wt-surface)", border: "1px solid var(--wt-border)", borderRadius: "6px", boxShadow: "var(--wt-shadow)" }}>
      <p className="text-[12px] uppercase tracking-wider mb-4" style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: "var(--wt-muted)", letterSpacing: "0.06em" }}>
        {ex.breakdown ?? "Spending Breakdown"}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut */}
        <div className="shrink-0 relative" style={{ width: 220, height: 220 }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            {segments.map((seg) => {
              const isActive = hovered === seg.cat;
              return (
                <path
                  key={seg.cat}
                  d={arcPath(cx, cy, outerR, innerR, seg.start, seg.start + seg.sweep)}
                  fill={seg.color}
                  opacity={hovered && !isActive ? 0.3 : 1}
                  style={{ transform: `scale(${isActive ? 1.04 : 1})`, transformOrigin: `${cx}px ${cy}px`, transition: "all 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setHovered(seg.cat)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {active ? (
              <>
                <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontSize: 13, fontWeight: 500, fill: "var(--wt-text)", fontFamily: "inherit" }}>
                  {ex.categories[active.cat]}
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 11, fill: "var(--wt-muted)", fontFamily: "inherit" }}>
                  {active.pct.toFixed(1)}%
                </text>
                <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: 10, fill: "var(--wt-muted)", fontFamily: "inherit" }}>
                  {formatCurrency(active.amount, currency)}
                </text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 11, fill: "var(--wt-muted)", fontFamily: "inherit" }}>
                  {ex.totalExpenses}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 13, fontWeight: 500, fill: "var(--wt-text)", fontFamily: "inherit" }}>
                  {formatCurrency(totalExpenses, currency)}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Category list with progress bars */}
        <div className="flex-1 w-full space-y-2.5">
          {slices.map((s) => {
            const isActive = hovered === s.cat;
            return (
              <div
                key={s.cat}
                className="transition-all"
                style={{ opacity: hovered && !isActive ? 0.4 : 1, cursor: "default" }}
                onMouseEnter={() => setHovered(s.cat)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: "13px", color: "var(--wt-text)", fontFeatureSettings: '"ss01"', fontWeight: isActive ? 400 : 300 }}>
                      {ex.categories[s.cat]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"tnum"' }}>
                      {formatCurrency(s.amount, currency)}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 500, fontFeatureSettings: '"tnum"', color: s.color, minWidth: 38, textAlign: "right" }}>
                      {s.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, background: "var(--wt-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${s.pct}%`,
                    background: s.color,
                    borderRadius: 999,
                    transition: "width 0.4s ease",
                    opacity: isActive ? 1 : 0.7,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
