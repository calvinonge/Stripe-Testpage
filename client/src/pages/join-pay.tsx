import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, Copy, Check, Loader2, AlertCircle, Users, DollarSign, Link2 } from "lucide-react";
import { AffiliateSetup } from "@/components/affiliate-setup";
import { affiliateSignupEndpoint } from "@/lib/pluvus";
import { BRAND_NAME } from "@shared/checkout";

const MERCHANT_NAME = BRAND_NAME;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PageState = "form" | "success" | "pending";

interface SuccessData {
  trackingLink: string;
  promoCode?: string;
  email: string;
}

function mapApiError(raw: string, status: number): string {
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  const map: Record<string, string> = {
    "Email is required": "Please enter your email address.",
    "Name is required": "Please enter your name.",
    "Invalid email format": "Please enter a valid email address.",
    "Payment information is required": "Please enter your PayPal email.",
    "Invalid PayPal email format": "Please enter a valid PayPal email address.",
    "This campaign is not accepting new affiliates": "This program is currently closed to new applications.",
  };
  if (raw.startsWith("This email is already registered")) {
    return "You're already registered. Check your inbox for your tracking link.";
  }
  return map[raw] ?? raw;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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
      data-testid="button-copy"
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex-shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

function SuccessScreen({ data }: { data: SuccessData }) {
  return (
    <div className="space-y-5" data-testid="screen-success">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold" data-testid="text-success-headline">
            You're in! Welcome to the Calvin program.
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            You earn <strong>20%</strong> on the first sale you refer.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Your unique tracking link
        </p>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
          <span
            className="text-sm font-mono text-foreground truncate flex-1 select-all"
            data-testid="text-tracking-link"
          >
            {data.trackingLink}
          </span>
          <CopyButton text={data.trackingLink} />
        </div>
        <p className="text-xs text-muted-foreground">
          Share this link on social media, in emails, or in your bio. Every sale made through it is attributed to you.
        </p>
      </div>

      {data.promoCode && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your promo code
          </p>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
            <span
              className="text-sm font-mono font-bold tracking-widest text-foreground flex-1 select-all"
              data-testid="text-promo-code"
            >
              {data.promoCode}
            </span>
            <CopyButton text={data.promoCode} />
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with your audience. They get a discount and you earn your commission.
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/20 p-4 space-y-1.5 text-sm text-muted-foreground">
        <p>
          A welcome email has been sent to <strong className="text-foreground">{data.email}</strong> with everything you need.
        </p>
        <Link href="/" className="underline hover:text-foreground">Back to the storefront</Link>
      </div>
    </div>
  );
}

function PendingScreen() {
  return (
    <div className="text-center space-y-4 py-4" data-testid="screen-pending">
      <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
        <Clock className="w-9 h-9 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Application submitted!</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          Your application is under review. {MERCHANT_NAME} will be in touch once it's approved. You'll receive an email with your tracking link.
        </p>
      </div>
    </div>
  );
}

export default function JoinPay() {
  const [pageState, setPageState] = useState<PageState>("form");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paypal, setPaypal] = useState("");
  const [paypalConfirm, setPaypalConfirm] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Please enter your full name.";
    if (!email.trim() || !EMAIL_RE.test(email.trim())) errs.email = "Please enter a valid email address.";
    if (!paypal.trim() || !EMAIL_RE.test(paypal.trim())) errs.paypal = "Please enter a valid PayPal email address.";
    if (paypal.trim().toLowerCase() !== paypalConfirm.trim().toLowerCase()) {
      errs.paypalConfirm = "PayPal emails do not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!affiliateSignupEndpoint || !validate()) return;

    setLoading(true);
    try {
      const res = await fetch(affiliateSignupEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          paymentMethod: "paypal",
          paymentInfo: paypal.trim().toLowerCase(),
        }),
      });

      const data = await res.json() as {
        success?: boolean;
        status?: string;
        error?: string;
        affiliate?: { trackingLink?: string };
        productAccess?: { promoCode?: string };
      };

      if (res.status === 429) {
        setApiError("Too many attempts. Please wait a moment and try again.");
        return;
      }

      if (!res.ok) {
        setApiError(mapApiError(data.error ?? "Something went wrong.", res.status));
        return;
      }

      if (data.status === "pending") {
        setPageState("pending");
        return;
      }

      if (data.success && data.affiliate?.trackingLink) {
        setSuccessData({
          trackingLink: data.affiliate.trackingLink,
          promoCode: data.productAccess?.promoCode,
          email: email.trim().toLowerCase(),
        });
        setPageState("success");
        return;
      }

      setApiError("Unexpected response from the server. Please try again.");
    } catch {
      setApiError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!affiliateSignupEndpoint) return <AffiliateSetup />;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8 pb-12">
      <div className="w-full max-w-[480px]">
        <Card>
          <CardHeader className="pb-0 pt-6 px-6">
            {pageState === "form" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {MERCHANT_NAME}
                  </p>
                  <h1 className="text-2xl font-bold leading-tight" data-testid="text-join-headline">
                    Join the Calvin Affiliate Program
                  </h1>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
                  <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Earn 20% commission on the first sale you refer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      One-time payout per referred customer, sent to your PayPal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                  <p>
                    After joining you'll receive a unique tracking link to share and a promo code your audience can use at checkout.
                  </p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-5">
            {pageState === "success" && successData && <SuccessScreen data={successData} />}
            {pageState === "pending" && <PendingScreen />}

            {pageState === "form" && (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                    data-testid="input-name"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <FieldError message={errors.name} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                    data-testid="input-email"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <FieldError message={errors.email} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paypal">
                    PayPal Email <span className="text-muted-foreground font-normal">(for commission payouts)</span>
                  </Label>
                  <Input
                    id="paypal"
                    type="email"
                    placeholder="your-paypal@example.com"
                    value={paypal}
                    onChange={(e) => { setPaypal(e.target.value); if (errors.paypal) setErrors(p => ({ ...p, paypal: "" })); }}
                    data-testid="input-paypal"
                    aria-invalid={!!errors.paypal}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is where your 20% commission will be sent. Can be different from your sign-up email.
                  </p>
                  {errors.paypal && <FieldError message={errors.paypal} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paypalConfirm">Confirm PayPal Email</Label>
                  <Input
                    id="paypalConfirm"
                    type="email"
                    placeholder="Confirm your PayPal email"
                    value={paypalConfirm}
                    onChange={(e) => { setPaypalConfirm(e.target.value); if (errors.paypalConfirm) setErrors(p => ({ ...p, paypalConfirm: "" })); }}
                    data-testid="input-paypal-confirm"
                    aria-invalid={!!errors.paypalConfirm}
                  />
                  {errors.paypalConfirm && <FieldError message={errors.paypalConfirm} />}
                </div>

                {apiError && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                    data-testid="text-api-error"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {apiError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  data-testid="button-join"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                  ) : (
                    "Join Program"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
