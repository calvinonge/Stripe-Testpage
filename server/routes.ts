import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

const FALLBACK_UNIT_AMOUNT = 999;
const FALLBACK_CURRENCY = "usd";
const FALLBACK_PRODUCT_NAME = "Purchase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    }

    const appUrl = (() => {
      if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
      const replitDomains = process.env.REPLIT_DOMAINS;
      if (replitDomains) {
        const firstDomain = replitDomains.split(",")[0].trim();
        return `https://${firstDomain}`;
      }
      return null;
    })();

    if (!appUrl) {
      return res.status(500).json({ error: "APP_URL is not configured. Set it to your site's base URL." });
    }

    const stripe = new Stripe(secretKey);

    const { price_id } = req.body as { price_id?: string };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = price_id
      ? [{ price: price_id, quantity: 1 }]
      : [
          {
            price_data: {
              currency: FALLBACK_CURRENCY,
              product_data: { name: FALLBACK_PRODUCT_NAME },
              unit_amount: FALLBACK_UNIT_AMOUNT,
            },
            quantity: 1,
          },
        ];

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/`,
      });

      return res.json({ url: session.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      return res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
