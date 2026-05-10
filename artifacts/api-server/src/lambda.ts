import serverless from "serverless-http";

let handler: ReturnType<typeof serverless>;

try {
  const { default: app } = await import("./app");
  handler = serverless(app);
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("STARTUP CRASH:", msg);
  handler = serverless(((_req: unknown, res: { status: (n: number) => { json: (o: unknown) => void } }) => {
    res.status(500).json({ error: "Server failed to start", details: msg });
  }) as Parameters<typeof serverless>[0]);
}

export { handler };
