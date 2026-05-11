import { Router } from "express";
import { db, ingredientsTable, recipeIngredientsTable, recipesTable, activityLogTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const router = Router();

const demoIngredients = [
  { name: "Högrev", category: "Kött", unit: "kg", currentPriceSek: 159, supplier: "Martin & Servera" },
  { name: "Kycklinglår", category: "Kött", unit: "kg", currentPriceSek: 74, supplier: "Svensk Fågel" },
  { name: "Torskrygg", category: "Fisk & skaldjur", unit: "kg", currentPriceSek: 219, supplier: "Fiskhallen Sorunda" },
  { name: "Räkor skalade", category: "Fisk & skaldjur", unit: "kg", currentPriceSek: 168, supplier: "Fiskhallen Sorunda" },
  { name: "Smör", category: "Mejeri", unit: "kg", currentPriceSek: 92, supplier: "Arla" },
  { name: "Vispgrädde", category: "Mejeri", unit: "liter", currentPriceSek: 49, supplier: "Arla" },
  { name: "Parmesan", category: "Mejeri", unit: "kg", currentPriceSek: 238, supplier: "Werners Gourmetservice" },
  { name: "Ägg", category: "Ägg & mejeriprodukter", unit: "st", currentPriceSek: 3.8, supplier: "Kronägg" },
  { name: "Potatis", category: "Gronsaker", unit: "kg", currentPriceSek: 18, supplier: "Gronsakshallen" },
  { name: "Morot", category: "Gronsaker", unit: "kg", currentPriceSek: 16, supplier: "Gronsakshallen" },
  { name: "Gul lök", category: "Grönsaker", unit: "kg", currentPriceSek: 15, supplier: "Grönsakshallen" },
  { name: "Tomat", category: "Grönsaker", unit: "kg", currentPriceSek: 42, supplier: "Grönsakshallen" },
  { name: "Blandad sallad", category: "Grönsaker", unit: "kg", currentPriceSek: 86, supplier: "Grönsakshallen" },
  { name: "Champinjoner", category: "Svamp & vilt", unit: "kg", currentPriceSek: 64, supplier: "Grönsakshallen" },
  { name: "Lingon", category: "Frukt", unit: "kg", currentPriceSek: 78, supplier: "Polarica" },
  { name: "Vetemjöl", category: "Spannmål", unit: "kg", currentPriceSek: 14, supplier: "Kungsörnen" },
  { name: "Pasta linguine", category: "Pasta & ris", unit: "kg", currentPriceSek: 38, supplier: "Martin & Servera" },
  { name: "Arborioris", category: "Pasta & ris", unit: "kg", currentPriceSek: 56, supplier: "Werners Gourmetservice" },
  { name: "Olivolja", category: "Oljor", unit: "liter", currentPriceSek: 116, supplier: "Werners Gourmetservice" },
  { name: "Rapsolja", category: "Oljor", unit: "liter", currentPriceSek: 34, supplier: "Martin & Servera" },
  { name: "Dill", category: "Kryddor", unit: "kg", currentPriceSek: 210, supplier: "Gronsakshallen" },
  { name: "Timjan", category: "Kryddor", unit: "kg", currentPriceSek: 248, supplier: "Gronsakshallen" },
  { name: "Citron", category: "Frukt", unit: "kg", currentPriceSek: 36, supplier: "Gronsakshallen" },
  { name: "Vitt vin matlagning", category: "Drycker", unit: "liter", currentPriceSek: 68, supplier: "Martin & Servera" },
];

const demoRecipes = [
  {
    name: "Linguine med räkor och citron",
    description: "Snabb bistrorätt med räkor, citron, dill och en blank smörsås.",
    category: "Huvudrätter",
    servings: 4,
    sellingPriceSek: 189,
    ingredients: [
      ["Pasta linguine", 0.42, "kg"],
      ["Räkor skalade", 0.32, "kg"],
      ["Smör", 0.08, "kg"],
      ["Citron", 0.12, "kg"],
      ["Dill", 0.02, "kg"],
    ],
  },
  {
    name: "Långbakad högrev med rotfrukter",
    description: "Mustig svensk huvudrätt med högrev, potatis, morot och timjan.",
    category: "Huvudrätter",
    servings: 6,
    sellingPriceSek: 225,
    ingredients: [
      ["Högrev", 1.15, "kg"],
      ["Potatis", 0.9, "kg"],
      ["Morot", 0.45, "kg"],
      ["Gul lök", 0.22, "kg"],
      ["Timjan", 0.02, "kg"],
    ],
  },
  {
    name: "Torskrygg med brynt smör",
    description: "Torskrygg med potatis, dill, citron och brynt smör.",
    category: "Huvudrätter",
    servings: 4,
    sellingPriceSek: 245,
    ingredients: [
      ["Torskrygg", 0.72, "kg"],
      ["Potatis", 0.75, "kg"],
      ["Smör", 0.12, "kg"],
      ["Dill", 0.02, "kg"],
      ["Citron", 0.1, "kg"],
    ],
  },
  {
    name: "Svamprisotto med parmesan",
    description: "Krämig risotto med champinjoner, vitt vin och parmesan.",
    category: "Vegetariskt",
    servings: 4,
    sellingPriceSek: 175,
    ingredients: [
      ["Arborioris", 0.36, "kg"],
      ["Champinjoner", 0.42, "kg"],
      ["Parmesan", 0.09, "kg"],
      ["Vitt vin matlagning", 0.18, "liter"],
      ["Smör", 0.06, "kg"],
    ],
  },
  {
    name: "Kycklingsallad med citronvinägrett",
    description: "Lunchrätt med kyckling, tomat, sallad och frisk vinägrett.",
    category: "Sallader",
    servings: 4,
    sellingPriceSek: 159,
    ingredients: [
      ["Kycklinglår", 0.55, "kg"],
      ["Blandad sallad", 0.28, "kg"],
      ["Tomat", 0.32, "kg"],
      ["Olivolja", 0.08, "liter"],
      ["Citron", 0.1, "kg"],
    ],
  },
  {
    name: "Pannkaka med lingon och grädde",
    description: "Klassisk dessert eller barnmeny med tydlig portionskostnad.",
    category: "Desserter",
    servings: 8,
    sellingPriceSek: 95,
    ingredients: [
      ["Vetemjöl", 0.32, "kg"],
      ["Ägg", 6, "st"],
      ["Smör", 0.08, "kg"],
      ["Lingon", 0.28, "kg"],
      ["Vispgrädde", 0.35, "liter"],
    ],
  },
];

router.post("/seed", async (_req, res) => {
  const existingIngredients = await db
    .select({ name: ingredientsTable.name })
    .from(ingredientsTable);
  const existingIngredientNames = new Set(existingIngredients.map((row) => row.name));

  const ingredientsToInsert = demoIngredients.filter((ingredient) => !existingIngredientNames.has(ingredient.name));
  const insertedIngredients = ingredientsToInsert.length
    ? await db.insert(ingredientsTable).values(
        ingredientsToInsert.map((ingredient, index) => ({
          ...ingredient,
          currentPriceSek: String(ingredient.currentPriceSek),
          priceChangePct: String([2.4, -1.8, 0.9, 4.6, -0.7, 1.2][index % 6]),
        })),
      ).returning()
    : [];

  const allIngredientNames = demoIngredients.map((ingredient) => ingredient.name);
  const existingDemoIngredients = await db
    .select()
    .from(ingredientsTable)
    .where(inArray(ingredientsTable.name, allIngredientNames));
  const ingredientRows = [...insertedIngredients, ...existingDemoIngredients];
  const ingredientByName = new Map(ingredientRows.map((ingredient) => [ingredient.name, ingredient]));

  const existingRecipes = await db.select({ name: recipesTable.name }).from(recipesTable);
  const existingRecipeNames = new Set(existingRecipes.map((row) => row.name));
  let createdRecipes = 0;

  for (const recipe of demoRecipes) {
    if (existingRecipeNames.has(recipe.name)) continue;

    const totalCostSek = recipe.ingredients.reduce((sum, [name, quantity]) => {
      const ingredient = ingredientByName.get(String(name));
      return sum + (ingredient ? Number(ingredient.currentPriceSek) * Number(quantity) : 0);
    }, 0);
    const profitMarginPct = recipe.sellingPriceSek > 0
      ? ((recipe.sellingPriceSek - totalCostSek) / recipe.sellingPriceSek) * 100
      : 0;

    const [insertedRecipe] = await db.insert(recipesTable).values({
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      servings: recipe.servings,
      totalCostSek: String(Math.round(totalCostSek * 100) / 100),
      sellingPriceSek: String(recipe.sellingPriceSek),
      profitMarginPct: String(Math.round(profitMarginPct * 100) / 100),
      ingredientsJson: recipe.ingredients.map(([name, amount, unit]) => ({
        name: String(name),
        amount: Number(amount),
        unit: String(unit),
      })),
    }).returning();

    await db.insert(recipeIngredientsTable).values(
      recipe.ingredients.flatMap(([name, quantity, unit]) => {
        const ingredient = ingredientByName.get(String(name));
        if (!ingredient) return [];
        return [{
          recipeId: insertedRecipe.id,
          ingredientId: ingredient.id,
          quantity: String(quantity),
          unit: String(unit),
        }];
      }),
    );
    createdRecipes += 1;
  }

  if (ingredientsToInsert.length || createdRecipes) {
    await db.insert(activityLogTable).values({
      type: "recipe_created",
      title: "Demodata laddad",
      subtitle: `${ingredientsToInsert.length} ingredienser · ${createdRecipes} recept`,
    });
  }

  return res.status(201).json({
    ingredientsCreated: ingredientsToInsert.length,
    recipesCreated: createdRecipes,
  });
});

export default router;
