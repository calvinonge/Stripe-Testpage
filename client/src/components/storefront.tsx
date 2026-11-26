import type { ReactNode } from "react";
import { Coffee, FlaskConical } from "lucide-react";
import { Link } from "wouter";
import { BRAND_NAME } from "@shared/checkout";
import "@/storefront.css";

export function Storefront({ children }: { children: ReactNode }) {
  return (
    <div className="brand-shell">
      <header className="brand-header">
        <div className="brand-container brand-header-inner">
          <Link href="/" className="brand-wordmark">
            <span className="brand-mark"><Coffee size={18} aria-hidden="true" /></span>
            <span>{BRAND_NAME}</span>
          </Link>
          <span className="brand-test-status">
            <FlaskConical size={14} aria-hidden="true" /> Stripe test mode
          </span>
        </div>
      </header>
      {children}
      <footer className="brand-container brand-footer">
        <span>Brand tools</span>
        <nav aria-label="Brand tools">
          <Link href="/join">Affiliate signup</Link>
          <Link href="/join/pay">PayPal signup</Link>
          <Link href="/integrations">Test setup</Link>
        </nav>
      </footer>
    </div>
  );
}
