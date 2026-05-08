import { Router, type Request } from "express";
import { stripe, getStripePriceId } from "../lib/stripe";

const router = Router();

function appUrl(req: Request) {
  return process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`;
}

router.get("/config", (_req, res) => {
  return res.json({
    stripeEnabled: Boolean(stripe && process.env.STRIPE_PRO_PRICE_ID),
    plans: {
      pro: Boolean(process.env.STRIPE_PRO_PRICE_ID),
      team: Boolean(process.env.STRIPE_TEAM_PRICE_ID),
    },
  });
});

router.post("/checkout", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: "STRIPE_SECRET_KEY is not configured.",
      setup: "Add Stripe keys to your API hosting environment variables.",
    });
  }

  const planId = String(req.body?.planId ?? "pro");
  const priceId = getStripePriceId(planId);
  if (!priceId) {
    return res.status(400).json({
      error: `Stripe price id is not configured for plan "${planId}".`,
      setup: planId === "team" ? "Add STRIPE_TEAM_PRICE_ID or keep Team disabled." : "Add STRIPE_PRO_PRICE_ID.",
    });
  }

  const origin = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/plans?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plans?checkout=cancelled`,
    allow_promotion_codes: true,
    customer_email: typeof req.body?.email === "string" ? req.body.email : undefined,
    metadata: {
      planId,
    },
  });

  return res.status(201).json({ url: session.url });
});

router.post("/portal", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "STRIPE_SECRET_KEY is not configured." });
  const customerId = String(req.body?.customerId ?? "");
  if (!customerId) return res.status(400).json({ error: "customerId is required." });

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl(req)}/plans`,
  });

  return res.json({ url: session.url });
});

export default router;
