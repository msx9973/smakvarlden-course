import { Router } from "express";
import { db, recipesTable, ingredientsTable, communityPostsTable, activityLogTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GetDashboardRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/summary", async (_req, res) => {
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
});

router.get("/recent-activity", async (req, res) => {
  const parsed = GetDashboardRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const rows = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.timestamp)).limit(limit);
  return res.json(rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    timestamp: r.timestamp.toISOString(),
  })));
});

export default router;
