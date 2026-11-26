import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLoaderData, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart } from "lucide-react";
import type { SessionUser } from "@/lib/auth.server";
import { fetchFavoriteIds, toggleFavorite } from "@/lib/favorites.functions";

const IDS_KEY = ["favorites", "ids"];

/**
 * Heart toggle for one offer. Guests get a login link, members get an
 * optimistic toggle that survives navigation and reloads.
 */
export function FavoriteButton({
  offerId,
  variant = "icon",
}: {
  offerId: string;
  variant?: "icon" | "inline";
}) {
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const toggle = useServerFn(toggleFavorite);
  const [error, setError] = useState<string | null>(null);

  const { data: ids } = useQuery({
    queryKey: IDS_KEY,
    queryFn: () => fetchFavoriteIds(),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const favorited = ids?.includes(offerId) ?? false;

  const mutation = useMutation({
    mutationFn: (next: boolean) => toggle({ data: { offerId, favorite: next } }),
    onMutate: async (next: boolean) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(IDS_KEY);
      queryClient.setQueryData<string[]>(IDS_KEY, (current = []) =>
        next ? [...new Set([...current, offerId])] : current.filter((id) => id !== offerId),
      );
      return { previous };
    },
    onError: (cause, _next, context) => {
      if (context?.previous) queryClient.setQueryData(IDS_KEY, context.previous);
      setError(cause instanceof Error ? cause.message : "Could not save that offer.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?returnTo=${encodeURIComponent(pathname)}`}
        rel="nofollow"
        aria-label="Sign in with Discord to save offers"
        title="Sign in to save offers"
        className={variant === "icon" ? iconClass(false) : "btn-ghost text-xs"}
      >
        <Heart aria-hidden="true" className="h-4 w-4" />
        {variant === "inline" && <span>Save</span>}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      disabled={mutation.isPending}
      onClick={(event) => {
        // The card behind the button is a link; never navigate on a toggle.
        event.preventDefault();
        event.stopPropagation();
        mutation.mutate(!favorited);
      }}
      className={
        variant === "icon"
          ? iconClass(favorited)
          : `btn-ghost text-xs ${favorited ? "text-accent" : ""}`
      }
    >
      <Heart aria-hidden="true" className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
      {variant === "inline" && <span>{favorited ? "Saved" : "Save"}</span>}
      <span role="status" className="sr-only">
        {error ?? ""}
      </span>
    </button>
  );
}

function iconClass(favorited: boolean): string {
  return `inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors ${
    favorited ? "text-accent" : "text-muted-foreground hover:text-foreground"
  } disabled:opacity-60`;
}
