import { Router } from "express";
import { db, ingredientsTable, recipesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

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
  const ingredientRows = await db
    .select({
      category: ingredientsTable.category,
      count: sql<number>`count(*)::int`,
      avgPriceSek: sql<number>`avg(current_price_sek::numeric)`,
      totalPriceSek: sql<number>`sum(current_price_sek::numeric)`,
    })
    .from(ingredientsTable)
    .groupBy(ingredientsTable.category);

  const ingredients = await db
    .select({
      id: ingredientsTable.id,
      name: ingredientsTable.name,
      category: ingredientsTable.category,
      unit: ingredientsTable.unit,
      currentPriceSek: ingredientsTable.currentPriceSek,
      priceChangePct: ingredientsTable.priceChangePct,
      supplier: ingredientsTable.supplier,
    })
    .from(ingredientsTable);

  const [recipeSummary] = await db
    .select({
      avgCost: sql<number>`avg(total_cost_sek::numeric)`,
      totalRecipes: sql<number>`count(*)::int`,
    })
    .from(recipesTable);

  const avgDailyPortions = 40;

  const categorySvinn = ingredientRows.map((row) => {
    const rate = SVINN_RATES[row.category] ?? DEFAULT_RATE;
    const totalCost = Number(row.totalPriceSek ?? 0);
    const wasteCost = totalCost * (rate / 100);
    const weeklyCost = wasteCost * avgDailyPortions * 7 * 0.001;
    const categoryIngredients = ingredients
      .filter((ingredient) => ingredient.category === row.category)
      .map((ingredient) => {
        const currentPriceSek = Number(ingredient.currentPriceSek);
        const ingredientWasteCostSek = currentPriceSek * (rate / 100);
        return {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentPriceSek: Math.round(currentPriceSek * 100) / 100,
          priceChangePct: Number(ingredient.priceChangePct),
          supplier: ingredient.supplier ?? null,
          estimatedWasteCostSek: Math.round(ingredientWasteCostSek * 100) / 100,
          estimatedWeeklyWasteSek: Math.round(ingredientWasteCostSek * avgDailyPortions * 7 * 0.001 * 100) / 100,
        };
      })
      .sort((a, b) => b.estimatedWasteCostSek - a.estimatedWasteCostSek);

    return {
      category: row.category,
      svinnRatePct: rate,
      ingredientCount: row.count,
      avgPriceSek: Math.round(Number(row.avgPriceSek) * 100) / 100,
      totalIngredientCostSek: Math.round(totalCost * 100) / 100,
      wasteCostSek: Math.round(wasteCost * 100) / 100,
      estimatedWeeklyWasteSek: Math.round(weeklyCost * 100) / 100,
      ingredients: categoryIngredients,
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
    dataNote: "Estimerad svinnanalys. Kostnader baseras på dina ingredienskategorier, schabloniserade branschvärden och antagandet 40 portioner per dag.",
    assumptions: {
      avgDailyPortions,
      monthlyWeeks: 4.33,
      method: "category-rate-estimate",
    },
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
