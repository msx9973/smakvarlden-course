import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  if (req.body && Object.keys(req.body).length > 0) return next();

  const encodedPayload = req.headers["x-smakvarlden-payload"];
  if (typeof encodedPayload === "string" && encodedPayload.length > 0) {
    try {
      req.body = JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf8"));
    } catch {
      req.body = {};
    }
  }

  next();
});

app.use("/api", router);

/* ── Static frontend (production) ──────────────────────── */
// import.meta.url is undefined in CJS bundles; fall back to STATIC_DIR env var or skip.
const staticDir = process.env.STATIC_DIR ?? (() => {
  try { return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "smakvarlden", "dist", "public"); }
  catch { return ""; }
})();

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  logger.warn({ staticDir }, "Static directory not found — frontend not served");
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
