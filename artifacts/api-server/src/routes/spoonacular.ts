import { Router } from "express";

const router = Router();

function spoonKey() {
  return process.env.SPOONACULAR_API_KEY ?? "";
}

router.get("/recipes/search", async (req, res) => {
  const { query = "", number = "10", cuisine, diet } = req.query as Record<string, string>;
  if (!query.trim()) return res.status(400).json({ error: "query required" });
  const params = new URLSearchParams({
    query,
    number,
    addRecipeInformation: "true",
    fillIngredients: "true",
    apiKey: spoonKey(),
    ...(cuisine ? { cuisine } : {}),
    ...(diet ? { diet } : {}),
  });
  const r = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
  if (!r.ok) return res.status(502).json({ error: "Spoonacular error" });
  const data = await r.json();
  return res.json(data);
});

router.get("/recipes/:id/ingredients", async (req, res) => {
  const { id } = req.params;
  const params = new URLSearchParams({ apiKey: spoonKey() });
  const r = await fetch(`https://api.spoonacular.com/recipes/${id}/ingredientWidget.json?${params}`);
  if (!r.ok) return res.status(502).json({ error: "Spoonacular error" });
  const data = await r.json();
  return res.json(data);
});

router.get("/recipes/:id/information", async (req, res) => {
  const { id } = req.params;
  const params = new URLSearchParams({ apiKey: spoonKey(), includeNutrition: "false" });
  const r = await fetch(`https://api.spoonacular.com/recipes/${id}/information?${params}`);
  if (!r.ok) return res.status(502).json({ error: "Spoonacular error" });
  const data = await r.json();
  return res.json(data);
});

router.get("/ingredients/autocomplete", async (req, res) => {
  const { query = "", number = "8" } = req.query as Record<string, string>;
  if (!query.trim()) return res.json([]);
  const params = new URLSearchParams({ query, number, apiKey: spoonKey(), metaInformation: "true" });
  const r = await fetch(`https://api.spoonacular.com/food/ingredients/autocomplete?${params}`);
  if (!r.ok) return res.status(502).json({ error: "Spoonacular error" });
  const data = await r.json();
  return res.json(data);
});

export default router;
