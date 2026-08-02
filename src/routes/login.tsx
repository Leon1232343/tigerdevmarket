import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search["error"] === "1" ? ("1" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in with Discord — Tiger Market" },
      {
        name: "description",
        content:
          "Sign in to Tiger Market with your Discord account to post offers, contact sellers and confirm trades.",
      },
      { property: "og:title", content: "Sign in — Tiger Market" },
      {
        property: "og:description",
        content: "Tiger Market uses Discord to sign you in. No passwords, no extra accounts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { error } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="surface w-full max-w-sm p-6 sm:p-8">
          <h1 className="text-xl font-semibold">Sign in to Tiger Market</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            We use Discord so buyers and sellers can verify who they're dealing with. Tiger Market
            never sees your Discord password.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive-foreground"
            >
              That sign-in attempt couldn't be completed. Please try again.
            </p>
          )}

          <a href="/api/auth/discord/login" className="btn-accent mt-6 w-full" rel="nofollow">
            <span aria-hidden="true">◈</span> Continue with Discord
          </a>

          <Link
            to="/"
            className="mt-5 block text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to offers
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
