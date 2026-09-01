import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getCurrentUser } from "../lib/session.functions";
import type { SessionUser } from "../lib/auth.server";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="font-mono text-xs text-muted-foreground">Error 404</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          This page doesn't exist
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The offer may have been removed, or the link is mistyped. Here's where to go next on Tiger
          Market.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link to="/" className="surface surface-hover p-4 text-sm font-medium">
            Browse all offers
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Scripting, building, UI, 3D, GFX and animation
            </span>
          </Link>
          <Link to="/post-offer" className="surface surface-hover p-4 text-sm font-medium">
            Post an offer
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              List your own Roblox dev service
            </span>
          </Link>
          <Link to="/terms-of-use" className="surface surface-hover p-4 text-sm font-medium">
            Terms of Use
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Rules for buying and selling
            </span>
          </Link>
          <Link to="/cookie-policy" className="surface surface-hover p-4 text-sm font-medium">
            Cookie Policy
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              How we use cookies
            </span>
          </Link>
        </div>

        <div className="mt-8">
          <Link to="/" className="btn-accent">
            Back to the marketplace
          </Link>
        </div>
      </main>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Reads the HttpOnly session cookie on the server so every page renders the
  // correct auth state in its first HTML response.
  loader: async (): Promise<{ user: SessionUser | null }> => ({
    user: (await getCurrentUser()) as SessionUser | null,
  }),
  head: () => ({

    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Tiger Market" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        src: "https://app.termly.io/resource-blocker/62da3507-e68f-4ef3-a756-417a2f56e9f1?autoBlock=on",
      },
    ],
  }),


  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
