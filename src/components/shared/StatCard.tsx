import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, subValue, trend, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "#108c3d" : trend === "down" ? "#ea2261" : "#64748d";

  return (
    <div
      className={cn("card-stripe rounded-lg p-5", className)}
      style={{
        background: "#ffffff",
        border: "1px solid #e5edf5",
        borderRadius: "6px",
        boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
      }}
    >
      <p
        className="text-[12px] uppercase tracking-wider mb-2"
        style={{
          fontFeatureSettings: '"ss01"',
          fontWeight: 400,
          color: "#64748d",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>
      <p
        className="text-[28px] leading-none mb-1"
        style={{
          fontFeatureSettings: '"tnum"',
          fontVariantNumeric: "tabular-nums",
          fontWeight: 300,
          color: "#061b31",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </p>
      {subValue && (
        <p
          className="text-[13px] mt-1"
          style={{
            fontFeatureSettings: '"tnum"',
            fontWeight: 400,
            color: trendColor,
          }}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}
