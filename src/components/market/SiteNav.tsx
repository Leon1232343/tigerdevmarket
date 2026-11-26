import { Link, useLoaderData, useRouterState } from "@tanstack/react-router";
import type { SessionUser } from "@/lib/auth.server";

/**
 * Sticky site navigation. The signed-in user comes from the server-rendered
 * root loader, which reads the HttpOnly session cookie — no client-side auth
 * state, so the correct state is in the first HTML response.
 */
export function SiteNav() {
  const { user } = useLoaderData({ from: "__root__" }) as { user: SessionUser | null };
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const loginHref = `/api/auth/discord/login?returnTo=${encodeURIComponent(pathname)}`;

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
          <span className="font-display text-base font-semibold tracking-tight">Tiger Market</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#categories" className="transition-colors hover:text-foreground">
            Categories
          </a>
          <a href="/#offers" className="transition-colors hover:text-foreground">
            Offers
          </a>
          <Link to="/post-offer" className="transition-colors hover:text-foreground">
            Post an offer
          </Link>
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          {user && (
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm underline-offset-4 hover:text-accent hover:underline"
              title="Your dashboard"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName ?? user.username} profile picture`}
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 rounded-full border border-border"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-accent"
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">{user.displayName ?? user.username}</span>
            </Link>
            {/* Logout is a POST form so it can't be triggered by a stray GET. */}
            <form method="post" action="/api/auth/logout">
              <input type="hidden" name="returnTo" value={pathname} />
              <button
                type="submit"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Log out
              </button>
            </form>
          </div>
        ) : (
          <a href={loginHref} className="btn-accent" rel="nofollow">
            <span aria-hidden="true">◈</span>
            <span className="hidden sm:inline">Login with Discord</span>
            <span className="sm:hidden">Login</span>
          </a>
        )}
      </nav>
    </header>
  );
}
