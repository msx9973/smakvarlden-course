import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug-env", (_req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  res.json({
    DATABASE_URL_set: !!dbUrl,
    DATABASE_URL_preview: dbUrl ? `${dbUrl.slice(0, 20)}...${dbUrl.slice(-20)}` : null,
    NODE_ENV: process.env.NODE_ENV ?? "(not set)",
    node_version: process.version,
  });
});

export default router;
