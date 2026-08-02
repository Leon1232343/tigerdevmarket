import { Link } from "@tanstack/react-router";
import { useState } from "react";

/**
 * Sticky site navigation. Shows both auth states — the toggle stands in for a
 * server-rendered session check (`{% if current_user %}` when ported).
 */
export function SiteNav({ username = "tigerdev" }: { username?: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link to="/" className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">
            🐯
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Tiger Market
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#categories" className="transition-colors hover:text-foreground">
            Categories
          </a>
          <a href="/#offers" className="transition-colors hover:text-foreground">
            Offers
          </a>
        </div>

        {loggedIn ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-accent"
              >
                {username.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{username}</span>
            </span>
            <button
              type="button"
              onClick={() => setLoggedIn(false)}
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Log out
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setLoggedIn(true)} className="btn-accent">
            <span aria-hidden="true">◈</span>
            <span className="hidden sm:inline">Login with Discord</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}
      </nav>
    </header>
  );
}
