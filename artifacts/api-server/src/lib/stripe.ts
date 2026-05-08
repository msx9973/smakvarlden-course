import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(stripeSecretKey && process.env.STRIPE_PRO_PRICE_ID);

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  : null;

export function getStripePriceId(planId: string) {
  if (planId === "pro") return process.env.STRIPE_PRO_PRICE_ID;
  if (planId === "team") return process.env.STRIPE_TEAM_PRICE_ID;
  return undefined;
}
