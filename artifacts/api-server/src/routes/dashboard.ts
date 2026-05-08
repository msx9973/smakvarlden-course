import { Router } from "express";
import { db, recipesTable, ingredientsTable, communityPostsTable, activityLogTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GetDashboardRecentActivityQueryParams } from "@workspace/api-zod";
import { demoActivity, demoIngredients, demoRecipes, hasDemoFallbackError } from "../lib/demo-data";

const router = Router();

router.get("/summary", async (_req, res) => {
  try {
    const [recipeSummary] = await db.select({
      total: sql<number>`count(*)::int`,
      avgCost: sql<number>`avg(total_cost_sek::numeric)`,
      avgMargin: sql<number>`avg(profit_margin_pct::numeric)`,
      sharedCount: sql<number>`count(*) filter (where is_shared = true)::int`,
    }).from(recipesTable);

    const [ingredientSummary] = await db.select({
      total: sql<number>`count(*)::int`,
      alerts: sql<number>`count(*) filter (where abs(price_change_pct::numeric) > 5)::int`,
    }).from(ingredientsTable);

    const [communitySummary] = await db.select({
      total: sql<number>`count(*)::int`,
    }).from(communityPostsTable);

    const [topCategoryRow] = await db.select({
      category: recipesTable.category,
      cnt: sql<number>`count(*)::int`,
    }).from(recipesTable).groupBy(recipesTable.category).orderBy(desc(sql`count(*)`)).limit(1);

    if ((recipeSummary.total ?? 0) > 0 || (ingredientSummary.total ?? 0) > 0) {
      return res.json({
        totalRecipes: recipeSummary.total ?? 0,
        totalIngredients: ingredientSummary.total ?? 0,
        avgRecipeCostSek: Math.round(Number(recipeSummary.avgCost ?? 0) * 100) / 100,
        avgProfitMarginPct: Math.round(Number(recipeSummary.avgMargin ?? 0) * 100) / 100,
        totalCommunityPosts: communitySummary.total ?? 0,
        topCategory: topCategoryRow?.category ?? "Ingen",
        priceAlerts: ingredientSummary.alerts ?? 0,
        sharedRecipes: recipeSummary.sharedCount ?? 0,
      });
    }
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const avgRecipeCostSek = demoRecipes.reduce((sum, recipe) => sum + recipe.totalCostSek, 0) / demoRecipes.length;
  const avgProfitMarginPct = demoRecipes.reduce((sum, recipe) => sum + recipe.profitMarginPct, 0) / demoRecipes.length;
  return res.json({
    totalRecipes: demoRecipes.length,
    totalIngredients: demoIngredients.length,
    avgRecipeCostSek: Math.round(avgRecipeCostSek * 100) / 100,
    avgProfitMarginPct: Math.round(avgProfitMarginPct * 100) / 100,
    totalCommunityPosts: demoRecipes.filter((recipe) => recipe.isShared).length,
    topCategory: "Huvudratter",
    priceAlerts: demoIngredients.filter((ingredient) => Math.abs(ingredient.priceChangePct) > 5).length,
    sharedRecipes: demoRecipes.filter((recipe) => recipe.isShared).length,
  });
});

router.get("/recent-activity", async (req, res) => {
  const parsed = GetDashboardRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  try {
    const rows = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.timestamp)).limit(limit);
    if (rows.length > 0) {
      return res.json(rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        subtitle: r.subtitle,
        timestamp: r.timestamp.toISOString(),
      })));
    }
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  return res.json(demoActivity.slice(0, limit).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    timestamp: r.timestamp.toISOString(),
  })));
});

export default router;
