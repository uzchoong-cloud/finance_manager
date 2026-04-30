"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { StockWithValue } from "@/types";

const COLORS = [
  "#533afd", "#15be53", "#f59e0b", "#ea2261", "#06b6d4",
  "#8b5cf6", "#f97316", "#10b981", "#e879f9", "var(--wt-muted)",
];

interface Slice {
  ticker: string;
  costBasis: number;
  pct: number;
  color: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  // Clamp to avoid full-circle degenerate case
  const sweep = Math.min(end - start, 359.999);
  const o1 = polarToCartesian(cx, cy, outerR, start);
  const o2 = polarToCartesian(cx, cy, outerR, start + sweep);
  const i1 = polarToCartesian(cx, cy, innerR, start + sweep);
  const i2 = polarToCartesian(cx, cy, innerR, start);
  const large = sweep > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

interface Props {
  holdings: StockWithValue[];
}

export function AllocationChart({ holdings }: Props) {
  const { t, currency } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);

  const eligible = holdings.filter((h) => h.costBasis > 0);
  if (eligible.length === 0) return null;

  const total = eligible.reduce((s, h) => s + h.costBasis, 0);

  const slices: Slice[] = eligible.map((h, i) => ({
    ticker: h.ticker,
    costBasis: h.costBasis,
    pct: (h.costBasis / total) * 100,
    color: COLORS[i % COLORS.length],
  }));

  // Build arc segments
  const cx = 110, cy = 110, outerR = 90, innerR = 56;
  let cursor = 0;
  const segments = slices.map((s) => {
    const start = cursor;
    const sweep = (s.pct / 100) * 360;
    cursor += sweep;
    return { ...s, start, sweep };
  });

  const active = hovered ? slices.find((s) => s.ticker === hovered) : null;

  return (
    <div className="rounded-lg p-5" style={{ background: "var(--wt-surface)", border: "1px solid var(--wt-border)", borderRadius: "6px", boxShadow: "var(--wt-shadow)" }}>
      <p className="text-[12px] uppercase tracking-wider mb-4" style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: "var(--wt-muted)", letterSpacing: "0.06em" }}>
        {t.portfolio.allocation}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG donut */}
        <div className="shrink-0 relative" style={{ width: 220, height: 220 }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            {segments.map((seg) => {
              const isActive = hovered === seg.ticker;
              const scale = isActive ? 1.04 : 1;
              return (
                <path
                  key={seg.ticker}
                  d={arcPath(cx, cy, outerR, innerR, seg.start, seg.start + seg.sweep)}
                  fill={seg.color}
                  opacity={hovered && !isActive ? 0.35 : 1}
                  style={{ transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, transition: "all 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setHovered(seg.ticker)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Centre label */}
            {active ? (
              <>
                <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontSize: 13, fontWeight: 500, fill: "var(--wt-text)", fontFamily: "inherit" }}>{active.ticker}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 11, fill: "var(--wt-muted)", fontFamily: "inherit" }}>{active.pct.toFixed(1)}%</text>
                <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: 10, fill: "var(--wt-muted)", fontFamily: "inherit" }}>{formatCurrency(active.costBasis, currency)}</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 11, fill: "var(--wt-muted)", fontFamily: "inherit" }}>{t.portfolio.costBasis}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 13, fontWeight: 500, fill: "var(--wt-text)", fontFamily: "inherit" }}>{formatCurrency(total, currency)}</text>
              </>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {slices.map((s) => {
            const isActive = hovered === s.ticker;
            return (
              <div
                key={s.ticker}
                className="flex items-center justify-between rounded px-3 py-2 transition-all"
                style={{ background: isActive ? `${s.color}10` : "transparent", borderRadius: "5px", cursor: "default", opacity: hovered && !isActive ? 0.45 : 1 }}
                onMouseEnter={() => setHovered(s.ticker)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--wt-text)", fontFeatureSettings: '"ss01"' }}>{s.ticker}</span>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <span style={{ fontSize: "12px", color: "var(--wt-muted)", fontFeatureSettings: '"tnum"' }}>{formatCurrency(s.costBasis, currency)}</span>
                  <span style={{ fontSize: "12px", color: "var(--wt-text-2)", fontFeatureSettings: '"tnum"', fontWeight: 500, minWidth: 40, textAlign: "right" }}>{s.pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
