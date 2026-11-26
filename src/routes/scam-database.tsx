import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/market/SiteNav";
import { SiteFooter } from "@/components/market/SiteFooter";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { fetchConfirmedReports } from "@/lib/scam.functions";
import { SITE_URL, breadcrumbJsonLd, socialImageMeta } from "@/lib/site";

const TITLE = "Roblox Scam Database & Safety Guide — Tiger Market";
const DESC = "Confirmed scam reports and common Roblox developer scams. Learn how to trade safely before you hire or pay.";

const PATTERNS = [
  ["Full payment up front", "The seller asks for 100% before any work. Split work into milestones instead."],
  ["Stolen portfolio", "Showcase images taken from other developers. Ask for a live demo or a place link."],
  ["Fake middleman", "A \"middleman\" you've never heard of joins the chat. Pick the middleman yourself."],
  ["Impersonation", "Someone copies a known developer's name. Always open the profile from the offer page."],
  ["Gift-card or crypto only", "Untraceable payment with pressure to act fast. Treat it as a red flag."],
];

export const Route = createFileRoute("/scam-database")({
  loader: async () => ({ reports: await fetchConfirmedReports() }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/scam-database` },
      { name: "twitter:card", content: "summary_large_image" },
      ...socialImageMeta,
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/scam-database` }],
    scripts: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Scam database", path: "/scam-database" }])],
  }),
  component: ScamPage,
});

function ScamPage() {
  const { reports } = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Scam database" }]} />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Scam database</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Reports from the community, reviewed before they appear here. Found something suspicious? Use "Report offer" on any offer page.
        </p>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Confirmed reports</h2>
          {reports.length === 0 ? (
            <p className="surface p-5 text-sm text-muted-foreground">No confirmed reports yet.</p>
          ) : (
            <ul className="surface divide-y divide-border">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  {r.seller_id ? (
                    <Link to="/seller/$sellerId" params={{ sellerId: r.seller_id }} className="font-medium hover:text-accent">{r.seller_name ?? r.seller_id}</Link>
                  ) : <span className="font-medium">{r.seller_name ?? "Unknown"}</span>}
                  <span className="chip capitalize">{r.reason}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{r.created_at.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Common scams</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PATTERNS.map(([t, d]) => (
              <div key={t} className="surface p-4">
                <h3 className="text-sm font-semibold">{t}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
