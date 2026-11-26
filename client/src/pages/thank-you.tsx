import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Link, useSearch } from "wouter";
import { Storefront } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { loadPluvus, pluvusTrackerId, readPluvusClickId } from "@/lib/pluvus";
import { formatCheckoutAmount, getHangoutPass, type CheckoutSession } from "@shared/checkout";

const trackedSessions = new Set<string>();

async function trackBrowserConversion(session: CheckoutSession) {
  const key = `pluvus-conversion:${session.id}`;
  if (trackedSessions.has(session.id)) return "Browser attribution already ran for this payment.";
  try {
    if (sessionStorage.getItem(key)) return "Browser attribution already ran for this payment.";
  } catch {
    // In-memory tracking still deduplicates during the current page visit.
  }

  const pluvus = await loadPluvus();
  if (!pluvusTrackerId || !pluvus?.trackConversion) return "Set up the Pluvus test tracker to run browser attribution.";
  if (!readPluvusClickId()) return "Visit through a Pluvus test affiliate link to test attribution.";
  if (trackedSessions.has(session.id)) return "Browser attribution already ran for this payment.";
  trackedSessions.add(session.id);

  try {
    await pluvus.trackConversion({
      amount: session.amount_total / 100,
      currency: session.currency,
      externalId: session.id,
    });
  } catch {
    trackedSessions.delete(session.id);
    return "Browser attribution failed. Refresh to retry.";
  }

  try {
    sessionStorage.setItem(key, "sent");
  } catch {
    // The Stripe session ID also serves as the external conversion ID.
  }
  return "Browser attribution ran. Check the test campaign in Pluvus for the result.";
}

export default function ThankYou() {
  const sessionId = new URLSearchParams(useSearch()).get("session_id");
  const [trackingMessage, setTrackingMessage] = useState<string>();
  const verification = useQuery<CheckoutSession>({
    queryKey: ["checkout-session", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/session/${encodeURIComponent(sessionId!)}`, { signal });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error ?? "Could not verify this Stripe test checkout.");
      return data;
    },
  });
  const session = verification.data;
  const paid = session?.status === "paid";
  const checking = Boolean(sessionId) && verification.isFetching;
  const pass = getHangoutPass(session?.offer);

  useEffect(() => {
    if (session?.status !== "paid" || session.tracking_mode !== "client-side") return;
    let active = true;
    void trackBrowserConversion(session).then((message) => {
      if (active) setTrackingMessage(message);
    });
    return () => { active = false; };
  }, [session]);

  let title = "No test payment to display";
  let description = "Choose a hangout pass to start a Stripe test checkout.";
  if (paid) {
    title = "Test payment complete";
    description = "Stripe confirmed your simulated payment.";
  } else if (checking) {
    title = "Checking your payment";
    description = "Verifying your test checkout with Stripe.";
  } else if (session?.status === "expired") {
    title = "Test checkout expired";
    description = "Start a new checkout to try this pass again.";
  } else if (session?.status === "unpaid") {
    title = "Test payment incomplete";
    description = "Stripe is still showing this checkout as unpaid.";
  } else if (verification.error) {
    title = "Could not verify the test payment";
    description = verification.error.message;
  }

  return (
    <Storefront>
      <main className="brand-container brand-result-main">
        <section className="brand-result" aria-labelledby="checkout-result-title">
          <div className="brand-result-icon" data-paid={paid} aria-hidden="true">
            {paid ? <CircleCheck size={27} /> : checking ? <Loader2 size={27} className="motion-safe:animate-spin" /> : <CircleAlert size={27} />}
          </div>
          <div role="status">
            <h1 id="checkout-result-title" className="brand-title">{title}</h1>
            <p>{description}</p>
          </div>
          {paid && session && pass && (
            <dl className="brand-receipt">
              <div><dt>Hangout pass</dt><dd>{pass.name}</dd></div>
              <div><dt>Test payment</dt><dd>{formatCheckoutAmount(session.amount_total)} USD</dd></div>
            </dl>
          )}
          {paid && session?.tracking_mode === "client-side" && <p className="brand-notice" role="status">{trackingMessage ?? "Checking browser attribution…"}</p>}
          <div className="brand-result-actions">
            <Button asChild className="brand-cta">
              <Link href="/"><ArrowLeft size={18} aria-hidden="true" /> {paid ? "Try another test payment" : "Back to hangout passes"}</Link>
            </Button>
            {sessionId && !paid && !checking && session?.status !== "expired" && (
              <Button variant="outline" className="brand-secondary" onClick={() => void verification.refetch()}>Check again</Button>
            )}
          </div>
        </section>
      </main>
    </Storefront>
  );
}
