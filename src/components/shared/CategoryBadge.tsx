import type { TransactionCategory } from "@/types";

const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  food:          { label: "Food",          bg: "rgba(249,107,238,0.1)", text: "#9b1f8e", border: "rgba(249,107,238,0.3)" },
  transport:     { label: "Transport",     bg: "rgba(83,58,253,0.08)", text: "#533afd", border: "rgba(83,58,253,0.25)" },
  housing:       { label: "Housing",       bg: "rgba(6,27,49,0.06)",   text: "#273951", border: "rgba(6,27,49,0.15)" },
  utilities:     { label: "Utilities",     bg: "rgba(155,104,41,0.1)", text: "#9b6829", border: "rgba(155,104,41,0.3)" },
  healthcare:    { label: "Healthcare",    bg: "rgba(21,190,83,0.1)",  text: "#108c3d", border: "rgba(21,190,83,0.3)" },
  entertainment: { label: "Entertainment", bg: "rgba(234,34,97,0.08)", text: "#c01450", border: "rgba(234,34,97,0.25)" },
  shopping:      { label: "Shopping",      bg: "rgba(83,58,253,0.08)", text: "#4434d4", border: "rgba(83,58,253,0.2)" },
  education:     { label: "Education",     bg: "rgba(50,50,93,0.08)",  text: "#2e2b8c", border: "rgba(50,50,93,0.2)" },
  salary:        { label: "Salary",        bg: "rgba(21,190,83,0.12)", text: "#108c3d", border: "rgba(21,190,83,0.35)" },
  investment:    { label: "Investment",    bg: "rgba(83,58,253,0.1)",  text: "#533afd", border: "rgba(83,58,253,0.3)" },
  freelance:     { label: "Freelance",     bg: "rgba(249,107,238,0.08)", text: "#7a1a72", border: "rgba(249,107,238,0.25)" },
  other:         { label: "Other",         bg: "rgba(100,116,141,0.1)", text: "#64748d", border: "rgba(100,116,141,0.25)" },
};

interface CategoryBadgeProps {
  category: TransactionCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
  return (
    <span
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        borderRadius: "4px",
        padding: "1px 6px",
        fontSize: "11px",
        fontWeight: 400,
        fontFeatureSettings: '"ss01"',
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {config.label}
    </span>
  );
}

export { CATEGORY_CONFIG };
