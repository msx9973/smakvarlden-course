import assert from "node:assert/strict";

process.env.SESSION_SECRET = "test-session-secret";
process.env.STATIC_DIR = "/tmp/smakvarlden-test-static-missing";
process.env.STRIPE_SECRET_KEY = "sk_test_1234567890";
process.env.STRIPE_WEBHOOK_SECRET = "";

const mod = await import("../../../netlify/functions/api.js");
const handler = mod.handler ?? mod.default?.handler;
assert.equal(typeof handler, "function", "expected Netlify function to export handler");

const response = await handler({
  httpMethod: "POST",
  path: "/api/stripe/webhook",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ id: "evt_test_route", type: "ping", data: { object: {} } }),
  isBase64Encoded: false,
}, {});

assert.equal(response.statusCode, 200, `expected public webhook to return 200, got ${response.statusCode}: ${response.body}`);
assert.deepEqual(JSON.parse(response.body), { received: true });
