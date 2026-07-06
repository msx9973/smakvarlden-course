import { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL = "postgres://user:pass@127.0.0.1:1/db";
process.env.SESSION_SECRET = "test-session-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_route_smoke";
process.env.STRIPE_WEBHOOK_SECRET = "";
process.env.NODE_ENV = "production";
process.env.AWS_LAMBDA_FUNCTION_NAME = "stripe-webhook-route-smoke";

const require = createRequire(import.meta.url);
const { handler } = require("../../../netlify/functions/api.js");

function event(path, method, body) {
  return {
    path,
    rawPath: path,
    httpMethod: method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: { http: { method } },
  };
}

test("Stripe webhook is public while checkout remains protected", async () => {
  const webhookRes = await handler(
    event("/api/stripe/webhook", "POST", {
      id: "evt_route_smoke",
      object: "event",
      type: "ping",
      data: { object: {} },
    }),
    {},
  );

  assert.equal(
    webhookRes.statusCode,
    200,
    `expected public webhook to accept Stripe event, got ${webhookRes.statusCode}: ${webhookRes.body}`,
  );
  assert.deepEqual(JSON.parse(webhookRes.body), { received: true });

  const checkoutRes = await handler(
    event("/api/stripe/checkout", "POST", {}),
    {},
  );

  assert.equal(checkoutRes.statusCode, 401);
});
