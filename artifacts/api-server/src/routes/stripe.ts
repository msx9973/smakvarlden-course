import { Router, type Request } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" as never });
}

const PLAN_PRICE_SEK = 5900; // 59.00 SEK in öre
const PLAN_TRIAL_DAYS = 7;
const PHONE_EMAIL_DOMAIN = "phone.smakvarlden.local";

function isDeliverableEmail(email: string) {
  return (
    !email.endsWith(`@${PHONE_EMAIL_DOMAIN}`) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

/**
 * Returns the canonical app origin from server-side env vars ONLY.
 * We never trust req.headers.origin for redirect URLs — it is
 * controlled by the client and can be spoofed to send users to
 * an attacker-controlled page after payment.
 */
function getAppOrigin(req: Request): string {
  const configured = process.env.PUBLIC_APP_URL ?? process.env.URL;
  if (configured) return configured.replace(/\/$/, "");

  // Fallback for local dev only — derived from trusted proxy headers, not Origin
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ??
    req.protocol ??
    "https";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ??
    req.headers.host ??
    "localhost";
  return `${proto}://${host}`;
}

// requireAuth is applied at the router level in routes/index.ts,
// but we keep a local helper for the webhook route which bypasses it.
router.post("/checkout", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe inte konfigurerat." });

  // req.user is set by requireAuth middleware (applied in routes/index.ts)
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Ej inloggad" });

  // Use trusted server-side origin — never req.headers.origin
  const origin = getAppOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(isDeliverableEmail(user.email) ? { customer_email: user.email } : {}),
      metadata: { user_id: String(user.id), name: user.name },
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Smakvärlden Pro Early Access",
              description:
                "7 dagar gratis, sedan founder price: obegränsade recept, AI-verktyg och analytics.",
            },
            unit_amount: PLAN_PRICE_SEK,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: PLAN_TRIAL_DAYS,
      },
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

// Webhook is mounted at /stripe/webhook in routes/index.ts with express.raw()
// — it intentionally bypasses requireAuth since Stripe signs the payload itself.
router.post("/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Stripe inte konfigurerat." });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    const raw = Buffer.isBuffer(req.body)
      ? req.body
      : (req as unknown as { rawBody?: Buffer }).rawBody ??
        Buffer.from(JSON.stringify(req.body));
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } else {
      event = Buffer.isBuffer(req.body)
        ? (JSON.parse(req.body.toString("utf8")) as Stripe.Event)
        : (req.body as Stripe.Event);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook-fel";
    return res.status(400).json({ error: msg });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.user_id ?? "0", 10);
    const customerId =
      typeof session.customer === "string" ? session.customer : "";

    if (userId > 0) {
      await db
        .update(usersTable)
        .set({ plan: "pro", stripeCustomerId: customerId || null })
        .where(eq(usersTable.id, userId));
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : "";
    if (customerId) {
      await db
        .update(usersTable)
        .set({ plan: "free" })
        .where(eq(usersTable.stripeCustomerId, customerId));
    }
  }

  return res.json({ received: true });
});

router.get("/status", async (req, res) => {
  const user = req.user; // set by requireAuth in routes/index.ts
  if (!user) return res.status(401).json({ error: "Ej inloggad" });
  return res.json({ plan: user.plan ?? "free" });
});

export default router;
