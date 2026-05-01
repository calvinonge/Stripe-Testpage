import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Copy, Check, Info, Zap, Webhook, ShoppingBag } from "lucide-react";

const TRACKER_ID = "f14e781b-4c88-479e-b62a-a5185cee65e2";

const TRACKING_SCRIPT = `<script src="https://pluvus.com/api/track/script/${TRACKER_ID}" async></script>`;

const CONVERSION_SNIPPET = `<script>
window.addEventListener('load', function () {
  if (window.pluvus) {
    window.pluvus.trackConversion({
      amount: ORDER_TOTAL,   // inject from your backend
      currency: 'USD',
      externalId: 'ORDER_ID' // optional — prevents duplicates
    });
  }
});
</script>`;

const STRIPE_SNIPPET = `// Backend: create Checkout Session
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: PRICE_ID, quantity: 1 }],
  metadata: { pluvus_click_id: clickId },
  subscription_data: { metadata: { pluvus_click_id: clickId } },
  client_reference_id: clickId,
  success_url: 'https://yoursite.com/thank-you?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yoursite.com/',
});`;

type Mode = "stripe" | "shopify" | "client-side";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      data-testid="button-copy-code"
      className="absolute top-3 right-3 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>}
      <div className="relative group">
        <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto pr-12 text-foreground whitespace-pre-wrap break-all">
          {code}
        </pre>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

function SectionLabel({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
        {letter}
      </span>
      <h3 className="font-semibold text-base">{title}</h3>
    </div>
  );
}

function ClientSideTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">2-step setup — no backend changes required</p>
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            <li>① Add the tracking script to <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code></li>
            <li>② Add <code className="text-xs bg-muted px-1 rounded">trackConversion()</code> on your thank-you page</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Required: Post-payment redirect must return to your site</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Configure your payment provider to redirect to your own domain after checkout. The Pluvus script must be present on the thank-you page to fire the conversion.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            If your checkout is not fully on your domain, this method will not work.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel letter="A" title="Tracking Script" />
        <p className="text-sm text-muted-foreground">
          Add this to the <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> of <strong>every page</strong> on your site — not just the thank-you page. It captures affiliate link clicks and stores a unique click ID in the visitor's cookie and localStorage for 30 days.
        </p>
        <CodeBlock code={TRACKING_SCRIPT} />
      </div>

      <div className="space-y-2">
        <SectionLabel letter="B" title="Conversion Tracking (Thank-You Page)" />
        <p className="text-sm text-muted-foreground">
          Add this to your thank-you / order confirmation page. Use your existing order data — no new backend logic needed.
        </p>
        <CodeBlock code={CONVERSION_SNIPPET} />
        <div className="space-y-1.5 pt-1">
          <div className="flex gap-2 items-start text-sm">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground"><strong>ORDER_TOTAL</strong> must be injected dynamically from your backend (e.g. the order total in cents or decimal — match your currency).</span>
          </div>
          <div className="flex gap-2 items-start text-sm">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground"><strong>ORDER_ID</strong> is optional but strongly recommended — it prevents duplicate conversions if the page reloads.</span>
          </div>
          <div className="flex gap-2 items-start text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">Safe fallback built in: if no affiliate click exists, <code className="text-xs bg-muted px-1 rounded">window.pluvus</code> still runs but does nothing.</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 flex gap-3">
        <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong>Validation:</strong> Test by placing a test order via an affiliate link. Check your Pluvus dashboard to confirm the conversion appears with the correct click attribution.
        </p>
      </div>
    </div>
  );
}

function StripeTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <Webhook className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Webhook-based — works with subscriptions and renewals</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Attach the Pluvus click ID to the Stripe Checkout Session metadata. Pluvus reads it from the <code className="text-xs bg-muted px-1 rounded">checkout.session.completed</code> webhook and maps it to the customer for all future renewals.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <SectionLabel letter="A" title="Tracking Script (all pages)" />
        <p className="text-sm text-muted-foreground">Same as all integrations — add to <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code>.</p>
        <CodeBlock code={TRACKING_SCRIPT} />
      </div>

      <div className="space-y-2">
        <SectionLabel letter="B" title="Pass Click ID in Checkout Session" />
        <p className="text-sm text-muted-foreground">
          Read the click ID from <code className="text-xs bg-muted px-1 rounded">window.pluvus.getClickId()</code> on the frontend and pass it to your backend when creating the Stripe Checkout Session. Attach it to <code className="text-xs bg-muted px-1 rounded">metadata</code>, <code className="text-xs bg-muted px-1 rounded">subscription_data.metadata</code>, and <code className="text-xs bg-muted px-1 rounded">client_reference_id</code>.
        </p>
        <CodeBlock code={STRIPE_SNIPPET} />
      </div>

      <div className="space-y-2">
        <SectionLabel letter="C" title="Configure Pluvus Webhook" />
        <p className="text-sm text-muted-foreground">
          In your Stripe dashboard, add the Pluvus webhook endpoint and subscribe to <code className="text-xs bg-muted px-1 rounded">checkout.session.completed</code> and <code className="text-xs bg-muted px-1 rounded">invoice.payment_succeeded</code>. Pluvus handles the rest — including renewal attribution by customer ID.
        </p>
      </div>
    </div>
  );
}

function ShopifyTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <ShoppingBag className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Native Shopify integration</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pluvus integrates directly with Shopify via the native app. Install the Pluvus app from the Shopify App Store to get started.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
        <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="font-medium text-muted-foreground">Shopify setup guide coming soon</p>
        <p className="text-sm text-muted-foreground">Contact the Pluvus team for early access to the Shopify integration.</p>
      </div>
    </div>
  );
}

const TABS: { id: Mode; label: string; badge?: string }[] = [
  { id: "stripe", label: "Stripe", badge: "Webhooks" },
  { id: "shopify", label: "Shopify", badge: "Native" },
  { id: "client-side", label: "Client-Side Tracking", badge: "No Webhooks" },
];

export default function Integrations() {
  const [mode, setMode] = useState<Mode>("client-side");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" data-testid="text-integrations-title">Pluvus Integration Guide</h1>
          <p className="text-muted-foreground text-sm">Choose your integration method to see setup instructions.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2" data-testid="integration-mode-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                mode === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                  mode === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <Card data-testid="integration-content">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {mode === "stripe" && "Stripe Webhook Integration"}
              {mode === "shopify" && "Shopify Integration"}
              {mode === "client-side" && "Client-Side Tracking"}
            </CardTitle>
            {mode === "client-side" && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">No webhooks</Badge>
                <Badge variant="secondary">No backend changes</Badge>
                <Badge variant="secondary">Script only</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            {mode === "stripe" && <StripeTab />}
            {mode === "shopify" && <ShopifyTab />}
            {mode === "client-side" && <ClientSideTab />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
