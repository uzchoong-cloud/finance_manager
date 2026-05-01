/**
 * Demo seed helpers.
 *
 * All seeded records are marked so they can be identified and wiped cleanly:
 *   - Transactions : notes = "__demo__"
 *   - Stock holdings: name prefixed with "[Demo] "
 *
 * Nothing here touches real data.
 */
import { supabase } from "./supabase";

const DEMO_NOTES = "__demo__";
const DEMO_NAME_PREFIX = "[Demo] ";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  const y = 2026;

  // ── Transactions ─────────────────────────────────────────────────────────
  const txRows = [
    // ── February ──
    { type: "income",  amount: 4800000, category: "salary",        description: "월급 (2월)",       date: iso(y, 2,  5) },
    { type: "expense", amount: 1200000, category: "housing",       description: "월세",             date: iso(y, 2,  5) },
    { type: "expense", amount:   58000, category: "utilities",     description: "핸드폰 요금",       date: iso(y, 2,  8) },
    { type: "expense", amount:   95000, category: "utilities",     description: "공과금",            date: iso(y, 2, 10) },
    { type: "expense", amount:  320000, category: "food",          description: "식료품",            date: iso(y, 2, 12) },
    { type: "expense", amount:   87000, category: "food",          description: "점심 외식",         date: iso(y, 2, 14) },
    { type: "expense", amount:   42000, category: "transport",     description: "교통비",            date: iso(y, 2, 16) },
    { type: "expense", amount:  180000, category: "shopping",      description: "의류 구매",         date: iso(y, 2, 19) },
    { type: "expense", amount:   65000, category: "entertainment", description: "영화 / 넷플릭스",   date: iso(y, 2, 22) },
    { type: "expense", amount:   75000, category: "healthcare",    description: "병원 / 약국",       date: iso(y, 2, 25) },
    { type: "income",  amount:  350000, category: "freelance",     description: "프리랜서 수입",     date: iso(y, 2, 28) },

    // ── March ──
    { type: "income",  amount: 4800000, category: "salary",        description: "월급 (3월)",       date: iso(y, 3,  5) },
    { type: "expense", amount: 1200000, category: "housing",       description: "월세",             date: iso(y, 3,  5) },
    { type: "expense", amount:   58000, category: "utilities",     description: "핸드폰 요금",       date: iso(y, 3,  8) },
    { type: "expense", amount:   88000, category: "utilities",     description: "공과금",            date: iso(y, 3, 10) },
    { type: "expense", amount:  290000, category: "food",          description: "식료품",            date: iso(y, 3, 11) },
    { type: "expense", amount:  120000, category: "food",          description: "저녁 외식 (2회)",   date: iso(y, 3, 15) },
    { type: "expense", amount:   38000, category: "transport",     description: "교통비",            date: iso(y, 3, 17) },
    { type: "expense", amount:  450000, category: "shopping",      description: "봄 의류",           date: iso(y, 3, 20) },
    { type: "expense", amount:   13900, category: "entertainment", description: "넷플릭스",          date: iso(y, 3, 22) },
    { type: "expense", amount:  200000, category: "education",     description: "온라인 강의",       date: iso(y, 3, 25) },
    { type: "income",  amount:  500000, category: "freelance",     description: "프리랜서 수입",     date: iso(y, 3, 30) },

    // ── April ──
    { type: "income",  amount: 4800000, category: "salary",        description: "월급 (4월)",       date: iso(y, 4,  5) },
    { type: "expense", amount: 1200000, category: "housing",       description: "월세",             date: iso(y, 4,  5) },
    { type: "expense", amount:   58000, category: "utilities",     description: "핸드폰 요금",       date: iso(y, 4,  8) },
    { type: "expense", amount:  102000, category: "utilities",     description: "공과금",            date: iso(y, 4, 10) },
    { type: "expense", amount:  270000, category: "food",          description: "식료품",            date: iso(y, 4, 12) },
    { type: "expense", amount:   95000, category: "food",          description: "외식",              date: iso(y, 4, 16) },
    { type: "expense", amount:   47000, category: "transport",     description: "교통비",            date: iso(y, 4, 18) },
    { type: "expense", amount:   13900, category: "entertainment", description: "넷플릭스",          date: iso(y, 4, 20) },
    { type: "expense", amount:   85000, category: "entertainment", description: "콘서트 티켓",       date: iso(y, 4, 22) },
    { type: "expense", amount:   55000, category: "healthcare",    description: "병원비",            date: iso(y, 4, 25) },
    { type: "expense", amount:  320000, category: "shopping",      description: "가전제품",          date: iso(y, 4, 27) },
  ];

  const { error: txErr } = await supabase.from("transactions").insert(
    txRows.map((r) => ({ ...r, notes: DEMO_NOTES }))
  );
  if (txErr) throw new Error(`트랜잭션 생성 실패: ${txErr.message}`);

  // ── Stock holdings ────────────────────────────────────────────────────────
  type HoldingDef = { ticker: string; rawName: string; shares: number; avg: number; buyDate: string };
  const holdings: HoldingDef[] = [
    { ticker: "005930", rawName: "삼성전자",     shares: 15, avg:  73000, buyDate: iso(y, 1, 10) },
    { ticker: "035420", rawName: "NAVER",         shares:  5, avg: 183000, buyDate: iso(y, 1, 15) },
    { ticker: "000660", rawName: "SK하이닉스",    shares:  8, avg: 132000, buyDate: iso(y, 2,  3) },
    { ticker: "035720", rawName: "카카오",         shares: 20, avg:  40500, buyDate: iso(y, 2, 20) },
    { ticker: "AAPL",   rawName: "Apple Inc.",    shares:  5, avg:  182.5, buyDate: iso(y, 1, 20) },
  ];

  for (const h of holdings) {
    const demoName = `${DEMO_NAME_PREFIX}${h.rawName}`;

    const { data: holding, error: hErr } = await supabase
      .from("stock_holdings")
      .insert({ ticker: h.ticker, name: demoName, shares: h.shares, average_cost_per_share: h.avg })
      .select()
      .single();
    if (hErr) throw new Error(`종목 생성 실패 (${h.ticker}): ${hErr.message}`);

    const { error: stErr } = await supabase.from("stock_transactions").insert({
      holding_id: holding.id, ticker: h.ticker,
      type: "buy", shares: h.shares, price_per_share: h.avg, date: h.buyDate,
      notes: DEMO_NOTES,
    });
    if (stErr) throw new Error(`주식 거래 내역 생성 실패: ${stErr.message}`);
  }
}

// ─── Clear ───────────────────────────────────────────────────────────────────

export async function clearDemoData(): Promise<void> {
  // Delete demo transactions
  const { error: txErr } = await supabase
    .from("transactions")
    .delete()
    .eq("notes", DEMO_NOTES);
  if (txErr) throw new Error(`트랜잭션 삭제 실패: ${txErr.message}`);

  // Find demo holdings by name prefix, then delete (cascade removes stock_transactions)
  const { data: demoHoldings, error: fetchErr } = await supabase
    .from("stock_holdings")
    .select("id")
    .like("name", `${DEMO_NAME_PREFIX}%`);
  if (fetchErr) throw new Error(`종목 조회 실패: ${fetchErr.message}`);

  if (demoHoldings && demoHoldings.length > 0) {
    const ids = demoHoldings.map((h) => h.id as string);
    const { error: delErr } = await supabase
      .from("stock_holdings")
      .delete()
      .in("id", ids);
    if (delErr) throw new Error(`종목 삭제 실패: ${delErr.message}`);
  }
}

export async function hasDemoData(): Promise<boolean> {
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("notes", DEMO_NOTES);
  return (count ?? 0) > 0;
}
