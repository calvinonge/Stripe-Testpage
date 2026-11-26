import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Link, useSearch } from "wouter";
import { Storefront } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { formatCheckoutAmount, getHangoutPass, type CheckoutSession } from "@shared/checkout";

export default function ThankYou() {
  const sessionId = new URLSearchParams(useSearch()).get("session_id");
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
