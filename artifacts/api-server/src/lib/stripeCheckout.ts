export type CheckoutUser = {
  id: number;
  name: string;
  email: string;
  plan: string;
  stripeCustomerId: string | null;
};

export type CheckoutCustomerParams =
  | { customer: string }
  | { customer_email: string }
  | Record<string, never>;

export type CheckoutDecision =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      customerParams: CheckoutCustomerParams;
      /** Null means do not attach trial_period_days (returning customer). */
      trialDays: number | null;
    };

/**
 * Decide Stripe Checkout Session customer + trial options.
 *
 * Returning customers (stripeCustomerId set after a prior checkout) must reuse
 * the same Stripe customer and must not receive another free trial. Creating a
 * new customer on every Upgrade click orphans the previous subscription and
 * stacks unlimited trials; cancelling an older orphaned sub then fails to
 * downgrade plan because stripeCustomerId no longer matches.
 */
export function decideStripeCheckout(
  user: CheckoutUser,
  opts: { trialDays: number; isDeliverableEmail: (email: string) => boolean },
): CheckoutDecision {
  if (user.plan === "pro") {
    return { ok: false, status: 409, error: "Du har redan Pro." };
  }

  if (user.stripeCustomerId) {
    return {
      ok: true,
      customerParams: { customer: user.stripeCustomerId },
      trialDays: null,
    };
  }

  const customerParams: CheckoutCustomerParams = opts.isDeliverableEmail(user.email)
    ? { customer_email: user.email }
    : {};

  return {
    ok: true,
    customerParams,
    trialDays: opts.trialDays,
  };
}
