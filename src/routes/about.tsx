import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/site";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Tiger Market — Founder & Developer Leon Fricke" },
      {
        name: "description",
        content:
          "About Tiger Market, a marketplace and discovery platform for Roblox developers. Built as an independent developer project by founder and developer Leon Fricke.",
      },
      { property: "og:title", content: "About Tiger Market — Founder & Developer Leon Fricke" },
      {
        property: "og:description",
        content:
          "Tiger Market is a marketplace and discovery platform for Roblox developers, built by founder and developer Leon Fricke.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/about" }],
    scripts: [
      breadcrumbJsonLd([
        { name: "Tiger Market", path: "/" },
        { name: "About", path: "/about" },
      ]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: "Leon Fricke",
            jobTitle: "Founder & Developer",
            url: SITE_URL + "/about",
          },
        }),
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <Link
          to="/"
          className="mb-8 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Tiger Market
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          About Tiger Market
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          What Tiger Market is, who builds it, and where it is headed.
        </p>

        <article className="mt-10 space-y-10 leading-7">
          <section>
            <h2 className="text-xl font-semibold text-foreground">What is Tiger Market?</h2>
            <p className="mt-3 text-sm text-foreground/90">
              Tiger Market is a marketplace and discovery platform for Roblox developers. It
              connects developers and development communities and makes it easier to discover
              development services, creators and opportunities across multiple Roblox developer
              communities.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Instead of digging through scattered Discord servers and forum threads, developers can
              browse a single, always-updating feed of live offers — hiring, for-hire, buying,
              selling and investment — with smart search to find the right service or creator
              quickly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">Founder & Developer</h2>
            <dl className="mt-4 divide-y divide-border">
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </dt>
                <dd className="text-sm font-semibold text-foreground">Leon Fricke</dd>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </dt>
                <dd className="text-sm text-foreground">Founder & Developer</dd>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Project
                </dt>
                <dd className="text-sm text-foreground">Tiger Market / Tiger Dev Market</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">About the Project</h2>
            <p className="mt-3 text-sm text-foreground/90">
              Tiger Market is built as an independent developer project. The focus is on Roblox
              development, developer services and community discovery — bringing live offers from
              multiple Roblox developer communities together in one place.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              The platform is designed, developed and operated by Leon Fricke, covering the
              marketplace experience itself as well as the underlying infrastructure: live offer
              discovery, AI-powered smart search and Discord-based sign-in.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link to="/" className="surface surface-hover p-4 text-sm font-medium">
              Browse live offers
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
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
