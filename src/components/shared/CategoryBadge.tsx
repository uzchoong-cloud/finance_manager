"use client";

import { useFinanceStore } from "@/store/useFinanceStore";
import { hexToRgba } from "@/lib/format";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const categories = useFinanceStore((s) => s.categories);
  const cat = categories.find((c) => c.key === category);
  const color = cat?.color ?? "#64748b";
  const label = cat?.label ?? category;

  return (
    <span
      style={{
        background: hexToRgba(color, 0.1),
        color,
        border: `1px solid ${hexToRgba(color, 0.3)}`,
        borderRadius: "4px",
        padding: "1px 6px",
        fontSize: "11px",
        fontWeight: 400,
        fontFeatureSettings: '"ss01"',
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}
