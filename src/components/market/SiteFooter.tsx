import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <p>🐯 Tiger Market — a marketplace for Roblox developers.</p>
          <Link
            to="/about"
            className="transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link to="/scam-database" className="transition-colors hover:text-foreground">
            Scam database
          </Link>
          <Link
            to="/cookie-policy"
            className="transition-colors hover:text-foreground"
          >
            Cookie Policy
          </Link>
          <Link
            to="/terms-of-use"
            className="transition-colors hover:text-foreground"
          >
            Terms of Use
          </Link>
        </div>
        <p>Never pay upfront without a verified middleman.</p>
      </div>
    </footer>
  );
}
