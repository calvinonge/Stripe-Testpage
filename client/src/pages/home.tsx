import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
      };
    }
  }
}

type Method = "buy-button" | "checkout-session" | "client-side";

export default function Home() {
  const [method, setMethod] = useState<Method>("buy-button");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getPluvusClickId(): string | null {
    return (
      ((window as { pluvus?: { getClickId?: () => string } }).pluvus?.getClickId?.()) ||
      localStorage.getItem("pluvus_click_id") ||
      (document.cookie.match(/(?:^|; )pluvus_click_id=([^;]+)/) || [])[1] ||
      null
    );
  }

  async function handleCheckoutSession(trackingMode: "webhook" | "client-side") {
    setLoading(true);
    setError(null);
    try {
      const clickId = getPluvusClickId();
      const body: Record<string, string> = { tracking_mode: trackingMode };
      // Only pass click ID for webhook mode — client-side mode bridges via browser
      if (trackingMode === "webhook" && clickId) {
        body.pluvus_click_id = clickId;
      }
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  }

  const TABS: { id: Method; label: string; sub: string }[] = [
    { id: "buy-button",       label: "Buy Button",       sub: "Stripe embed" },
    { id: "checkout-session", label: "Checkout Session", sub: "Webhook tracking" },
    { id: "client-side",      label: "Client-Side",      sub: "No webhooks" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-page-title">
            Complete Your Purchase
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Secure checkout powered by Stripe
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="flex rounded-lg border overflow-hidden" data-testid="method-toggle">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setMethod(tab.id); setError(null); }}
                data-testid={`toggle-${tab.id}`}
                className={`flex-1 py-2 px-1 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                  method === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="text-sm font-semibold leading-tight">{tab.label}</span>
                <span className={`text-[10px] leading-tight ${method === tab.id ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                  {tab.sub}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-center" data-testid="stripe-button-container">
            {method === "buy-button" && (
              <stripe-buy-button
                buy-button-id="buy_btn_1SrdXcDzHNLHpZoC73L2UYP0"
                publishable-key="pk_test_51SJM7yDzHNLHpZoCg8QsAFoVXHfurLig34GR3jn6eogmvRpLhA4atsbqctUTtnnGfcuxPXqRl9vBIHPMmQbrV7g8003VT81Ad8"
              />
            )}

            {method === "checkout-session" && (
              <div className="w-full space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Pluvus click ID passed in session metadata → tracked via Stripe webhook
                </p>
                <Button
                  onClick={() => handleCheckoutSession("webhook")}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-pay-now"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting…</> : "Pay Now"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center" data-testid="text-checkout-error">{error}</p>
                )}
              </div>
            )}

            {method === "client-side" && (
              <div className="w-full space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  No metadata in session — Pluvus fires <code className="bg-muted px-1 rounded">trackConversion()</code> on the thank-you page
                </p>
                <Button
                  onClick={() => handleCheckoutSession("client-side")}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-pay-now-client-side"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting…</> : "Pay Now"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center" data-testid="text-client-side-error">{error}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <Link
          href="/join"
          data-testid="link-join"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Become an affiliate →
        </Link>
        <span className="text-muted-foreground/40 text-xs">|</span>
        <Link
          href="/integrations"
          data-testid="link-integrations"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Integration guide →
        </Link>
      </div>
    </div>
  );
}
