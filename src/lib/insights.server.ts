/**
 * Aggregated numbers for /admin. Members live in Supabase, offers and ad clicks
 * in the Tiger Market Postgres, so every series is built from its own source.
 * A failing source degrades to an empty series instead of breaking the panel.
 */
import { query } from "./offers.server";

export type DailyPoint = { day: string; value: number };

export type AdminInsights = {
  days: number;
  totals: {
    members: number;
    newMembers: number;
    newOffers: number;
    adClicks: number;
    /** Ad revenue in euro: counted clicks × price per click. */
    revenue: number;
  };
  members: DailyPoint[];
  offers: DailyPoint[];
  clicks: DailyPoint[];
  revenue: DailyPoint[];
};

const WINDOW_DAYS = 30;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Zero-filled buckets ending today, so the charts keep their axis on quiet days. */
function emptySeries(days = WINDOW_DAYS): DailyPoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - 1 - index));
    return { day: dayKey(date), value: 0 };
  });
}

function add(series: DailyPoint[], day: string, value: number): void {
  const bucket = series.find((point) => point.day === day);
  if (bucket) bucket.value += value;
}

function sum(series: DailyPoint[]): number {
  return series.reduce((total, point) => total + point.value, 0);
}

async function memberSeries(): Promise<{ series: DailyPoint[]; total: number }> {
  const series = emptySeries();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (WINDOW_DAYS - 1));

  const { data, count, error } = await supabaseAdmin
    .from("users")
    .select("created_at", { count: "exact" })
    .gte("created_at", since.toISOString())
    .limit(10000);

  if (error) {
    console.warn("[insights] member series failed", error.message);
    return { series, total: 0 };
  }

  const rows = (data ?? []) as { created_at: string }[];
  for (const row of rows) add(series, String(row.created_at).slice(0, 10), 1);

  return { series, total: count ?? rows.length };
}

async function offerSeries(series: DailyPoint[]): Promise<void> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (WINDOW_DAYS - 1));

  const rows = await query<{ day: string; value: number }>(
    `SELECT to_char(o.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS value
       FROM offers o
      WHERE o.timestamp >= $1
      GROUP BY 1`,
    [since.toISOString()],
  );

  for (const row of rows) add(series, row.day, Number(row.value));
}

async function clickSeries(clicks: DailyPoint[], revenue: DailyPoint[]): Promise<void> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (WINDOW_DAYS - 1));

  const rows = await query<{ day: string; clicks: number; revenue: number }>(
    `SELECT to_char(c.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS clicks,
            COALESCE(SUM(CASE WHEN c.counted = 1 THEN COALESCE(a.price_per_click, 0) ELSE 0 END), 0)::float8
              AS revenue
       FROM ad_clicks c
       LEFT JOIN ads a ON a.ad_id = c.ad_id
      WHERE c.timestamp >= $1
      GROUP BY 1`,
    [since.toISOString()],
  );

  for (const row of rows) {
    add(clicks, row.day, Number(row.clicks));
    add(revenue, row.day, Number(row.revenue));
  }
}

export async function getAdminInsights(): Promise<AdminInsights> {
  const offers = emptySeries();
  const clicks = emptySeries();
  const revenue = emptySeries();

  const [members, offersResult, clicksResult] = await Promise.allSettled([
    memberSeries(),
    offerSeries(offers),
    clickSeries(clicks, revenue),
  ]);

  if (offersResult.status === "rejected")
    console.warn("[insights] offers failed", offersResult.reason);
  if (clicksResult.status === "rejected")
    console.warn("[insights] clicks failed", clicksResult.reason);

  let memberData = { series: emptySeries(), total: 0 };
  if (members.status === "fulfilled") {
    memberData = members.value;
  } else {
    console.warn("[insights] members failed", members.reason);
  }

  return {
    days: WINDOW_DAYS,
    totals: {
      members: memberData.total,
      newMembers: sum(memberData.series),
      newOffers: sum(offers),
      adClicks: sum(clicks),
      revenue: sum(revenue),
    },
    members: memberData.series,
    offers,
    clicks,
    revenue,
  };
}
