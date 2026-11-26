import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLoaderData, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { SessionUser } from "@/lib/auth.server";
import { buildSavedSearchLabel, type SavedSearchParams } from "@/lib/library-params";
import { createSavedSearch } from "@/lib/saved-searches.functions";

/** One-click "save this search" for the active filters on the marketplace. */
export function SaveSearchButton({ params }: { params: SavedSearchParams }) {
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const save = useServerFn(createSavedSearch);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?returnTo=${encodeURIComponent(pathname)}`}
        rel="nofollow"
        className="btn-ghost text-xs"
      >
        Save this search
      </a>
    );
  }

  async function onSave() {
    setStatus("saving");
    setMessage(null);
    try {
      await save({ data: { params } });
      setStatus("saved");
      await queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (cause) {
      setStatus("idle");
      setMessage(cause instanceof Error ? cause.message : "Could not save this search.");
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="btn-ghost text-xs"
        onClick={() => void onSave()}
        disabled={status !== "idle"}
        title={`Save “${buildSavedSearchLabel(params)}”`}
      >
        {status === "saved" ? "Saved ✓" : status === "saving" ? "Saving…" : "Save this search"}
      </button>
      {status === "saved" && (
        <Link
          to="/dashboard"
          search={{ tab: "searches" }}
          className="text-xs text-accent hover:underline"
        >
          Open in dashboard
        </Link>
      )}
      {message && (
        <span role="alert" className="text-xs text-destructive-foreground">
          {message}
        </span>
      )}
    </span>
  );
}
