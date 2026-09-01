import { Link } from "@tanstack/react-router";

/** Static destinations breadcrumbs are allowed to link to. */
export type BreadcrumbPath = "/" | "/post-offer" | "/cookie-policy" | "/terms-of-use";

export type BreadcrumbItem = {
  label: string;
  to?: BreadcrumbPath;
};

/**
 * Accessible breadcrumb trail. The matching BreadcrumbList JSON-LD is emitted
 * from each route's head() via breadcrumbJsonLd().
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link to={item.to} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-foreground/70">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
