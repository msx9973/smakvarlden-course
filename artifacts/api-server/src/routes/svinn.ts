import { Router } from "express";
import { db, ingredientsTable, recipesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { demoIngredients, demoRecipes, hasDemoFallbackError, type DemoIngredient } from "../lib/demo-data";

const router = Router();

const SVINN_RATES: Record<string, number> = {
  "Kött":             12,
  "Fisk & skaldjur":  18,
  "Grönsaker":        20,
  "Mejeri":            3,
  "Svamp & vilt":     10,
  "Kryddor":           5,
  "Spannmål":          2,
  "Oljor":             1,
  "Drycker":           2,
  "Frukt":            15,
  "Nötter & frön":     4,
  "Torvaror":          2,
  "Örter":            22,
  "Smaksättare":       3,
  "Ägg & mejeriprodukter": 4,
};

const DEFAULT_RATE = 8;

const SVINN_TIPS = [
  { icon: "🥩", title: "FIFO-principen", desc: "Rotera alltid råvaror — First In, First Out. Äldre varor framåt i kylen." },
  { icon: "📏", title: "Portionsstorleksstyrning", desc: "Standardiserade portioner minskar svinn med upp till 15%. Använd en våg konsekvent." },
  { icon: "🍃", title: "Stamhantering", desc: "Roten och stammarna från grönsaker kan användas till buljonger och sparar 5–10%." },
  { icon: "❄️", title: "Vakuumförvaring", desc: "Vakuumförpackat kött håller 3× längre. Investera i en vakuummaskin." },
  { icon: "📋", title: "Behovsstyrd inköp", desc: "Planera veckans meny i förväg och köp exakt vad som behövs. Minskar svinn 20–30%." },
  { icon: "♻️", title: "Återanvänd trimspill", desc: "Fiskhuvud, benskaldjur och grönsaksskal ger utmärkt fond och buljonger." },
];

router.get("/summary", async (_req, res) => {
  let ingredientRows: Array<{
    category: string;
    count: number;
    avgPriceSek: number;
    totalPriceSek: number;
  }>;
  let recipeSummary: { avgCost: number | null; totalRecipes: number } | undefined;

  try {
    ingredientRows = await db
      .select({
        category: ingredientsTable.category,
        count: sql<number>`count(*)::int`,
        avgPriceSek: sql<number>`avg(current_price_sek::numeric)`,
        totalPriceSek: sql<number>`sum(current_price_sek::numeric)`,
      })
      .from(ingredientsTable)
      .groupBy(ingredientsTable.category);

    [recipeSummary] = await db
      .select({
        avgCost: sql<number>`avg(total_cost_sek::numeric)`,
        totalRecipes: sql<number>`count(*)::int`,
      })
      .from(recipesTable);

    if (ingredientRows.length === 0) throw new Error("No database rows, using demo svinn data");
  } catch (error) {
    if (!hasDemoFallbackError(error) && !(error instanceof Error && error.message.includes("demo svinn"))) throw error;
    const grouped = new Map<string, DemoIngredient[]>();
    for (const ingredient of demoIngredients) {
      grouped.set(ingredient.category, [...(grouped.get(ingredient.category) ?? []), ingredient]);
    }
    ingredientRows = [...grouped.entries()].map(([category, ingredients]) => {
      const totalPriceSek = ingredients.reduce((sum, ingredient) => sum + ingredient.currentPriceSek, 0);
      return {
        category,
        count: ingredients.length,
        avgPriceSek: totalPriceSek / ingredients.length,
        totalPriceSek,
      };
    });
    recipeSummary = {
      avgCost: demoRecipes.reduce((sum, recipe) => sum + recipe.totalCostSek, 0) / demoRecipes.length,
      totalRecipes: demoRecipes.length,
    };
  }

  const avgDailyPortions = 40;

  const categorySvinn = ingredientRows.map((row) => {
    const rate = SVINN_RATES[row.category] ?? DEFAULT_RATE;
    const totalCost = Number(row.totalPriceSek ?? 0);
    const wasteCost = totalCost * (rate / 100);
    const weeklyCost = wasteCost * avgDailyPortions * 7 * 0.001;
    return {
      category: row.category,
      svinnRatePct: rate,
      ingredientCount: row.count,
      avgPriceSek: Math.round(Number(row.avgPriceSek) * 100) / 100,
      totalIngredientCostSek: Math.round(totalCost * 100) / 100,
      wasteCostSek: Math.round(wasteCost * 100) / 100,
      estimatedWeeklyWasteSek: Math.round(weeklyCost * 100) / 100,
    };
  }).sort((a, b) => b.wasteCostSek - a.wasteCostSek);

  const totalWasteCostSek = categorySvinn.reduce((s, r) => s + r.wasteCostSek, 0);
  const totalIngredientCostSek = categorySvinn.reduce((s, r) => s + r.totalIngredientCostSek, 0);
  const weeklyWasteSek = categorySvinn.reduce((s, r) => s + r.estimatedWeeklyWasteSek, 0);
  const avgWasteRatePct = totalIngredientCostSek > 0
    ? Math.round((totalWasteCostSek / totalIngredientCostSek) * 100 * 10) / 10
    : 0;

  const monthlyWasteSek = weeklyWasteSek * 4.33;
  const yearlyWasteSek = monthlyWasteSek * 12;

  return res.json({
    totalWasteCostSek: Math.round(totalWasteCostSek * 100) / 100,
    weeklyWasteSek: Math.round(weeklyWasteSek * 100) / 100,
    monthlyWasteSek: Math.round(monthlyWasteSek * 100) / 100,
    yearlyWasteSek: Math.round(yearlyWasteSek * 100) / 100,
    avgWasteRatePct,
    totalIngredientCostSek: Math.round(totalIngredientCostSek * 100) / 100,
    avgRecipeCostSek: Math.round(Number(recipeSummary?.avgCost ?? 0) * 100) / 100,
    totalRecipes: recipeSummary?.totalRecipes ?? 0,
    categorySvinn,
    tips: SVINN_TIPS,
  });
});

export default router;
