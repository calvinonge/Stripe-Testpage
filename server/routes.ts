import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

const FALLBACK_UNIT_AMOUNT = 999;
const FALLBACK_CURRENCY = "usd";
const FALLBACK_PRODUCT_NAME = "Purchase";

function getStripeClient() {
  const mode = process.env.STRIPE_MODE === "live" ? "live" : "test";
  const secretKey = mode === "live"
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY_TEST;
  return { stripe: secretKey ? new Stripe(secretKey) : null, mode, secretKey };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    const { stripe, mode, secretKey } = getStripeClient();

    if (!secretKey || !stripe) {
      return res.status(500).json({
        error: `STRIPE_SECRET_KEY${mode === "live" ? "" : "_TEST"} is not configured.`,
      });
    }

    const appUrl = (() => {
      if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
      const replitDomains = process.env.REPLIT_DOMAINS;
      if (replitDomains) {
        const firstDomain = replitDomains.split(",")[0].trim();
        return `https://${firstDomain}`;
      }
      const host = req.headers["x-forwarded-host"] ?? req.headers.host;
      const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
      if (host) return `${proto}://${host}`;
      return null;
    })();

    if (!appUrl) {
      return res.status(500).json({ error: "APP_URL is not configured. Set it to your site's base URL." });
    }

    const { price_id, pluvus_click_id, tracking_mode } = (req.body ?? {}) as {
      price_id?: string;
      pluvus_click_id?: string;
      tracking_mode?: "webhook" | "client-side";
    };

    const isClientSide = tracking_mode === "client-side";

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = price_id
      ? [{ price: price_id, quantity: 1 }]
      : [
          {
            price_data: {
              currency: FALLBACK_CURRENCY,
              product_data: { name: FALLBACK_PRODUCT_NAME },
              unit_amount: FALLBACK_UNIT_AMOUNT,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ];

    const successUrl = isClientSide
      ? `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}&tracking=client-side`
      : `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "subscription",
        success_url: successUrl,
        cancel_url: `${appUrl}/`,
        // For webhook mode: stamp pluvus click ID in metadata for webhook pickup
        // For client-side mode: intentionally omit — tracking fires browser-side on thank-you page
        ...(!isClientSide && pluvus_click_id ? {
          client_reference_id: pluvus_click_id,
          metadata: { pluvus_click_id },
          subscription_data: { metadata: { pluvus_click_id } },
        } : {}),
      });

      return res.json({ url: session.url });
    } catch (err: unknown) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        return res.status(400).json({ error: err.message });
      }
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return res.status(500).json({ error: message });
    }
  });

  // Returns minimal session info so the thank-you page can fire trackConversion()
  // without needing a webhook. Only exposes amount_total and currency.
  app.get("/api/session/:id", async (req: Request, res: Response) => {
    const { stripe, mode, secretKey } = getStripeClient();

    if (!secretKey || !stripe) {
      return res.status(500).json({
        error: `STRIPE_SECRET_KEY${mode === "live" ? "" : "_TEST"} is not configured.`,
      });
    }

    const sessionId = req.params.id;
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "Invalid session ID." });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return res.json({
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
      });
    } catch (err: unknown) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        return res.status(400).json({ error: err.message });
      }
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
