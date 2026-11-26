import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "tm-safety-banner-dismissed";

export function SafetyBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(localStorage.getItem(KEY) !== "1"), []);
  if (!show) return null;
  return (
    <div role="note" className="border-b border-border bg-elevated">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        <span aria-hidden="true" className="text-accent">⚠</span>
        <p className="flex-1">
          Tiger Market doesn't hold payments. Never pay in full up front and check the{" "}
          <Link to="/scam-database" className="text-accent hover:underline">scam database</Link> before you trade.
        </p>
        <button type="button" aria-label="Dismiss safety notice" className="hover:text-foreground" onClick={() => { localStorage.setItem(KEY, "1"); setShow(false); }}>✕</button>
      </div>
    </div>
  );
}
