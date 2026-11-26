/** Shared, client-safe rating rules — the server enforces exactly these. */

export const MAX_RATINGS_PER_DAY = 10;

export type RatingCheck = {
  score: unknown;
  isSelf: boolean;
  alreadyRated: boolean;
  ratingsToday: number;
};

export function normalizeScore(value: unknown): number | null {
  const score = Number(value);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}

/** Returns the user-facing error, or null when the rating may be stored. */
export function validateRating(check: RatingCheck): string | null {
  if (normalizeScore(check.score) === null) return "Pick a score from 1 to 5 stars.";
  if (check.isSelf) return "You can't rate your own offer.";
  if (check.alreadyRated) return "You already rated this offer.";
  if (check.ratingsToday >= MAX_RATINGS_PER_DAY)
    return `You can rate up to ${MAX_RATINGS_PER_DAY} offers per day. Try again tomorrow.`;
  return null;
}
