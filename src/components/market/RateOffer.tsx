import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLoaderData, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SessionUser } from "@/lib/auth.server";
import { submitRating } from "@/lib/ratings.functions";

/**
 * 1-5 star rating form. Hidden for guests (login link) and for the seller of
 * the offer; every rule is re-checked on the server.
 */
export function RateOffer({ offerId, sellerId }: { offerId: string; sellerId: string | null }) {
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const router = useRouter();
  const queryClient = useQueryClient();
  const submit = useServerFn(submitRating);

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-xs text-muted-foreground">
        <a
          href={`/api/auth/discord/login?returnTo=${encodeURIComponent(pathname)}`}
          rel="nofollow"
          className="text-accent underline-offset-4 hover:underline"
        >
          Sign in with Discord
        </a>{" "}
        to rate this offer.
      </p>
    );
  }

  if (sellerId && sellerId === user.discordId) {
    return (
      <p className="text-xs text-muted-foreground">This is your own offer — you can't rate it.</p>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (score < 1) {
      setMessage("Pick a score from 1 to 5 stars.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    try {
      await submit({ data: { offerId, score } });
      setStatus("sent");
      await router.invalidate();
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (cause) {
      setStatus("idle");
      setMessage(cause instanceof Error ? cause.message : "Could not save your rating.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface mt-6 p-5">
      <fieldset disabled={status !== "idle"}>
        <legend className="text-sm font-semibold">Rate this seller</legend>
        <p className="mt-1 text-xs text-muted-foreground">
          One rating per offer. It counts towards the seller's average.
        </p>

        <div className="mt-3 flex items-center gap-1" role="group" aria-label="Score">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={score === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onClick={() => setScore(value)}
              className={`rounded px-0.5 text-2xl leading-none transition-colors ${
                value <= score
                  ? "text-gold"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {score > 0 ? `${score}/5` : "not rated"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-accent text-xs" disabled={status !== "idle"}>
            {status === "sending"
              ? "Saving…"
              : status === "sent"
                ? "Rating saved ✓"
                : "Submit rating"}
          </button>
          {status === "sent" && (
            <p role="status" className="text-xs text-gold">
              Thanks — your rating is live.
            </p>
          )}
          {message && (
            <p role="alert" className="text-xs text-destructive-foreground">
              {message}
            </p>
          )}
        </div>
      </fieldset>
    </form>
  );
}
