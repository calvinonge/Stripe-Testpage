import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
    }

    const stripe = new Stripe(secretKey);

    try {
      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Purchase",
              },
              unit_amount: 999,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
      });

      return res.json({ url: session.url });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
