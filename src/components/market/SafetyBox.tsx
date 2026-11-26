import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Offer } from "@/lib/market-data";

const REASONS = [
  { value: "scam", label: "Scam / took payment" },
  { value: "fake", label: "Fake or stolen work" },
  { value: "impersonation", label: "Impersonation" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
] as const;

export function SafetyBox({ offer, url }: { offer: Offer; url: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("scam");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: offer.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase.from("offer_reports").insert({
      offer_id: offer.publicId,
      seller_id: offer.sellerId,
      seller_name: offer.seller.slice(0, 80),
      reason,
      details: details.trim().slice(0, 1000),
    });
    setState(error ? "error" : "sent");
  }

  return (
    <aside className="surface mt-6 p-5" aria-labelledby="safety-title">
      <h2 id="safety-title" className="text-sm font-semibold">Stay safe on this deal</h2>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <li>• Never pay 100% up front — split into milestones.</li>
        <li>• Use a trusted middleman for Robux or larger payments.</li>
        <li>• Keep every agreement in writing in Discord.</li>
        <li>• Check the seller's profile and the <Link to="/scam-database" className="text-accent hover:underline">scam database</Link>.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={share} className="btn-ghost text-xs">
          {copied ? "Link copied ✓" : "Share offer"}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost text-xs" aria-expanded={open}>
          Report offer
        </button>
      </div>
      {open && state !== "sent" && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs">
            Reason
            <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="field mt-1 w-full">
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label className="block text-xs">
            What happened? (optional)
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} className="field mt-1 w-full" />
          </label>
          <button type="submit" disabled={state === "sending"} className="btn-accent text-xs">
            {state === "sending" ? "Sending…" : "Send report"}
          </button>
          {state === "error" && <p role="alert" className="text-xs text-destructive-foreground">Could not send the report. Please try again.</p>}
        </form>
      )}
      {state === "sent" && <p className="mt-3 text-xs text-muted-foreground">Thanks — we'll review this report.</p>}
    </aside>
  );
}
