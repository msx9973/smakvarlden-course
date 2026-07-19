import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import healthRouter from "./health";
import recipesRouter from "./recipes";
import ingredientsRouter from "./ingredients";
import dashboardRouter from "./dashboard";
import communityRouter from "./community";
import authRouter from "./auth";
import aiRouter from "./ai";
import scbRouter from "./scb";
import svinnRouter from "./svinn";
import marketRouter from "./market";
import spoonacularRouter from "./spoonacular";
import stripeRouter, { handleStripeWebhook } from "./stripe";
import demoRouter from "./demo";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);
router.post("/stripe/webhook", handleStripeWebhook);

// Community read is public, write requires auth (guards inside communityRouter)
router.use("/community", communityRouter);

// Admin-only routes keep their existing public URL paths but require admin auth.
router.use("/ai", requireAuth, requireAdmin);
router.use("/ingredients/sync-scb", requireAuth, requireAdmin);
router.use(aiRouter);
router.use(scbRouter);

// Protected routes
router.use("/recipes",     requireAuth, recipesRouter);
router.use("/ingredients", requireAuth, ingredientsRouter);
router.use("/dashboard",   requireAuth, dashboardRouter);
router.use("/svinn",       requireAuth, svinnRouter);
router.use("/market",      requireAuth, marketRouter);
router.use("/spoonacular", requireAuth, spoonacularRouter);
router.use("/starter",     requireAuth, demoRouter);
router.use("/demo",        requireAuth, demoRouter);

// Stripe checkout (auth required)
router.use("/stripe", requireAuth, stripeRouter);

export default router;
