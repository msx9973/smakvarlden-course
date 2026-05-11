import { Router, type Request } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" as never });
}

const PLAN_PRICE_SEK = 8900; // 89.00 SEK in öre

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "smakvarlden-dev-secret-2025";
}

async function getAuthenticatedUser(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  try {
    const payload = jwt.verify(header.slice(7), getSecret()) as { id: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    return user ?? null;
  } catch {
    return null;
  }
}

router.post("/checkout", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe inte konfigurerat." });

  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Ej inloggad" });

  const origin = req.headers.origin ?? "https://smakvarlden.se";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      metadata: { user_id: String(user.id), name: user.name },
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
    const raw = Buffer.isBuffer(req.body)
      ? req.body
      : (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } else {
      event = Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString("utf8")) as Stripe.Event
        : req.body as Stripe.Event;
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
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Ej inloggad" });
  return res.json({ plan: user.plan ?? "free" });
});

export default router;
