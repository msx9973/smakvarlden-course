import { Router } from "express";
import { db, recipesTable, recipeIngredientsTable, ingredientsTable, activityLogTable } from "@workspace/db";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { demoRecipes, hasDemoFallbackError, type DemoRecipe } from "../lib/demo-data";
import {
  CreateRecipeBody,
  ListRecipesQueryParams,
  GetRecipeParams,
  UpdateRecipeBody,
  UpdateRecipeParams,
  DeleteRecipeParams,
  GetTopPerformingRecipesQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/top-performing", async (req, res) => {
  const parsed = GetTopPerformingRecipesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;
  try {
    const rows = await db.select().from(recipesTable).orderBy(desc(recipesTable.profitMarginPct)).limit(limit);
    if (rows.length > 0) {
      return res.json(rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        totalCostSek: parseFloat(String(r.totalCostSek)),
        sellingPriceSek: parseFloat(String(r.sellingPriceSek)),
        profitMarginPct: parseFloat(String(r.profitMarginPct)),
        profitSek: parseFloat(String(r.sellingPriceSek)) - parseFloat(String(r.totalCostSek)),
      })));
    }
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const rows = [...demoRecipes].sort((a, b) => b.profitMarginPct - a.profitMarginPct).slice(0, limit);
  return res.json(rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    totalCostSek: r.totalCostSek,
    sellingPriceSek: r.sellingPriceSek,
    profitMarginPct: r.profitMarginPct,
    profitSek: r.sellingPriceSek - r.totalCostSek,
  })));
});

router.get("/", async (req, res) => {
  const parsed = ListRecipesQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });
  const { category, search } = parsed.data;
  try {
    const conditions = [];
    if (category) conditions.push(eq(recipesTable.category, category));
    if (search) conditions.push(ilike(recipesTable.name, `%${search}%`));
    const rows = await db.select().from(recipesTable).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(recipesTable.updatedAt));
    if (rows.length > 0) return res.json(rows.map(formatRecipe));
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const normalizedSearch = search?.toLowerCase();
  const rows = demoRecipes.filter((recipe) => {
    if (category && recipe.category !== category) return false;
    if (normalizedSearch && !recipe.name.toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });
  return res.json(rows.map((recipe) => formatDemoRecipe(recipe)));
});

router.post("/", async (req, res) => {
  const parsed = CreateRecipeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error });

  const { name, description, category, servings, sellingPriceSek, isShared, ingredients } = parsed.data;

  let totalCostSek = 0;
  if (ingredients && ingredients.length > 0) {
    const ingredientIds = ingredients.map((i) => i.ingredientId);
    const ingRows = await db.select().from(ingredientsTable).where(
      sql`${ingredientsTable.id} = ANY(${ingredientIds})`
    );
    const priceMap = new Map(ingRows.map((r) => [r.id, parseFloat(String(r.currentPriceSek))]));
    totalCostSek = ingredients.reduce((sum, i) => {
      return sum + (priceMap.get(i.ingredientId) ?? 0) * i.quantity;
    }, 0);
  }

  const profitMarginPct = sellingPriceSek > 0
    ? ((sellingPriceSek - totalCostSek) / sellingPriceSek) * 100
    : 0;

  const [recipe] = await db.insert(recipesTable).values({
    name,
    description: description ?? null,
    category,
    servings,
    totalCostSek: String(Math.round(totalCostSek * 100) / 100),
    sellingPriceSek: String(sellingPriceSek),
    profitMarginPct: String(Math.round(profitMarginPct * 100) / 100),
    isShared: isShared ?? false,
  }).returning();

  if (ingredients && ingredients.length > 0) {
    await db.insert(recipeIngredientsTable).values(
      ingredients.map((i) => ({
        recipeId: recipe.id,
        ingredientId: i.ingredientId,
        quantity: String(i.quantity),
        unit: i.unit,
      }))
    );
  }

  await db.insert(activityLogTable).values({
    type: "recipe_created",
    title: `Nytt recept: ${recipe.name}`,
    subtitle: `${category} · ${Math.round(totalCostSek * 100) / 100} SEK kostnad`,
  });

  return res.status(201).json(formatRecipe(recipe));
});

