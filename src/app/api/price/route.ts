import { NextRequest, NextResponse } from "next/server";

// Fetches stock price from Yahoo Finance (unofficial, no API key needed)
// Deployed on Vercel — server-side to avoid CORS issues
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker || !/^[A-Za-z0-9.^-]{1,10}$/.test(ticker)) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  try {
    const symbol = ticker.toUpperCase();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Vercel edge cache 5 min
    });

    if (!res.ok) throw new Error(`Yahoo responded ${res.status}`);

    const data = (await res.json()) as {
      chart: {
        result: Array<{
          meta: { regularMarketPrice: number; currency: string };
        }>;
        error: unknown;
      };
    };

    if (data.chart.error || !data.chart.result?.[0]) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    const { regularMarketPrice: price, currency } = data.chart.result[0].meta;

    return NextResponse.json(
      { ticker: symbol, price, currency },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch {
    return NextResponse.json({ error: "Price unavailable" }, { status: 502 });
  }
}
