import { useState } from "react";
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

type Method = "buy-button" | "checkout-session";

export default function Home() {
  const [method, setMethod] = useState<Method>("buy-button");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckoutSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  }

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
            <button
              onClick={() => { setMethod("buy-button"); setError(null); }}
              data-testid="toggle-buy-button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                method === "buy-button"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Buy Button
            </button>
            <button
              onClick={() => { setMethod("checkout-session"); setError(null); }}
              data-testid="toggle-checkout-session"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                method === "checkout-session"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Checkout Session
            </button>
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
                <Button
                  onClick={handleCheckoutSession}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-pay-now"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center" data-testid="text-checkout-error">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
