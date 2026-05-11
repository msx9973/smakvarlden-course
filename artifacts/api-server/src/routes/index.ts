import { Router, type IRouter } from "express";
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
import stripeRouter from "./stripe";
import demoRouter from "./demo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(scbRouter);
router.use("/recipes", recipesRouter);
router.use("/ingredients", ingredientsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/community", communityRouter);
router.use("/svinn", svinnRouter);
router.use("/market", marketRouter);
router.use("/spoonacular", spoonacularRouter);
router.use("/stripe", stripeRouter);
router.use("/starter", demoRouter);
router.use("/demo", demoRouter);

export default router;
