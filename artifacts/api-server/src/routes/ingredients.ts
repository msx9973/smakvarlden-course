import { Router } from "express";
import {
  db,
  ingredientsTable,
  activityLogTable,
  recipeIngredientsTable,
  recipesTable,
} from "@workspace/db";
import { eq, ilike, and, sql, inArray } from "drizzle-orm";
import {
  CreateIngredientBody,
  ListIngredientsQueryParams,
  GetIngredientParams,
  UpdateIngredientBody,
  UpdateIngredientParams,
  DeleteIngredientParams,
} from "@workspace/api-zod";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────

function formatIngredient(row: typeof ingredientsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentPriceSek: parseFloat(String(row.currentPriceSek)),
    priceChangePct: parseFloat(String(row.priceChangePct)),
    supplier: row.supplier ?? undefined,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Recalculates totalCostSek and profitMarginPct for every recipe
 * that contains any of the given ingredient IDs.
 * Called after a price update or ingredient deletion so recipe margins
 * never go stale.
 */
async function recalcRecipesForIngredients(ingredientIds: number[]) {
  if (!ingredientIds.length) return;

  // Find all affected recipe IDs
  const affected = await db
    .selectDistinct({ recipeId: recipeIngredientsTable.recipeId })
    .from(recipeIngredientsTable)
    .where(inArray(recipeIngredientsTable.ingredientId, ingredientIds));

  if (!affected.length) return;

  const recipeIds = affected.map((r) => r.recipeId);

  // For each recipe, sum up line costs from current ingredient prices
  for (const recipeId of recipeIds) {
    const lines = await db
      .select({
        quantity: recipeIngredientsTable.quantity,
        priceSek: ingredientsTable.currentPriceSek,
      })
      .from(recipeIngredientsTable)
      .innerJoin(
        ingredientsTable,
        eq(recipeIngredientsTable.ingredientId, ingredientsTable.id),
      )
      .where(eq(recipeIngredientsTable.recipeId, recipeId));

    const totalCost = lines.reduce(
      (sum, l) =>
        sum + parseFloat(String(l.quantity)) * parseFloat(String(l.priceSek)),
      0,
    );
    const roundedCost = Math.round(totalCost * 100) / 100;

    const [recipe] = await db
      .select({ sellingPriceSek: recipesTable.sellingPriceSek })
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId));

    if (!recipe) continue;

    const sellingPrice = parseFloat(String(recipe.sellingPriceSek));
    const margin =
      sellingPrice > 0
        ? Math.round(
            ((sellingPrice - roundedCost) / sellingPrice) * 100 * 100,
          ) / 100
        : 0;

    await db
      .update(recipesTable)
      .set({
        totalCostSek: String(roundedCost),
        profitMarginPct: String(margin),
        updatedAt: new Date(),
      })
      .where(eq(recipesTable.id, recipeId));
  }
}

// ── Routes ────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const parsed = ListIngredientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { category, search } = parsed.data;
  const conditions = [];
  if (category) conditions.push(eq(ingredientsTable.category, category));
  if (search) conditions.push(ilike(ingredientsTable.name, `%${search}%`));
  const rows = await db
    .select()
    .from(ingredientsTable)
    .where(conditions.length ? and(...conditions) : undefined);
  return res.json(rows.map(formatIngredient));
});

router.post("/", async (req, res) => {
  const parsed = CreateIngredientBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const [row] = await db
    .insert(ingredientsTable)
    .values({
      name: parsed.data.name,
      category: parsed.data.category,
      unit: parsed.data.unit,
      currentPriceSek: String(parsed.data.currentPriceSek),
      supplier: parsed.data.supplier ?? null,
      priceChangePct: "0",
    })
    .returning();
  await db.insert(activityLogTable).values({
    type: "recipe_created",
    title: `Ny ingrediens tillagd: ${row.name}`,
    subtitle: `${row.category} · ${row.currentPriceSek} SEK/${row.unit}`,
  });
  return res.status(201).json(formatIngredient(row));
});

/**
 * Price trends — returns the actual stored price plus deterministic
 * historical offsets derived from the ingredient ID (not Math.random()).
 * This ensures the chart shows consistent data across page loads.
 *
 * For a proper production implementation, store a price_history table
 * and record a snapshot each time the price is updated.
 */
router.get("/price-trends", async (_req, res) => {
  const rows = await db.select().from(ingredientsTable).limit(8);
  const trends: {
    ingredientId: number;
    ingredientName: string;
    date: string;
    priceSek: number;
  }[] = [];

  const now = new Date();
  for (const ing of rows) {
    const base = parseFloat(String(ing.currentPriceSek));
    // Use a seeded, deterministic variation based on ingredient ID
    // so the chart is stable across reloads (no Math.random()).
    // Values oscillate ±12% over the 7-week window.
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      // Deterministic: sin wave seeded by ingredient id + week index
      const seed = (ing.id * 17 + i * 31) % 100;
      const variation = base * (0.88 + (seed / 100) * 0.24);
      trends.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        date: d.toISOString().slice(0, 10),
        priceSek: Math.round(variation * 100) / 100,
      });
    }
  }
  return res.json(trends);
});

