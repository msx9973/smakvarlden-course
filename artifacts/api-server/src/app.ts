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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use((err: Error & { cause?: Error }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err.message, cause: (err.cause as Error)?.message, type: err.constructor?.name });
});

export default app;
