/**
 * Server-only access to the member library: favorites and saved searches.
 *
 * Both tables live in Supabase with RLS enabled and no policies, so they are
 * reachable only through the service-role client used here. `user_id` is the
 * user's public id (never an internal database id).
 */
import {
  buildSavedSearchLabel,
  sanitizeSavedSearchParams,
  type SavedSearchParams,
} from "./library-params";

export const MAX_FAVORITES = 200;
export const MAX_SAVED_SEARCHES = 20;

export type SavedSearchRecord = {
  id: string;
  label: string;
  params: SavedSearchParams;
  createdAt: string;
  lastSeenAt: string;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type SavedSearchRow = {
  id: string;
  label: string;
  params: unknown;
  created_at: string;
  last_seen_at?: string | null;
};

/* ------------------------------------------------------------------ favorites */

export async function listFavoriteIds(userPublicId: string): Promise<string[]> {
  const db = await admin();
  const { data, error } = await db
    .from("favorites")
    .select("offer_id")
    .eq("user_id", userPublicId)
    .order("created_at", { ascending: false })
    .limit(MAX_FAVORITES);

  if (error) {
    console.error("[favorites] list failed", error.message);
    throw new Error("Could not load your favorites.");
  }
  return ((data ?? []) as { offer_id: string }[]).map((row) => row.offer_id);
}

export async function addFavorite(userPublicId: string, offerId: string): Promise<void> {
  const db = await admin();
  const { count, error: countError } = await db
    .from("favorites")
    .select("offer_id", { count: "exact", head: true })
    .eq("user_id", userPublicId);
  if (countError) throw new Error("Could not load your favorites.");
  if ((count ?? 0) >= MAX_FAVORITES)
    throw new Error(`Your favorites are full (${MAX_FAVORITES}). Remove one first.`);

  // The primary key makes this idempotent, so a double click cannot duplicate.
  const { error } = await db
    .from("favorites")
    .upsert({ user_id: userPublicId, offer_id: offerId }, { onConflict: "user_id,offer_id" });
  if (error) {
    console.error("[favorites] add failed", error.message);
    throw new Error("Could not save that offer.");
  }
}

export async function removeFavorite(userPublicId: string, offerId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("favorites")
    .delete()
    .eq("user_id", userPublicId)
    .eq("offer_id", offerId);
  if (error) {
    console.error("[favorites] remove failed", error.message);
    throw new Error("Could not remove that offer.");
  }
}

/* ------------------------------------------------------------- saved searches */

function toRecord(row: SavedSearchRow): SavedSearchRecord {
  return {
    id: row.id,
    label: row.label,
    params: sanitizeSavedSearchParams(row.params),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at ?? row.created_at,
  };
}

export async function listSavedSearches(userPublicId: string): Promise<SavedSearchRecord[]> {
  const db = await admin();
  const columns = "id, label, params, created_at, last_seen_at";
  const first = await db
    .from("saved_searches")
    .select(columns)
    .eq("user_id", userPublicId)
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED_SEARCHES);

  if (!first.error) return ((first.data ?? []) as unknown as SavedSearchRow[]).map(toRecord);

  // Migration 0002 may not be applied yet: fall back to created_at as baseline.
  console.warn("[saved-searches] last_seen_at unavailable, falling back", first.error.message);
  const fallback = await db
    .from("saved_searches")
    .select("id, label, params, created_at")
    .eq("user_id", userPublicId)
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED_SEARCHES);
  if (fallback.error) {
    console.error("[saved-searches] list failed", fallback.error.message);
    throw new Error("Could not load your saved searches.");
  }
  return ((fallback.data ?? []) as unknown as SavedSearchRow[]).map(toRecord);
}

export async function createSavedSearch(
  userPublicId: string,
  rawParams: unknown,
): Promise<SavedSearchRecord> {
  const params = sanitizeSavedSearchParams(rawParams);
  const existing = await listSavedSearches(userPublicId);

  const key = JSON.stringify(params);
  if (existing.some((entry) => JSON.stringify(entry.params) === key))
    throw new Error("That search is already saved.");
  if (existing.length >= MAX_SAVED_SEARCHES)
    throw new Error(`You can save up to ${MAX_SAVED_SEARCHES} searches. Delete one first.`);

  const db = await admin();
  const { data, error } = await db
    .from("saved_searches")
    .insert({
      user_id: userPublicId,
      label: buildSavedSearchLabel(params),
      params: params as never,
    })
    .select("id, label, params, created_at")
    .single();

  if (error || !data) {
    console.error("[saved-searches] create failed", error?.message);
    throw new Error("Could not save this search.");
  }
  return toRecord(data as unknown as SavedSearchRow);
}

export async function deleteSavedSearch(userPublicId: string, id: string): Promise<void> {
  const db = await admin();
  const { data, error } = await db
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", userPublicId)
    .select("id");

  if (error) {
    console.error("[saved-searches] delete failed", error.message);
    throw new Error("Could not delete this search.");
  }
  // Scoping by user_id is what prevents deleting someone else's row.
  if (!data || data.length === 0) throw new Error("Search not found.");
}

/** Resets the "new matches" baseline for the member's saved searches. */
export async function touchSavedSearches(userPublicId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("saved_searches")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userPublicId);
  // Missing column (migration not applied) must not break the dashboard.
  if (error) console.warn("[saved-searches] could not update last_seen_at", error.message);
}
