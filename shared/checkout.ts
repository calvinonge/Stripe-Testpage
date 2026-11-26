export const BRAND_NAME = "Calvin Brand Interface";
export const CHECKOUT_CURRENCY = "usd";

export const HANGOUT_PASSES = [
  { id: "quick-hello", name: "Quick hello", amount: 100 },
  { id: "coffee-chat", name: "Coffee chat", amount: 500 },
  { id: "long-hangout", name: "Long hangout", amount: 1000 },
] as const;

export type HangoutPass = (typeof HANGOUT_PASSES)[number];

export interface CheckoutSession {
  id: string;
  offer: HangoutPass["id"];
  amount_total: number;
  currency: typeof CHECKOUT_CURRENCY;
  status: "paid" | "unpaid" | "expired";
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CHECKOUT_CURRENCY,
});

export function getHangoutPass(id: unknown) {
  return HANGOUT_PASSES.find((pass) => pass.id === id);
}

export function formatCheckoutAmount(cents: number) {
  return currencyFormatter.format(cents / 100);
}