router.get("/:id", async (req, res) => {
  const parsed = GetRecipeParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.id, parsed.data.id));
    if (!recipe) return res.status(404).json({ error: "Not found" });

    const recipeIngredients = await db
      .select({
        ingredientId: recipeIngredientsTable.ingredientId,
        ingredientName: ingredientsTable.name,
        quantity: recipeIngredientsTable.quantity,
        unit: recipeIngredientsTable.unit,
        unitPriceSek: ingredientsTable.currentPriceSek,
      })
      .from(recipeIngredientsTable)
      .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredientId, ingredientsTable.id))
      .where(eq(recipeIngredientsTable.recipeId, recipe.id));

    return res.json({
      ...formatRecipe(recipe),
      ingredients: recipeIngredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredientName,
        quantity: parseFloat(String(ri.quantity)),
        unit: ri.unit,
        unitPriceSek: parseFloat(String(ri.unitPriceSek)),
        lineCostSek: Math.round(parseFloat(String(ri.quantity)) * parseFloat(String(ri.unitPriceSek)) * 100) / 100,
      })),
    });
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const recipe = demoRecipes.find((r) => r.id === parsed.data.id);
  if (!recipe) return res.status(404).json({ error: "Not found" });
  return res.json(formatDemoRecipe(recipe, true));
});

router.put("/:id", async (req, res) => {
  const paramParsed = UpdateRecipeParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateRecipeBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [existing] = await db.select().from(recipesTable).where(eq(recipesTable.id, paramParsed.data.id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const [updated] = await db.update(recipesTable)
    .set({
      name: bodyParsed.data.name ?? existing.name,
      description: bodyParsed.data.description ?? existing.description,
      category: bodyParsed.data.category ?? existing.category,
      servings: bodyParsed.data.servings ?? existing.servings,
      sellingPriceSek: bodyParsed.data.sellingPriceSek ? String(bodyParsed.data.sellingPriceSek) : existing.sellingPriceSek,
      isShared: bodyParsed.data.isShared ?? existing.isShared,
      updatedAt: new Date(),
    })
    .where(eq(recipesTable.id, paramParsed.data.id))
    .returning();

  await db.insert(activityLogTable).values({
    type: "recipe_updated",
    title: `Recept uppdaterat: ${updated.name}`,
    subtitle: updated.category,
  });

  return res.json(formatRecipe(updated));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteRecipeParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(recipesTable).where(eq(recipesTable.id, parsed.data.id));
  return res.status(204).send();
});

function formatRecipe(r: typeof recipesTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    category: r.category,
    servings: r.servings,
    totalCostSek: parseFloat(String(r.totalCostSek)),
    sellingPriceSek: parseFloat(String(r.sellingPriceSek)),
    profitMarginPct: parseFloat(String(r.profitMarginPct)),
    isShared: r.isShared,
    dietaryTags: [],
    allergens: [],
    allergyVersions: [],
    languageVersions: {
      sv: { name: r.name, description: r.description ?? "" },
      en: { name: r.name, description: r.description ?? "" },
      es: { name: r.name, description: r.description ?? "" },
      de: { name: r.name, description: r.description ?? "" },
      fr: { name: r.name, description: r.description ?? "" },
      fi: { name: r.name, description: r.description ?? "" },
    },
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function formatDemoRecipe(r: DemoRecipe, includeIngredients = false) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    servings: r.servings,
    totalCostSek: r.totalCostSek,
    sellingPriceSek: r.sellingPriceSek,
    profitMarginPct: r.profitMarginPct,
    isShared: r.isShared,
    dietaryTags: r.dietaryTags,
    allergens: r.allergens,
    allergyVersions: r.allergyVersions,
    languageVersions: r.languageVersions,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    ...(includeIngredients ? { ingredients: r.ingredients } : {}),
  };
}

export default router;
