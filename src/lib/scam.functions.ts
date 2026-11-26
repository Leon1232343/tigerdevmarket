import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type ConfirmedReport = { id: string; seller_id: string | null; seller_name: string | null; reason: string; created_at: string };

/** Public list of owner-confirmed scam reports (RLS only exposes status = confirmed). */
export const fetchConfirmedReports = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("offer_reports")
    .select("id, seller_id, seller_name, reason, created_at")
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.error("[scam-db]", error.message); return [] as ConfirmedReport[]; }
  return (data ?? []) as ConfirmedReport[];
});
