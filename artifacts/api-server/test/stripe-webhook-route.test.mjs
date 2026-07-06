import { once } from "node:events";
import { spawn } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const PORT = String(19080 + Math.floor(Math.random() * 1000));
const BASE = `http://127.0.0.1:${PORT}`;

async function waitForServer(child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API server exited early with code ${child.exitCode}`);
    }

    try {
      const res = await fetch(`${BASE}/api/healthz`);
      if (res.ok) return;
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Timed out waiting for API server to start");
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

test("Stripe webhook is public while checkout remains protected", async (t) => {
  const child = spawn(process.execPath, ["--enable-source-maps", "./dist/index.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT,
      DATABASE_URL: "postgres://user:pass@127.0.0.1:1/db",
      SESSION_SECRET: "test-session-secret",
      STRIPE_SECRET_KEY: "sk_test_route_smoke",
      STRIPE_WEBHOOK_SECRET: "",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => stopServer(child));

  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });

  await waitForServer(child);

  const webhookRes = await fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "evt_route_smoke",
      object: "event",
      type: "ping",
      data: { object: {} },
    }),
  });

  assert.equal(
    webhookRes.status,
    200,
    `expected public webhook to accept Stripe event, got ${webhookRes.status}\n${output}`,
  );
  assert.deepEqual(await webhookRes.json(), { received: true });

  const checkoutRes = await fetch(`${BASE}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  assert.equal(checkoutRes.status, 401);
});
