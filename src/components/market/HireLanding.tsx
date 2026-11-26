import { Link } from "@tanstack/react-router";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { Breadcrumbs } from "./Breadcrumbs";
import { OfferCard } from "./OfferCard";
import { DiscordButton } from "./DiscordButton";
import type { Offer } from "@/lib/market-data";
import {
  HIRE_LABELS,
  HIRE_PAGES,
  hireIndexPath,
  hirePath,
  otherLocale,
  type HireLocale,
  type HirePage,
} from "@/lib/hire-content";

/** Typed link to a hire page in either language. */
function HireLink({
  page,
  locale,
  className,
  children,
}: {
  page: HirePage;
  locale: HireLocale;
  className?: string;
  children: React.ReactNode;
}) {
  if (locale === "de") {
    return (
      <Link to="/de/hire/$slug" params={{ slug: page.slug }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/hire/$slug" params={{ slug: page.slug }} className={className}>
      {children}
    </Link>
  );
}

export function HireLandingPage({
  page,
  locale,
  offers,
}: {
  page: HirePage;
  locale: HireLocale;
  offers: Offer[];
}) {
  const copy = page[locale];
  const labels = HIRE_LABELS[locale];
  const other = otherLocale(locale);
  const related = HIRE_PAGES.filter((entry) => entry.slug !== page.slug);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Breadcrumbs
            items={[
              { label: labels.home, to: "/" },
              { label: labels.hire, to: hireIndexPath(locale) },
              { label: copy.eyebrow },
            ]}
          />
          <a
            href={hirePath(page, other)}
            hrefLang={other}
            className="chip surface-hover"
            aria-label={labels.langSwitch}
          >
            {labels.langSwitch}
          </a>
        </div>

        <section className="mt-8">
          <p className="chip">
            <span aria-hidden="true" className="mr-1 text-accent">
              {page.icon}
            </span>
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">{copy.h1}</h1>
          <div className="mt-4 max-w-2xl space-y-3 text-sm leading-relaxed text-muted-foreground">
            {copy.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/post-offer" className="btn-accent">
              {labels.postOffer}
            </Link>
            <a href="/#offers" className="btn-ghost">
              {labels.browseAll}
            </a>
            <DiscordButton label={labels.discord} />
          </div>
        </section>

        <section id="offers" className="mt-12 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-semibold sm:text-2xl">
              {labels.offersTitle(page.category)}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">{offers.length} / 6</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{labels.offersNote}</p>

          {offers.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <OfferCard key={offer.publicId} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="surface mt-4 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">{labels.emptyOffers(page.category)}</p>
              <Link to="/post-offer" className="btn-accent mt-4">
                {labels.postOffer}
              </Link>
            </div>
          )}
        </section>

        <section className="surface mt-12 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{copy.scopeTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {copy.scope.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-accent">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="hire-faq">
          <h2 id="hire-faq" className="text-xl font-semibold sm:text-2xl">
            {labels.faqTitle}
          </h2>
          <div className="mt-4 space-y-2">
            {copy.faq.map((entry) => (
              <details key={entry.q} className="surface group p-4">
                <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                  <span className="mr-2 text-accent group-open:hidden" aria-hidden="true">
                    +
                  </span>
                  <span className="mr-2 hidden text-accent group-open:inline" aria-hidden="true">
                    −
                  </span>
                  {entry.q}
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="surface mt-12 flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-semibold">{labels.ctaTitle}</h2>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{labels.ctaBody}</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/post-offer" className="btn-accent">
              {labels.postOffer}
            </Link>
            <DiscordButton label={labels.discord} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link
              to="/scam-database"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {locale === "de" ? "Betrugs-Datenbank ansehen" : "Check the scam database"}
            </Link>
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold sm:text-2xl">{labels.relatedTitle}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <HireLink
                key={entry.slug}
                page={entry}
                locale={locale}
                className="surface surface-hover flex items-center gap-3 p-4 text-sm"
              >
                <span aria-hidden="true" className="text-lg text-accent">
                  {entry.icon}
                </span>
                <span>
                  <span className="block font-medium">{entry[locale].eyebrow}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {labels.browseRole}
                  </span>
                </span>
              </HireLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export function HireIndexPage({ locale }: { locale: HireLocale }) {
  const labels = HIRE_LABELS[locale];
  const other = otherLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Breadcrumbs items={[{ label: labels.home, to: "/" }, { label: labels.hire }]} />
          <a
            href={hireIndexPath(other)}
            hrefLang={other}
            className="chip surface-hover"
            aria-label={labels.langSwitch}
          >
            {labels.langSwitch}
          </a>
        </div>

        <section className="mt-8">
          <p className="chip">{labels.hire}</p>
          <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">
            {labels.indexH1}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {labels.indexIntro}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/post-offer" className="btn-accent">
              {labels.postOffer}
            </Link>
            <a href="/#offers" className="btn-ghost">
              {labels.browseAll}
            </a>
            <DiscordButton label={labels.discord} />
          </div>
        </section>

        <section className="mt-10">
          <div className="grid gap-3 sm:grid-cols-2">
            {HIRE_PAGES.map((page) => (
              <HireLink
                key={page.slug}
                page={page}
                locale={locale}
                className="surface surface-hover flex items-start gap-3 p-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-elevated text-base text-accent"
                >
                  {page.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{page[locale].h1}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {page[locale].metaDescription}
                  </span>
                </span>
              </HireLink>
            ))}
          </div>
        </section>

        <section className="surface mt-10 flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-semibold">{labels.ctaTitle}</h2>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{labels.ctaBody}</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/post-offer" className="btn-accent">
              {labels.postOffer}
            </Link>
            <DiscordButton label={labels.discord} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
