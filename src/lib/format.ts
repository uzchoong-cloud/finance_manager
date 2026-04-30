import type { Currency } from "./i18n";

// ─── Currency formatters ──────────────────────────────────────────────────────

const CURRENCY_META: Record<Currency, { locale: string; decimals: number }> = {
  USD: { locale: "en-US", decimals: 2 },
  KRW: { locale: "ko-KR", decimals: 0 },
  HKD: { locale: "en-HK", decimals: 2 },
};

// Cache formatters to avoid re-creating them on every render
const _cache = new Map<string, Intl.NumberFormat>();
function getFormatter(currency: Currency, compact: boolean): Intl.NumberFormat {
  const key = `${currency}-${compact}`;
  if (!_cache.has(key)) {
    const { locale, decimals } = CURRENCY_META[currency];
    // Compact always uses en-US locale so suffixes are K/M instead of 천/만
    const fmtLocale = compact ? "en-US" : locale;
    _cache.set(
      key,
      new Intl.NumberFormat(fmtLocale, {
        style: "currency",
        currency,
        ...(compact
          ? { notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 }
          : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      })
    );
  }
  return _cache.get(key)!;
}

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  return getFormatter(currency, false).format(amount);
}

export function formatCurrencyCompact(amount: number, currency: Currency = "USD"): string {
  return getFormatter(currency, true).format(amount);
}

// ─── Other formatters ─────────────────────────────────────────────────────────

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

export function formatShares(shares: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(shares);
}

export function formatDate(isoDate: string, locale = "en-US"): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthName(month: number, locale = "en-US"): string {
  return new Date(2000, month - 1, 1).toLocaleString(locale, { month: "long" });
}
