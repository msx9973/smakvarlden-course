import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

async function getFreePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
}

async function waitForServer(port, child, logs) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, `server exited early:\n${logs()}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/healthz`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server did not start:\n${logs()}`);
}

const port = await getFreePort();
let output = "";
const child = spawn(process.execPath, ["--enable-source-maps", "./dist/index.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: String(port),
    SESSION_SECRET: "test-session-secret",
    STATIC_DIR: "/tmp/smakvarlden-test-static-missing",
    STRIPE_SECRET_KEY: "sk_test_1234567890",
    STRIPE_WEBHOOK_SECRET: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });

try {
  await waitForServer(port, child, () => output);

  const response = await fetch(`http://127.0.0.1:${port}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "evt_test_route", type: "ping", data: { object: {} } }),
  });

  assert.equal(response.status, 200, `expected public webhook to return 200, got ${response.status}: ${await response.text()}`);
  assert.deepEqual(await response.json(), { received: true });
} finally {
  child.kill();
}
