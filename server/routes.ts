import type { Express, Response } from "express";
import { rateLimit } from "express-rate-limit";
import Stripe from "stripe";
import { z } from "zod";
import {
  BRAND_NAME,
  CHECKOUT_CURRENCY,
  getHangoutPass,
  type CheckoutSession,
} from "../shared/checkout";

const CHECKOUT_SOURCE = "calvin-brand-interface";
const TEST_SESSION_ID = /^cs_test_[a-zA-Z0-9]{1,200}$/;
const checkoutRequest = z.object({
  offer: z.string(),
  request_id: z.string().uuid().optional(),
  tracking_mode: z.enum(["webhook", "client-side"]).default("webhook"),
  pluvus_click_id: z.string().trim().min(1).max(150).optional(),
}).strict();

function getAppOrigin() {
  const configuredUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (!configuredUrl) return `http://localhost:${process.env.PORT || "5000"}`;

  try {
    const url = new URL(configuredUrl);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const isAllowedProtocol = url.protocol === "https:" || (isLocal && url.protocol === "http:");
    if (isAllowedProtocol && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password) {
      return url.origin;
    }
  } catch {
    // Checkout stays disabled until its return URL is configured.
  }
  return null;
}

function handleStripeError(res: Response, operation: string, error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    console.error(`[stripe] ${operation}: ${error.type}${error.code ? ` (${error.code})` : ""}`);
    if (error instanceof Stripe.errors.StripeAuthenticationError || error instanceof Stripe.errors.StripePermissionError) {
      return res.status(503).json({ error: "Stripe rejected the test key. Check the Stripe test key in your service settings." });
    }
  } else {
    console.error(`[stripe] ${operation} failed`);
  }
  return res.status(502).json({ error: "Stripe test checkout is temporarily unavailable. Please try again." });
}

export function registerRoutes(app: Express) {
  const testKey = process.env.STRIPE_SECRET_KEY_TEST?.trim();
  const stripe = testKey && /^(?:sk|rk)_test_[a-zA-Z0-9]+$/.test(testKey)
    ? new Stripe(testKey, { maxNetworkRetries: 1, timeout: 10_000 })
    : null;
  const appOrigin = getAppOrigin();
  const limited = (limit: number) => rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many checkout requests. Wait a minute and try again." },
  });

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.get("/api/checkout/config", (_req, res) => {
    res.json({ enabled: Boolean(stripe && appOrigin) });
  });

  app.post("/api/create-checkout-session", limited(20), async (req, res) => {
    const input = checkoutRequest.safeParse(req.body);
    const pass = input.success ? getHangoutPass(input.data.offer) : undefined;
    if (!input.success || !pass) {
      return res.status(400).json({ error: "Choose one of the three hangout passes and try again." });
    }
    if (!stripe || !appOrigin) {
      return res.status(503).json({ error: "Stripe test checkout needs to be set up first." });
    }

    const { tracking_mode, pluvus_click_id, request_id } = input.data;
    const clickId = tracking_mode === "webhook" ? pluvus_click_id : undefined;
    const metadata = {
      source: CHECKOUT_SOURCE,
      offer: pass.id,
      tracking_mode,
      ...(clickId ? { pluvus_click_id: clickId } : {}),
    };
    const cancelUrl = new URL("/", appOrigin);
    cancelUrl.searchParams.set("checkout", "canceled");
    cancelUrl.searchParams.set("offer", pass.id);
    if (tracking_mode === "client-side") cancelUrl.searchParams.set("tracking", tracking_mode);
    cancelUrl.hash = "passes";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        branding_settings: { display_name: BRAND_NAME, button_color: "#283e33" },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: CHECKOUT_CURRENCY,
            unit_amount: pass.amount,
            product_data: { name: `Hangout with Calvin — ${pass.name}` },
          },
        }],
        success_url: `${appOrigin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl.href,
        metadata,
        payment_intent_data: { metadata },
        client_reference_id: clickId,
      }, request_id ? { idempotencyKey: request_id } : undefined);

      if (session.livemode !== false || !TEST_SESSION_ID.test(session.id) || !session.url) {
        return res.status(502).json({ error: "Stripe did not return a test checkout. Please try again." });
      }
      return res.json({ url: session.url });
    } catch (error) {
      return handleStripeError(res, "create checkout", error);
    }
  });

  app.get("/api/session/:id", limited(60), async (req, res) => {
    const sessionId = req.params.id;
    if (typeof sessionId !== "string" || !TEST_SESSION_ID.test(sessionId)) {
      return res.status(400).json({ error: "Invalid Stripe test session." });
    }
    if (!stripe) {
      return res.status(503).json({ error: "Stripe test checkout needs to be set up first." });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const pass = getHangoutPass(session.metadata?.offer);
      if (session.livemode !== false || session.mode !== "payment" || session.metadata?.source !== CHECKOUT_SOURCE ||
          !pass || session.amount_total !== pass.amount || session.currency !== CHECKOUT_CURRENCY) {
        return res.status(404).json({ error: "This test checkout could not be found." });
      }

      const paid = session.status === "complete" && session.payment_status === "paid";
      const checkout: CheckoutSession = {
        id: session.id,
        offer: pass.id,
        amount_total: session.amount_total,
        currency: session.currency,
        status: paid ? "paid" : session.status === "expired" ? "expired" : "unpaid",
        tracking_mode: session.metadata.tracking_mode === "client-side" ? "client-side" : "webhook",
      };
      return res.json(checkout);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") {
        return res.status(404).json({ error: "This test checkout could not be found." });
      }
      return handleStripeError(res, "verify checkout", error);
    }
  });

  app.use("/api", (_req, res) => res.status(404).json({ error: "Endpoint not found." }));
}
