import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, CircleAlert, Copy, CreditCard, Loader2 } from "lucide-react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Storefront } from "@/components/storefront";
import { HANGOUT_PASSES, formatCheckoutAmount, getHangoutPass, type HangoutPass } from "@shared/checkout";

const TEST_CARD = "4242 4242 4242 4242";

type CheckoutAttempt = {
  offer: HangoutPass["id"];
  request_id: string;
};

function TestCard() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(TEST_CARD.replaceAll(" ", ""));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="brand-card-help">
      <CreditCard size={19} aria-hidden="true" className="brand-card-icon" />
      <div>
        <div className="brand-test-card">
          <strong>Test card</strong>
          <code>{TEST_CARD}</code>
          <Button type="button" variant="ghost" size="icon" className="brand-copy" onClick={copyCard}
            aria-label="Copy test card number" title="Copy test card number">
            {copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}
          </Button>
        </div>
        <p aria-live="polite">
          {copyState === "copied" ? "Copied. " : copyState === "failed" ? "Select the number to copy it. " : ""}
          Use any future expiry date and any 3-digit CVC.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const params = new URLSearchParams(useSearch());
  const canceled = params.get("checkout") === "canceled";
  const [pass, setPass] = useState<HangoutPass>(getHangoutPass(params.get("offer")) ?? HANGOUT_PASSES[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<CheckoutAttempt | null>(null);
  const config = useQuery<{ enabled: boolean }>({
    queryKey: ["checkout-config"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/checkout/config", { signal });
      if (!response.ok) throw new Error("Could not check Stripe availability.");
      return response.json();
    },
  });

  useEffect(() => {
    function resetAfterBack(event: PageTransitionEvent) {
      if (event.persisted) {
        attempt.current = null;
        setPending(false);
      }
    }
    window.addEventListener("pageshow", resetAfterBack);
    return () => window.removeEventListener("pageshow", resetAfterBack);
  }, []);

  useEffect(() => {
    if (canceled) document.getElementById("passes")?.scrollIntoView();
  }, [canceled]);

  function choosePass(nextPass: HangoutPass) {
    setPass(nextPass);
    setError(null);
    attempt.current = null;
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !config.data?.enabled) return;

    setError(null);
    setPending(true);
    try {
      attempt.current ??= { offer: pass.id, request_id: crypto.randomUUID() };

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt.current),
      });
      const data = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        setError(data?.error ?? "Stripe checkout could not open. Please try again.");
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Stripe checkout could not open. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <Storefront>
      <main className="brand-container brand-main">
        <section className="brand-hero" aria-labelledby="hangout-title">
          <div>
            <h1 id="hangout-title" className="brand-title">Have a hangout<br />with Calvin.</h1>
            <p>Pick a hangout pass and sign up through Stripe. Every payment is simulated.</p>
          </div>
          <img src="/calvin-coffee.jpg" className="brand-hero-image" alt="Two coffees on a sunlit café table" width="1200" height="800" fetchPriority="high" />
        </section>

        <form className="brand-checkout" id="passes" onSubmit={startCheckout}>
          <div className="brand-section-heading">
            <h2>Sign up for a hangout</h2>
            <span>One-time payment · USD</span>
          </div>
          {canceled && <p className="brand-notice" role="status">Checkout canceled. You can try the same pass or pick a different one.</p>}
          <fieldset className="brand-passes" disabled={pending}>
            <legend className="sr-only">Choose a hangout pass</legend>
            {HANGOUT_PASSES.map((option) => (
              <label key={option.id} className="brand-pass" data-selected={pass.id === option.id}>
                <span className="brand-pass-name">{option.name}</span>
                <span className="brand-pass-price">{formatCheckoutAmount(option.amount)}</span>
                <input type="radio" name="hangout-pass" value={option.id} checked={pass.id === option.id}
                  onChange={() => choosePass(option)} />
              </label>
            ))}
          </fieldset>

          <div className="brand-checkout-actions">
            <TestCard />
            <Button type="submit" className="brand-cta" disabled={pending || !config.data?.enabled}>
              {pending ? <><Loader2 size={18} className="motion-safe:animate-spin" /> Opening Stripe…</>
                : <>Sign up · {formatCheckoutAmount(pass.amount)} <ArrowRight size={18} aria-hidden="true" /></>}
            </Button>
          </div>

          {error && <p className="brand-notice brand-error" role="alert"><CircleAlert size={17} aria-hidden="true" /> {error}</p>}
          {config.isPending && <p className="brand-availability" role="status">Checking Stripe test checkout…</p>}
          {config.isError && <p className="brand-availability" role="status">Could not check Stripe availability. <button type="button" onClick={() => void config.refetch()}>Try again</button></p>}
          {config.data?.enabled === false && <p className="brand-availability" role="status">Add your Stripe test key in Render to enable sign-ups.</p>}
        </form>
      </main>
    </Storefront>
  );
}
