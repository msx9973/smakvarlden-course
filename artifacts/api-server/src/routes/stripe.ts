import { Router } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" as Parameters<typeof Stripe>[1]["apiVersion"] });
}

const PLAN_PRICE_SEK = 8900; // 89.00 SEK in öre

router.post("/checkout", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe inte konfigurerat." });

  const { userId, email, name } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "email krävs" });

  const origin = req.headers.origin ?? "https://smakvarlden.se";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      metadata: { user_id: String(userId ?? ""), name: name ?? "" },
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Smakvärlden Pro Chef",
              description: "Obegränsade recept, AI-verktyg & analytics · Avsluta när som helst",
            },
            unit_amount: PLAN_PRICE_SEK,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?payment=cancelled`,
      locale: "sv",
      allow_promotion_codes: true,
    });
    return res.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe-fel";
    return res.status(500).json({ error: msg });
  }
});

router.post("/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe inte konfigurerat." });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    const raw = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } else {
      event = req.body as Stripe.Event;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook-fel";
    return res.status(400).json({ error: msg });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id ?? "0", 10);
    const customerId = typeof session.customer === "string" ? session.customer : "";

    if (userId > 0) {
      await db.update(usersTable).set({
        plan: "pro",
        stripeCustomerId: customerId || null,
      }).where(eq(usersTable.id, userId));
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : "";
    if (customerId) {
      await db.update(usersTable).set({ plan: "free" })
        .where(eq(usersTable.stripeCustomerId, customerId));
    }
  }

  return res.json({ received: true });
});

router.get("/status", async (req, res) => {
  const userId = (req as unknown as { user?: { id: number } }).user?.id;
  if (!userId) return res.status(401).json({ error: "Ej inloggad" });
  const [user] = await db.select({ plan: usersTable.plan }).from(usersTable).where(eq(usersTable.id, userId));
  return res.json({ plan: user?.plan ?? "free" });
});

export default router;
