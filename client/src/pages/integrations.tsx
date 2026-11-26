import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Storefront } from "@/components/storefront";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { affiliateSignupEndpoint, pluvusTrackerId } from "@/lib/pluvus";

export default function Integrations() {
  return (
    <Storefront>
      <main className="brand-container brand-setup space-y-6">
        <div className="space-y-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4">
            <ArrowLeft size={16} aria-hidden="true" /> Back to hangout passes
          </Link>
          <h1 className="brand-title">Test setup</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold tracking-tight">Stripe checkout</h2>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open your Stripe sandbox and copy its secret test key from <a className="font-medium underline underline-offset-4" href="https://dashboard.stripe.com/test/apikeys">API keys <ArrowUpRight size={13} className="inline" aria-hidden="true" /></a>.</li>
              <li>Add it as <code className="break-all rounded bg-muted p-1">STRIPE_SECRET_KEY_TEST</code> in the Render service’s Environment settings and deploy. For local runs, put the key in <code className="rounded bg-muted p-1">.env</code>.</li>
              <li>Choose a pass on the storefront and enter one of Stripe’s test card numbers with a future expiry and any 3-digit CVC.</li>
            </ol>
            <dl className="grid gap-3 rounded-lg bg-muted/60 p-4 sm:grid-cols-2">
              <div><dt className="font-semibold">Successful payment</dt><dd><code>4242 4242 4242 4242</code></dd></div>
              <div><dt className="font-semibold">Declined payment</dt><dd><code>4000 0000 0000 0002</code></dd></div>
            </dl>
            <p>Use the back arrow in Stripe to test canceling and returning to your selected pass.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold tracking-tight">Pluvus affiliate attribution</h2>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            <p>{pluvusTrackerId ? "A Pluvus tracker is configured." : <>Set <code className="break-all rounded bg-muted p-1">VITE_PLUVUS_TRACKER_ID</code> to your test campaign’s tracker ID and rebuild.</>} Use an affiliate link that points to this storefront to start each test.</p>
            <dl className="space-y-3">
              <div>
                <dt className="font-semibold"><Link href="/" className="underline underline-offset-4">Test webhooks</Link></dt>
                <dd>In your Stripe sandbox, send <code className="break-all">checkout.session.completed</code> to the Pluvus test webhook. The storefront includes the affiliate click ID in the Stripe session and payment metadata when available.</dd>
              </div>
              <div>
                <dt className="font-semibold">{pluvusTrackerId ? <Link href="/?tracking=client-side" className="underline underline-offset-4">Test browser tracking</Link> : "Test browser tracking"}</dt>
                <dd>Open the affiliate link with <code className="break-all">tracking=client-side</code> as a query parameter. The confirmation page fires browser tracking after Stripe verifies the test payment.</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold tracking-tight">Pluvus affiliate signup</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            <p>{affiliateSignupEndpoint ? "A Pluvus campaign is configured. Use test details to try both signup forms." : <>Set <code className="break-all rounded bg-muted p-1">VITE_PLUVUS_CAMPAIGN_SLUG</code> to a test campaign and rebuild to enable the signup forms.</>}</p>
            <div className="flex flex-wrap gap-x-5">
              <Link href="/join" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Basic affiliate signup</Link>
              <Link href="/join/pay" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">Affiliate signup with PayPal</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </Storefront>
  );
}
