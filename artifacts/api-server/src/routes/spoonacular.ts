import { Router, type Response } from "express";

const router = Router();

const BASE_URL = "https://api.spoonacular.com";

function apiKey() {
  return process.env.SPOONACULAR_API_KEY;
}

function requireApiKey(res: Response) {
  const key = apiKey();
  if (!key) {
    res.status(503).json({
      error: "SPOONACULAR_API_KEY is not configured.",
      setup: "Add the key to your local .env and Netlify/API hosting environment variables.",
    });
    return null;
  }
  return key;
}

async function spoonacularFetch(path: string, params: Record<string, string | undefined>, key: string) {
  const url = new URL(path, BASE_URL);
  url.searchParams.set("apiKey", key);
  for (const [name, value] of Object.entries(params)) {
    if (value) url.searchParams.set(name, value);
  }

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      status: response.status,
      data: {
        error: "Spoonacular request failed.",
        details: data,
      },
    };
  }
  return { status: response.status, data };
}

router.get("/recipes/search", async (req, res) => {
  const key = requireApiKey(res);
  if (!key) return;

  const result = await spoonacularFetch("/recipes/complexSearch", {
    query: String(req.query.query ?? ""),
    cuisine: req.query.cuisine ? String(req.query.cuisine) : undefined,
    diet: req.query.diet ? String(req.query.diet) : undefined,
    intolerances: req.query.intolerances ? String(req.query.intolerances) : undefined,
    number: String(req.query.number ?? "12"),
    addRecipeNutrition: "true",
    instructionsRequired: "true",
  }, key);

  return res.status(result.status).json(result.data);
});

router.get("/recipes/:id/information", async (req, res) => {
  const key = requireApiKey(res);
  if (!key) return;

  const result = await spoonacularFetch(`/recipes/${Number(req.params.id)}/information`, {
    includeNutrition: "true",
  }, key);

  return res.status(result.status).json(result.data);
});

router.get("/ingredients/search", async (req, res) => {
  const key = requireApiKey(res);
  if (!key) return;

  const result = await spoonacularFetch("/food/ingredients/search", {
    query: String(req.query.query ?? ""),
    number: String(req.query.number ?? "12"),
    metaInformation: "true",
  }, key);

  return res.status(result.status).json(result.data);
});

router.get("/ingredients/:id/information", async (req, res) => {
  const key = requireApiKey(res);
  if (!key) return;

  const result = await spoonacularFetch(`/food/ingredients/${Number(req.params.id)}/information`, {
    amount: req.query.amount ? String(req.query.amount) : "100",
    unit: req.query.unit ? String(req.query.unit) : "grams",
  }, key);

  return res.status(result.status).json(result.data);
});

export default router;
