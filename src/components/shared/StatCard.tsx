import { useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
  className?: string;
}

export function StatCard({ label, value, subValue, trend, tooltip, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "#108c3d" : trend === "down" ? "#ea2261" : "var(--wt-muted)";
  const [show, setShow] = useState(false);

  return (
    <div
      className={cn("rounded-lg p-5", className)}
      style={{
        background: "var(--wt-surface)",
        border: "1px solid var(--wt-border)",
        borderRadius: "6px",
        boxShadow: "var(--wt-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-[12px] uppercase tracking-wider"
          style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: "var(--wt-muted)", letterSpacing: "0.06em" }}
        >
          {label}
        </p>
        {tooltip && (
          <div className="relative" style={{ flexShrink: 0 }}>
            <button
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
              style={{ background: "none", border: "none", cursor: "default", padding: "0 2px", lineHeight: 1, color: "var(--wt-muted)" }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <text x="8" y="12" textAnchor="middle" fontSize="9" fill="currentColor" fontWeight="500">i</text>
              </svg>
            </button>
            {show && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
                  background: "var(--wt-text)", color: "var(--wt-bg)",
                  fontSize: "12px", lineHeight: 1.5, borderRadius: "5px",
                  padding: "7px 10px", width: 200, fontWeight: 300,
                  fontFeatureSettings: '"ss01"', pointerEvents: "none",
                  boxShadow: "var(--wt-shadow)",
                }}
              >
                {tooltip}
                {/* Arrow */}
                <span style={{
                  position: "absolute", top: -5, right: 8,
                  width: 0, height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: "5px solid var(--wt-text)",
                }} />
              </div>
            )}
          </div>
        )}
      </div>

      <p
        className="text-[28px] leading-none mb-1"
        style={{ fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums", fontWeight: 300, color: "var(--wt-text)", letterSpacing: "-0.5px" }}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-[13px] mt-1" style={{ fontFeatureSettings: '"tnum"', fontWeight: 400, color: trendColor }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
