"use client";

import { useFinanceStore } from "@/store/useFinanceStore";
import { StatCard } from "@/components/shared/StatCard";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatDate,
} from "@/lib/format";

export function DashboardView() {
  const transactions = useFinanceStore((s) => s.transactions);
  const transactionsLoaded = useFinanceStore((s) => s.transactionsLoaded);
  const holdingsLoaded = useFinanceStore((s) => s.holdingsLoaded);
  const getNetWorth = useFinanceStore((s) => s.getNetWorth);
  const getExpenseSummary = useFinanceStore((s) => s.getExpenseSummary);
  const getPortfolioSummary = useFinanceStore((s) => s.getPortfolioSummary);

  const netWorth = getNetWorth();
  const { totalIncome, totalExpenses, netCashFlow } = getExpenseSummary();
  const { totalValue, totalGainLossPercent } = getPortfolioSummary();

  const recentTransactions = transactions.slice(0, 5);
  const isLoaded = transactionsLoaded && holdingsLoaded;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 300,
            letterSpacing: "-0.5px",
            fontFeatureSettings: '"ss01"',
            color: "#061b31",
            lineHeight: 1.2,
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 300,
            color: "#64748d",
            fontFeatureSettings: '"ss01"',
            marginTop: "4px",
          }}
        >
          Your financial overview at a glance
        </p>
      </div>

      {/* Summary stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Net Worth"
          value={
            !isLoaded
              ? "—"
              : netWorth === null
              ? "Pending prices"
              : formatCurrencyCompact(netWorth)
          }
          subValue={netWorth !== null ? formatCurrency(netWorth) : undefined}
          trend="neutral"
        />
        <StatCard
          label="This Month Cash Flow"
          value={formatCurrencyCompact(netCashFlow)}
          subValue={
            netCashFlow >= 0
              ? `↑ ${formatCurrency(totalIncome)} income`
              : `↓ ${formatCurrency(totalExpenses)} expenses`
          }
          trend={netCashFlow >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Portfolio Value"
          value={
            totalValue === null
              ? "Fetching…"
              : formatCurrencyCompact(totalValue)
          }
          subValue={
            totalGainLossPercent !== null
              ? `${formatPercent(totalGainLossPercent)} total return`
              : undefined
          }
          trend={
            totalGainLossPercent === null
              ? "neutral"
              : totalGainLossPercent >= 0
              ? "up"
              : "down"
          }
        />
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 400,
              color: "#061b31",
              fontFeatureSettings: '"ss01"',
              letterSpacing: "-0.1px",
            }}
          >
            Recent Transactions
          </h2>
          <a
            href="/expenses"
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "#533afd",
              fontFeatureSettings: '"ss01"',
              textDecoration: "none",
            }}
          >
            View all →
          </a>
        </div>

        {!isLoaded ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-md animate-pulse"
                style={{ background: "#f0f4f8" }}
              />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div
            className="rounded-lg py-10 text-center"
            style={{
              border: "1px dashed #b9b9f9",
              borderRadius: "6px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#64748d",
                fontFeatureSettings: '"ss01"',
                fontWeight: 300,
              }}
            >
              No transactions yet.{" "}
              <a href="/expenses" style={{ color: "#533afd" }}>
                Add your first one →
              </a>
            </p>
          </div>
        ) : (
          <div
            className="divide-y rounded-lg overflow-hidden"
            style={{
              border: "1px solid #e5edf5",
              borderRadius: "6px",
              boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
            }}
          >
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-[#fafbfc] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryBadge category={t.category} />
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontSize: "14px",
                        fontWeight: 300,
                        color: "#061b31",
                        fontFeatureSettings: '"ss01"',
                      }}
                    >
                      {t.description}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748d",
                        fontFeatureSettings: '"ss01"',
                      }}
                    >
                      {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <span
                  className="ml-4 whitespace-nowrap"
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: "tabular-nums",
                    color: t.type === "income" ? "#108c3d" : "#061b31",
                  }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
