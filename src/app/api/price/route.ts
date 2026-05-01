import { NextRequest, NextResponse } from "next/server";

// Detect Korean KRX tickers — always exactly 6 digits
function isKoreanTicker(t: string): boolean {
  return /^\d{6}$/.test(t);
}

async function fetchYahoo(symbol: string): Promise<{ price: number; currency: string } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    chart: {
      result: Array<{ meta: { regularMarketPrice: number; currency: string } }> | null;
      error: unknown;
    };
  };

  if (data.chart.error || !data.chart.result?.[0]) return null;
  const { regularMarketPrice: price, currency } = data.chart.result[0].meta;
  return { price, currency };
}

// Ticker validation — allow alphanumeric + . ^ - and pure 6-digit KRX codes
const TICKER_RE = /^[A-Za-z0-9.^-]{1,10}$/;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker || !TICKER_RE.test(ticker)) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  try {
    const upper = ticker.toUpperCase();

    if (isKoreanTicker(upper)) {
      // Try KOSPI first, then KOSDAQ
      const result =
        (await fetchYahoo(`${upper}.KS`)) ?? (await fetchYahoo(`${upper}.KQ`));
      if (!result) {
        return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
      }
      return NextResponse.json(
        { ticker: upper, price: result.price, currency: result.currency || "KRW" },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    }

    // Standard US/international ticker
    const result = await fetchYahoo(upper);
    if (!result) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }
    return NextResponse.json(
      { ticker: upper, price: result.price, currency: result.currency },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json({ error: "Price unavailable" }, { status: 502 });
  }
}
