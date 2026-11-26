/**
 * Server-only rating writes. Ratings live in the offers database (Neon), which
 * is the single source the marketplace reads averages and counts from.
 */
import { query } from "@/lib/offers.server";
import { normalizeScore, validateRating } from "@/lib/ratings-rules";
import type { SessionUser } from "@/lib/auth.server";

export type MyRating = { offerId: string; score: number; createdAt: string | null };

/** Stores a 1-5 rating; throws a user-facing message when a rule blocks it. */
export async function rateOffer(
  user: SessionUser,
  offerId: string,
  rawScore: unknown,
): Promise<{ score: number }> {
  const numericId = Number(offerId);
  const score = normalizeScore(rawScore);
  if (!Number.isInteger(numericId) || numericId <= 0) throw new Error("Invalid offer.");
  if (score === null) throw new Error("Pick a score from 1 to 5 stars.");

  const [offer] = await query<{ seller_id: string | null }>(
    "SELECT seller_id FROM offers WHERE offer_id = $1 LIMIT 1",
    [numericId],
  );
  if (!offer) throw new Error("That offer no longer exists.");

  const [existing] = await query<{ rating_id: number }>(
    "SELECT rating_id FROM ratings WHERE offer_id = $1 AND rater_id = $2 LIMIT 1",
    [numericId, user.discordId],
  );
  const [today] = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM ratings
      WHERE rater_id = $1 AND timestamp > now() - interval '24 hours'`,
    [user.discordId],
  );

  const problem = validateRating({
    score,
    isSelf: offer.seller_id !== null && offer.seller_id === user.discordId,
    alreadyRated: Boolean(existing),
    ratingsToday: Number(today?.total ?? 0),
  });
  if (problem) throw new Error(problem);

  try {
    await query(
      "INSERT INTO ratings (offer_id, rater_id, score, timestamp) VALUES ($1, $2, $3, now())",
      [numericId, user.discordId, score],
    );
  } catch (error) {
    // 23505 = unique violation, in case the table also enforces one per rater.
    if ((error as { code?: string }).code === "23505")
      throw new Error("You already rated this offer.");
    throw error;
  }

  return { score };
}

export async function listMyRatings(discordId: string): Promise<MyRating[]> {
  const rows = await query<{ offer_id: number; score: number; timestamp: Date | string | null }>(
    `SELECT offer_id, score, timestamp FROM ratings
      WHERE rater_id = $1
      ORDER BY timestamp DESC NULLS LAST
      LIMIT 100`,
    [discordId],
  );

  return rows.map((row) => ({
    offerId: String(row.offer_id),
    score: Number(row.score) || 0,
    createdAt: row.timestamp ? new Date(row.timestamp).toISOString() : null,
  }));
}
