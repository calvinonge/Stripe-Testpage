import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

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

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-page-title">Complete Your Purchase</CardTitle>
          <p className="text-muted-foreground text-sm">Secure checkout powered by Stripe</p>
        </CardHeader>
        <CardContent className="flex justify-center pt-4" data-testid="stripe-button-container">
          <stripe-buy-button
            buy-button-id="buy_btn_1SrdXcDzHNLHpZoC73L2UYP0"
            publishable-key="pk_test_51SJM7yDzHNLHpZoCg8QsAFoVXHfurLig34GR3jn6eogmvRpLhA4atsbqctUTtnnGfcuxPXqRl9vBIHPMmQbrV7g8003VT81Ad8"
          />
        </CardContent>
      </Card>
    </div>
  );
}
