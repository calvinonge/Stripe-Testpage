import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ThankYou() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const clickId =
      ((window as any).pluvus?.getClickId?.()) ||
      localStorage.getItem("pluvus_click_id") ||
      (document.cookie.match(/(?:^|; )pluvus_click_id=([^;]+)/) || [])[1] ||
      null;

    if (!sessionId || !clickId) return;

    fetch("https://f4256486-7d39-4d4b-a0a2-63ba860c4a1f-00-2028tp4gmi6yk.riker.replit.dev/api/track/success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        pluvus_click_id: clickId,
        page_url: window.location.href,
        ts: Date.now()
      }),
      keepalive: true
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
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
    </div>
  );
}
