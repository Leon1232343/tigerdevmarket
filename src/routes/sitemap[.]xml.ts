import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getAllOfferIds } from "@/lib/offers.server";
import { HIRE_PAGES } from "@/lib/hire-content";

const BASE_URL = "https://tigermarket.bg5.net";

interface SitemapEntry {
  path: string;
  lastmod?: string | undefined;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/scam-database", changefreq: "weekly", priority: "0.6" },
          { path: "/post-offer", changefreq: "monthly", priority: "0.7" },
          { path: "/advertise", changefreq: "monthly", priority: "0.4" },
          { path: "/stats", changefreq: "daily", priority: "0.6" },
          { path: "/hire", changefreq: "weekly", priority: "0.8" },
          { path: "/de/hire", changefreq: "weekly", priority: "0.7" },
          ...HIRE_PAGES.flatMap((page) => [
            { path: `/hire/${page.slug}`, changefreq: "weekly" as const, priority: "0.8" },
            { path: `/de/hire/${page.slug}`, changefreq: "weekly" as const, priority: "0.7" },
          ]),
          { path: "/cookie-policy", changefreq: "monthly", priority: "0.3" },
          { path: "/terms-of-use", changefreq: "monthly", priority: "0.3" },
        ];

        const offerIds = await getAllOfferIds();
        for (const { offerId, postedAt } of offerIds) {
          entries.push({
            path: `/offers/${offerId}`,
            lastmod: postedAt || undefined,
            changefreq: "weekly",
            priority: "0.6",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            // The sitemap is rebuilt from the database on every miss and can exceed
            // a megabyte, so let the edge hold it for a day.
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
