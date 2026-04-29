"use client";

import { useFinanceStore } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useI18n } from "@/lib/i18n";
import { StatCard } from "@/components/shared/StatCard";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatCurrency, formatCurrencyCompact, formatPercent, formatDate } from "@/lib/format";
import type { Currency } from "@/lib/i18n";

function BudgetDashCard({ spent, budget, pct, over, near, label, currency, formatCurrency: fc, formatCurrencyCompact: fcc, remaining, overLabel }: {
  spent: number; budget: number; pct: number; over: boolean; near: boolean;
  label: string; currency: Currency;
  formatCurrency: (n: number, c: Currency) => string;
  formatCurrencyCompact: (n: number, c: Currency) => string;
  remaining: string; overLabel: string;
}) {
  const barColor = over ? "#ea2261" : near ? "#f59e0b" : "#533afd";
  const clamp = Math.min(pct, 100);
  const valueColor = over ? "#ea2261" : near ? "#f59e0b" : "#061b31";
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5edf5", borderRadius: "6px", boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px", padding: "20px" }}>
      <p className="text-[12px] uppercase tracking-wider mb-2" style={{ fontFeatureSettings: '"ss01"', fontWeight: 400, color: "#64748d", letterSpacing: "0.06em" }}>{label}</p>
      <p className="text-[28px] leading-none mb-1" style={{ fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums", fontWeight: 300, color: valueColor, letterSpacing: "-0.5px" }}>
        {fcc(spent, currency)}
      </p>
      <p className="text-[13px] mt-1 mb-3" style={{ fontFeatureSettings: '"tnum"', fontWeight: 400, color: over ? "#ea2261" : "#64748d" }}>
        {over
          ? `${fc(spent - budget, currency)} ${overLabel}`
          : `${fc(Math.max(budget - spent, 0), currency)} ${remaining}`}
      </p>
      <div style={{ height: "4px", background: "rgba(0,0,0,0.06)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${clamp}%`, background: barColor, borderRadius: "999px", transition: "width 0.4s ease" }} />
      </div>
      <p style={{ fontSize: "11px", color: "#64748d", marginTop: 4, fontFeatureSettings: '"tnum"' }}>{Math.round(pct)}% of {fcc(budget, currency)}</p>
    </div>
  );
}

export function DashboardView() {
  const transactions = useFinanceStore((s) => s.transactions);
  const transactionsLoaded = useFinanceStore((s) => s.transactionsLoaded);
  const holdingsLoaded = useFinanceStore((s) => s.holdingsLoaded);
  const getNetWorth = useFinanceStore((s) => s.getNetWorth);
  const getExpenseSummary = useFinanceStore((s) => s.getExpenseSummary);
  const getPortfolioSummary = useFinanceStore((s) => s.getPortfolioSummary);
  const profile = useAuthStore((s) => s.profile);
  const { t, currency, lang } = useI18n();
  const d = t.dashboard;
  const locale = lang === "ko" ? "ko-KR" : "en-US";

  const startingBalance = profile?.startingBalance ?? 0;
  const monthlyBudget = profile?.monthlyBudget ?? null;
  const netWorth = getNetWorth(startingBalance);
  const { totalIncome, totalExpenses, netCashFlow } = getExpenseSummary();
  const { totalValue, totalGainLossPercent } = getPortfolioSummary();

  // Budget derived values for dashboard card
  const budgetPct = monthlyBudget !== null && monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : null;
  const budgetOver = budgetPct !== null && budgetPct >= 100;
  const budgetNear = budgetPct !== null && budgetPct >= 75 && !budgetOver;

  const recentTransactions = transactions.slice(0, 5);
  const isLoaded = transactionsLoaded && holdingsLoaded;

  return (
    <div className="space-y-8">
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 300, letterSpacing: "-0.5px", fontFeatureSettings: '"ss01"', color: "#061b31", lineHeight: 1.2 }}>
          {d.title}
        </h1>
        <p style={{ fontSize: "14px", fontWeight: 300, color: "#64748d", fontFeatureSettings: '"ss01"', marginTop: "4px" }}>
          {d.subtitle}
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${monthlyBudget !== null ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        <StatCard
          label={d.netWorth}
          value={!isLoaded ? "—" : netWorth === null ? d.pendingPrices : formatCurrencyCompact(netWorth, currency)}
          subValue={netWorth !== null ? formatCurrency(netWorth, currency) : undefined}
          trend="neutral"
        />
        <StatCard
          label={d.cashFlow}
          value={formatCurrencyCompact(netCashFlow, currency)}
          subValue={
            netCashFlow >= 0
              ? `↑ ${formatCurrency(totalIncome, currency)} ${d.income}`
              : `↓ ${formatCurrency(totalExpenses, currency)} ${d.expenses}`
          }
          trend={netCashFlow >= 0 ? "up" : "down"}
        />
        <StatCard
          label={d.portfolioValue}
          value={totalValue === null ? t.common.fetching : formatCurrencyCompact(totalValue, currency)}
          subValue={totalGainLossPercent !== null ? `${formatPercent(totalGainLossPercent)} ${d.totalReturn}` : undefined}
          trend={totalGainLossPercent === null ? "neutral" : totalGainLossPercent >= 0 ? "up" : "down"}
        />
        {monthlyBudget !== null && (
          <BudgetDashCard
            spent={totalExpenses}
            budget={monthlyBudget}
            pct={budgetPct!}
            over={budgetOver}
            near={budgetNear}
            label={t.budget.dashboardLabel}
            currency={currency}
            formatCurrency={formatCurrency}
            formatCurrencyCompact={formatCurrencyCompact}
            remaining={t.budget.remaining}
            overLabel={t.budget.over}
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: "1rem", fontWeight: 400, color: "#061b31", fontFeatureSettings: '"ss01"', letterSpacing: "-0.1px" }}>
            {d.recentTransactions}
          </h2>
          <a href="/expenses" style={{ fontSize: "13px", fontWeight: 400, color: "#533afd", fontFeatureSettings: '"ss01"', textDecoration: "none" }}>
            {d.viewAll}
          </a>
        </div>

        {!isLoaded ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-md animate-pulse" style={{ background: "#f0f4f8" }} />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="rounded-lg py-10 text-center" style={{ border: "1px dashed #b9b9f9", borderRadius: "6px" }}>
            <p style={{ fontSize: "14px", color: "#64748d", fontFeatureSettings: '"ss01"', fontWeight: 300 }}>
              {d.noTransactions}{" "}
              <a href="/expenses" style={{ color: "#533afd" }}>{d.addFirst}</a>
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg overflow-hidden" style={{ border: "1px solid #e5edf5", borderRadius: "6px", boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px" }}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-[#fafbfc] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryBadge category={tx.category} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "14px", fontWeight: 300, color: "#061b31", fontFeatureSettings: '"ss01"' }}>
                      {tx.description}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748d", fontFeatureSettings: '"ss01"' }}>
                      {formatDate(tx.date, locale)}
                    </p>
                  </div>
                </div>
                <span className="ml-4 whitespace-nowrap" style={{ fontSize: "14px", fontWeight: 400, fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums", color: tx.type === "income" ? "#108c3d" : "#061b31" }}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
