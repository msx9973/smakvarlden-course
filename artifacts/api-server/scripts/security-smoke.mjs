import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.NODE_ENV = "production";
process.env.AWS_LAMBDA_FUNCTION_NAME ??= "security-smoke";
process.env.DATABASE_URL ??= "postgres://smoke:smoke@localhost:5432/smoke";
process.env.SESSION_SECRET ??= "security-smoke-session-secret";
process.env.STRIPE_SECRET_KEY ??= "sk_test_security_smoke";
process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_security_smoke";

const require = createRequire(import.meta.url);
const { handler } = require("../../../netlify/functions/api.js");

async function request(path, method, body, headers = {}) {
  return handler(
    {
      path,
      rawPath: path,
      httpMethod: method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body === undefined ? null : JSON.stringify(body),
      isBase64Encoded: false,
    },
    {},
  );
}

const recipeCreate = await request("/api/recipes", "POST", {
  name: "Smoke recipe",
  category: "Smoke",
  servings: 1,
  sellingPriceSek: 1,
});
assert.equal(recipeCreate.statusCode, 401, "recipe creation must require auth in the deployed function");

const ingredientDelete = await request("/api/ingredients/1", "DELETE");
assert.equal(ingredientDelete.statusCode, 401, "ingredient deletion must require auth in the deployed function");

const unsignedWebhook = await request("/api/stripe/webhook", "POST", {
  id: "evt_forged",
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: { user_id: "1" },
      customer: "cus_forged",
    },
  },
});
assert.equal(unsignedWebhook.statusCode, 400, "unsigned Stripe webhooks must be rejected before plan updates");

console.log("security smoke checks passed");
