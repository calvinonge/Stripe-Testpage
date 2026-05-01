import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, Loader2, AlertTriangle } from "lucide-react";

type TrackingStatus = "idle" | "firing" | "success" | "error" | "no-click-id";

declare global {
  interface Window {
    pluvus?: {
      getClickId?: () => string | null;
      trackConversion?: (params: { amount: number; currency: string; externalId?: string }) => void;
    };
  }
}

function formatAmount(amountTotal: number | null, currency: string): string {
  if (amountTotal === null) return "";
  const value = amountTotal / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(value);
}

export default function ThankYou() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const isClientSide = params.get("tracking") === "client-side";

  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("idle");
  const [trackedAmount, setTrackedAmount] = useState<string>("");
  const [clickId, setClickId] = useState<string | null>(null);

  useEffect(() => {
    if (!isClientSide || !sessionId) return;

    setTrackingStatus("firing");

    async function fireTracking() {
      try {
        // Fetch session amount from our backend
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) throw new Error("Could not retrieve session details");
        const data = await res.json() as { amount_total: number; currency: string; id: string };

        const detectedClickId = window.pluvus?.getClickId?.() ?? null;
        setClickId(detectedClickId);

        if (!detectedClickId) {
          setTrackingStatus("no-click-id");
          return;
        }

        // Fire the client-side conversion — Pluvus reads the click ID from its own cookie
        window.pluvus?.trackConversion?.({
          amount: data.amount_total / 100,
          currency: data.currency,
          externalId: data.id,
        });

        setTrackedAmount(formatAmount(data.amount_total, data.currency));
        setTrackingStatus("success");
      } catch {
        setTrackingStatus("error");
      }
    }

    // Small delay to ensure Pluvus script has fully initialised
    const timer = setTimeout(fireTracking, 300);
    return () => clearTimeout(timer);
  }, [isClientSide, sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-thank-you-title">Thank You!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground" data-testid="text-success-message">
              Your purchase was successful. You'll receive a confirmation email shortly.
            </p>
          </CardContent>
        </Card>

        {isClientSide && (
          <Card data-testid="card-tracking-status">
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold">Client-Side Tracking</span>
              </div>

              {trackingStatus === "firing" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="status-tracking-firing">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching order amount and firing conversion…
                </div>
              )}

              {trackingStatus === "success" && (
                <div className="space-y-2" data-testid="status-tracking-success">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <code>window.pluvus.trackConversion()</code> fired
                  </div>
                  <div className="rounded-md bg-muted p-3 text-xs font-mono space-y-1 text-left">
                    <div><span className="text-muted-foreground">amount:</span> {trackedAmount}</div>
                    <div><span className="text-muted-foreground">externalId:</span> {sessionId}</div>
                    <div><span className="text-muted-foreground">click_id:</span> {clickId}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No webhook was used. The Pluvus script read its own cookie and sent the conversion directly from the browser.
                  </p>
                </div>
              )}

              {trackingStatus === "no-click-id" && (
                <div className="space-y-2" data-testid="status-no-click-id">
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    No affiliate click ID found
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The Pluvus script is loaded but no click ID was detected in this session. To test attribution, arrive via an affiliate link (e.g. <code className="bg-muted px-1 rounded">?pluvus_click_id=test123</code>).
                  </p>
                </div>
              )}

              {trackingStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive" data-testid="status-tracking-error">
                  <AlertTriangle className="w-4 h-4" />
                  Could not fetch session details — tracking skipped.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
