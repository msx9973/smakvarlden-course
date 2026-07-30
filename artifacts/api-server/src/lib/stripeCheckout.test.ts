import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideStripeCheckout } from "./stripeCheckout.ts";

const deliverable = (email: string) => !email.endsWith("@phone.smakvarlden.local");

describe("decideStripeCheckout", () => {
  it("rejects checkout when the user is already on Pro", () => {
    const result = decideStripeCheckout(
      {
        id: 1,
        name: "Anna",
        email: "anna@example.com",
        plan: "pro",
        stripeCustomerId: "cus_existing",
      },
      { trialDays: 7, isDeliverableEmail: deliverable },
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
    }
  });

  it("reuses Stripe customer and skips trial after cancel (plan free, customer retained)", () => {
    const result = decideStripeCheckout(
      {
        id: 2,
        name: "Bo",
        email: "bo@example.com",
        plan: "free",
        stripeCustomerId: "cus_A",
      },
      { trialDays: 7, isDeliverableEmail: deliverable },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.customerParams, { customer: "cus_A" });
      assert.equal(result.trialDays, null);
    }
  });

  it("grants first-time trial with customer_email for deliverable addresses", () => {
    const result = decideStripeCheckout(
      {
        id: 3,
        name: "Cia",
        email: "cia@example.com",
        plan: "free",
        stripeCustomerId: null,
      },
      { trialDays: 7, isDeliverableEmail: deliverable },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.customerParams, { customer_email: "cia@example.com" });
      assert.equal(result.trialDays, 7);
    }
  });

  it("grants first-time trial without customer_email for phone storage emails", () => {
    const result = decideStripeCheckout(
      {
        id: 4,
        name: "Dan",
        email: "46701234567@phone.smakvarlden.local",
        plan: "free",
        stripeCustomerId: null,
      },
      { trialDays: 7, isDeliverableEmail: deliverable },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.customerParams, {});
      assert.equal(result.trialDays, 7);
    }
  });
});
