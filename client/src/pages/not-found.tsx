import { Link } from "wouter";
import { Storefront } from "@/components/storefront";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Storefront>
      <main className="brand-container brand-result-main">
        <section className="brand-result" aria-labelledby="missing-page-title">
          <h1 id="missing-page-title" className="brand-title">Page not found</h1>
          <div className="brand-result-actions">
            <Button asChild className="brand-cta"><Link href="/">Back to hangout sign-ups</Link></Button>
          </div>
        </section>
      </main>
    </Storefront>
  );
}