router.get("/category-breakdown", async (_req, res) => {
  const rows = await db
    .select({
      category: ingredientsTable.category,
      count: sql<number>`count(*)::int`,
      avgPriceSek: sql<number>`avg(current_price_sek::numeric)`,
      totalPriceSek: sql<number>`sum(current_price_sek::numeric)`,
    })
    .from(ingredientsTable)
    .groupBy(ingredientsTable.category);
  return res.json(
    rows.map((r) => ({
      category: r.category,
      count: r.count,
      avgPriceSek: Math.round(Number(r.avgPriceSek) * 100) / 100,
      totalPriceSek: Math.round(Number(r.totalPriceSek) * 100) / 100,
    })),
  );
});

router.get("/:id", async (req, res) => {
  const parsed = GetIngredientParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db
    .select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatIngredient(row));
});

router.put("/:id", async (req, res) => {
  const paramParsed = UpdateIngredientParams.safeParse({
    id: Number(req.params.id),
  });
  const bodyParsed = UpdateIngredientBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const existing = await db
    .select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, paramParsed.data.id));
  if (!existing.length) return res.status(404).json({ error: "Not found" });

  const oldPrice = parseFloat(String(existing[0].currentPriceSek));
  const newPrice = bodyParsed.data.currentPriceSek ?? oldPrice;
  const changePct =
    oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

  const [row] = await db
    .update(ingredientsTable)
    .set({
      name: bodyParsed.data.name ?? existing[0].name,
      category: bodyParsed.data.category ?? existing[0].category,
      unit: bodyParsed.data.unit ?? existing[0].unit,
      currentPriceSek: String(newPrice),
      priceChangePct: String(Math.round(changePct * 100) / 100),
      supplier: bodyParsed.data.supplier ?? existing[0].supplier,
      updatedAt: new Date(),
    })
    .where(eq(ingredientsTable.id, paramParsed.data.id))
    .returning();

  if (Math.abs(changePct) > 0.01) {
    await db.insert(activityLogTable).values({
      type: "price_change",
      title: `Prisändring: ${row.name}`,
      subtitle: `${changePct > 0 ? "+" : ""}${Math.round(changePct * 10) / 10}% till ${newPrice} SEK/${row.unit}`,
    });
  }

  // Recalculate all recipe costs that use this ingredient
  await recalcRecipesForIngredients([paramParsed.data.id]);

  return res.json(formatIngredient(row));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteIngredientParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  // Recalculate affected recipe costs BEFORE deleting the ingredient,
  // while the FK join still resolves. After deletion the cascade removes
  // recipe_ingredients rows, so recipe costs are implicitly reduced.
  // We set the ingredient's contribution to 0 by removing it first from
  // recipe_ingredients then recalculating.
  const affectedRecipes = await db
    .selectDistinct({ recipeId: recipeIngredientsTable.recipeId })
    .from(recipeIngredientsTable)
    .where(eq(recipeIngredientsTable.ingredientId, parsed.data.id));

  // Delete ingredient (cascades to recipe_ingredients via FK)
  await db
    .delete(ingredientsTable)
    .where(eq(ingredientsTable.id, parsed.data.id));

  // Recalculate affected recipes now that the ingredient is gone
  if (affectedRecipes.length) {
    const recipeIds = affectedRecipes.map((r) => r.recipeId);
    for (const recipeId of recipeIds) {
      const lines = await db
        .select({
          quantity: recipeIngredientsTable.quantity,
          priceSek: ingredientsTable.currentPriceSek,
        })
        .from(recipeIngredientsTable)
        .innerJoin(
          ingredientsTable,
          eq(recipeIngredientsTable.ingredientId, ingredientsTable.id),
        )
        .where(eq(recipeIngredientsTable.recipeId, recipeId));

      const totalCost = lines.reduce(
        (sum, l) =>
          sum +
          parseFloat(String(l.quantity)) * parseFloat(String(l.priceSek)),
        0,
      );
      const roundedCost = Math.round(totalCost * 100) / 100;

      const [recipe] = await db
        .select({ sellingPriceSek: recipesTable.sellingPriceSek })
        .from(recipesTable)
        .where(eq(recipesTable.id, recipeId));
      if (!recipe) continue;

      const sellingPrice = parseFloat(String(recipe.sellingPriceSek));
      const margin =
        sellingPrice > 0
          ? Math.round(
              ((sellingPrice - roundedCost) / sellingPrice) * 100 * 100,
            ) / 100
          : 0;

      await db
        .update(recipesTable)
        .set({
          totalCostSek: String(roundedCost),
          profitMarginPct: String(margin),
          updatedAt: new Date(),
        })
        .where(eq(recipesTable.id, recipeId));
    }
  }

  return res.status(204).send();
});

export default router;
