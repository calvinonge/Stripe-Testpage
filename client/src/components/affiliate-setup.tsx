import { Link } from "wouter";
import { Storefront } from "@/components/storefront";
import { Button } from "@/components/ui/button";

export function AffiliateSetup() {
  return (
    <Storefront>
      <main className="brand-container brand-result-main">
        <section className="brand-result" aria-labelledby="affiliate-setup-title">
          <h1 id="affiliate-setup-title" className="brand-title">Affiliate signup</h1>
          <p>Connect a Pluvus test campaign to try the affiliate signup form.</p>
          <div className="brand-result-actions">
            <Button asChild className="brand-cta"><Link href="/integrations">Open test setup</Link></Button>
          </div>
        </section>
      </main>
    </Storefront>
  );
}
