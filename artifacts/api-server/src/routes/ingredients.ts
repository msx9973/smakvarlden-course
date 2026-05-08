import { Router } from "express";
import { db, hasDatabase, ingredientsTable, activityLogTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { demoIngredients, hasDemoFallbackError, type DemoIngredient } from "../lib/demo-data";
import {
  CreateIngredientBody,
  ListIngredientsQueryParams,
  GetIngredientParams,
  UpdateIngredientBody,
  UpdateIngredientParams,
  DeleteIngredientParams,
} from "@workspace/api-zod";

const router = Router();

type ImportedIngredient = {
  name?: string;
  category?: string;
  unit?: string;
  priceSek?: number;
  currentPriceSek?: number;
  supplier?: string;
};

router.get("/", async (req, res) => {
  const parsed = ListIngredientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { category, search } = parsed.data;
  try {
    const conditions = [];
    if (category) conditions.push(eq(ingredientsTable.category, category));
    if (search) conditions.push(ilike(ingredientsTable.name, `%${search}%`));
    const rows = await db.select().from(ingredientsTable).where(conditions.length ? and(...conditions) : undefined);
    if (rows.length > 0) return res.json(rows.map(formatIngredient));
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const normalizedSearch = search?.toLowerCase();
  const rows = demoIngredients.filter((ingredient) => {
    if (category && ingredient.category !== category) return false;
    if (normalizedSearch && !ingredient.name.toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });
  return res.json(rows.map(formatDemoIngredient));
});

router.post("/", async (req, res) => {
  const parsed = CreateIngredientBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const [row] = await db.insert(ingredientsTable).values({
    name: parsed.data.name,
    category: parsed.data.category,
    unit: parsed.data.unit,
    currentPriceSek: String(parsed.data.currentPriceSek),
    supplier: parsed.data.supplier ?? null,
    priceChangePct: "0",
  }).returning();
  await db.insert(activityLogTable).values({
    type: "recipe_created",
    title: `Ny ingrediens tillagd: ${row.name}`,
    subtitle: `${row.category} · ${row.currentPriceSek} SEK/${row.unit}`,
  });
  return res.status(201).json(formatIngredient(row));
});

router.post("/import", async (req, res) => {
  const rows = Array.isArray(req.body?.ingredients) ? req.body.ingredients as ImportedIngredient[] : [];
  if (rows.length === 0) return res.status(400).json({ error: "No ingredients supplied" });

  const normalized = rows.flatMap((row) => {
    const name = row.name?.trim();
    const category = row.category?.trim();
    const unit = row.unit?.trim();
    const currentPriceSek = Number(row.currentPriceSek ?? row.priceSek);
    if (!name || !category || !unit || !Number.isFinite(currentPriceSek) || currentPriceSek < 0) return [];
    return [{
      name,
      category,
      unit,
      currentPriceSek,
      supplier: row.supplier?.trim() || "Importerad prislista",
    }];
  });

  if (normalized.length === 0) return res.status(400).json({ error: "No valid ingredients found" });

  if (hasDatabase) {
    const inserted = await db.insert(ingredientsTable).values(normalized.map((row) => ({
      name: row.name,
      category: row.category,
      unit: row.unit,
      currentPriceSek: String(row.currentPriceSek),
      supplier: row.supplier,
      priceChangePct: "0",
    }))).returning();

    await db.insert(activityLogTable).values({
      type: "recipe_updated",
      title: "Prislista importerad",
      subtitle: `${inserted.length} ingredienser lades till`,
    });

    return res.status(201).json({ imported: inserted.length, skipped: rows.length - normalized.length });
  }

  let imported = 0;
  for (const row of normalized) {
    const existing = demoIngredients.find((ingredient) => ingredient.name.toLowerCase() === row.name.toLowerCase());
    if (existing) {
      existing.category = row.category;
      existing.unit = row.unit;
      existing.currentPriceSek = row.currentPriceSek;
      existing.priceChangePct = 0;
      existing.supplier = row.supplier;
      existing.updatedAt = new Date();
    } else {
      demoIngredients.push({
        id: Math.max(0, ...demoIngredients.map((ingredient) => ingredient.id)) + 1,
        name: row.name,
        category: row.category,
        unit: row.unit,
        currentPriceSek: row.currentPriceSek,
        priceChangePct: 0,
        supplier: row.supplier,
        updatedAt: new Date(),
      });
    }
    imported++;
  }

  return res.status(201).json({ imported, skipped: rows.length - normalized.length });
});

router.get("/price-trends", async (_req, res) => {
  let rows: Array<typeof ingredientsTable.$inferSelect | DemoIngredient>;
  try {
    rows = await db.select().from(ingredientsTable).limit(8);
    if (rows.length === 0) rows = demoIngredients.slice(0, 8);
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
    rows = demoIngredients.slice(0, 8);
  }
  const trends: { ingredientId: number; ingredientName: string; date: string; priceSek: number }[] = [];
  const now = new Date();
  for (const ing of rows) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const base = parseFloat(String(ing.currentPriceSek));
      const variation = base * (0.85 + Math.random() * 0.3);
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
  try {
    const rows = await db
      .select({
        category: ingredientsTable.category,
        count: sql<number>`count(*)::int`,
        avgPriceSek: sql<number>`avg(current_price_sek::numeric)`,
        totalPriceSek: sql<number>`sum(current_price_sek::numeric)`,
      })
      .from(ingredientsTable)
      .groupBy(ingredientsTable.category);
    if (rows.length > 0) {
      return res.json(rows.map((r) => ({
        category: r.category,
        count: r.count,
        avgPriceSek: Math.round(Number(r.avgPriceSek) * 100) / 100,
        totalPriceSek: Math.round(Number(r.totalPriceSek) * 100) / 100,
      })));
    }
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }

  const grouped = new Map<string, DemoIngredient[]>();
  for (const ingredient of demoIngredients) {
    grouped.set(ingredient.category, [...(grouped.get(ingredient.category) ?? []), ingredient]);
  }
  const rows = [...grouped.entries()].map(([category, ingredients]) => {
    const totalPriceSek = ingredients.reduce((sum, ingredient) => sum + ingredient.currentPriceSek, 0);
    return {
      category,
      count: ingredients.length,
      avgPriceSek: Math.round((totalPriceSek / ingredients.length) * 100) / 100,
      totalPriceSek: Math.round(totalPriceSek * 100) / 100,
    };
  });
  return res.json(rows.map((r) => ({
    category: r.category,
    count: r.count,
    avgPriceSek: r.avgPriceSek,
    totalPriceSek: r.totalPriceSek,
  })));
});

router.get("/:id", async (req, res) => {
  const parsed = GetIngredientParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  try {
    const [row] = await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, parsed.data.id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(formatIngredient(row));
  } catch (error) {
    if (!hasDemoFallbackError(error)) throw error;
  }
  const row = demoIngredients.find((ingredient) => ingredient.id === parsed.data.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatDemoIngredient(row));
});

router.put("/:id", async (req, res) => {
  const paramParsed = UpdateIngredientParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateIngredientBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) return res.status(400).json({ error: "Invalid input" });
  const existing = await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, paramParsed.data.id));
  if (!existing.length) return res.status(404).json({ error: "Not found" });
  const oldPrice = parseFloat(String(existing[0].currentPriceSek));
  const newPrice = bodyParsed.data.currentPriceSek ?? oldPrice;
  const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
  const [row] = await db.update(ingredientsTable)
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
  return res.json(formatIngredient(row));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteIngredientParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(ingredientsTable).where(eq(ingredientsTable.id, parsed.data.id));
  return res.status(204).send();
});

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

function formatDemoIngredient(row: DemoIngredient) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentPriceSek: row.currentPriceSek,
    priceChangePct: row.priceChangePct,
    supplier: row.supplier,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
