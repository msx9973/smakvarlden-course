import { Router } from "express";
import { db, ingredientsTable } from "@workspace/db";

const router = Router();

const SCB_FOOD_CATEGORIES: Record<string, string[]> = {
  "0111": ["Nötfilé", "Nötfärs", "Lammskuldra", "Fläskbuk"],
  "0112": ["Kycklingfilé", "Kycklinglår"],
  "0113": ["Laxfilé", "Torskfilé", "Räkor"],
  "0114": ["Mjölk", "Vispgrädde", "Smör", "Parmesan", "Mozzarella"],
  "0115": ["Ägg"],
  "0116": ["Olivolja", "Majsstärkelse", "Mjöl", "Ris", "Pasta", "Socker"],
  "0117": ["Tomat", "Potatis", "Lök", "Morot", "Svamp", "Broccoli", "Spenat", "Vitlök", "Paprika"],
  "0118": ["Äpple", "Citron", "Lime", "Banan", "Mango"],
  "0119": ["Socker", "Svartpeppar", "Salt", "Spiskummin", "Basilika", "Dill", "Persilja"],
};

const BASE_YEAR_INDEX = 100;

export async function syncSCBPrices(): Promise<{ updated: number; message: string; lastUpdated?: string }> {
  const url = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPIAktMan";
  const query = {
    query: [
      {
        code: "Varugrupp",
        selection: {
          filter: "item",
          values: ["0111", "0112", "0113", "0114", "0115", "0116", "0117", "0118", "0119"],
        },
      },
      {
        code: "Tid",
        selection: { filter: "top", values: ["2"] },
      },
    ],
    response: { format: "json" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    throw new Error(`SCB API returned ${res.status}`);
  }

  const data = await res.json() as { data?: { key: string[]; values: string[] }[] };

  if (!data.data?.length) {
    return { updated: 0, message: "SCB returnerade inga data." };
  }

  const latestIndex: Record<string, number> = {};
  data.data.forEach((row) => {
    const cat = row.key[0];
    const val = parseFloat(row.values[0]);
    if (!isNaN(val)) latestIndex[cat] = val;
  });

  const allIngredients = await db.select().from(ingredientsTable);
  let updated = 0;

  for (const ingredient of allIngredients) {
    let catKey: string | undefined;
    for (const [key, names] of Object.entries(SCB_FOOD_CATEGORIES)) {
      if (names.includes(ingredient.name)) {
        catKey = key;
        break;
      }
    }
    if (!catKey) continue;

    const idx = latestIndex[catKey] ?? BASE_YEAR_INDEX;
    const multiplier = idx / BASE_YEAR_INDEX;
    const oldPrice = parseFloat(String(ingredient.currentPriceSek));
    const newPrice = +(oldPrice * multiplier).toFixed(2);
    const changePct = oldPrice > 0 ? +((newPrice - oldPrice) / oldPrice * 100).toFixed(2) : 0;

    await db.update(ingredientsTable).set({
      currentPriceSek: String(newPrice),
      priceChangePct: String(changePct),
      updatedAt: new Date(),
    }).where(
      (await import("drizzle-orm")).eq(ingredientsTable.id, ingredient.id)
    );
    updated++;
  }

  const lastUpdated = new Date().toLocaleDateString("sv-SE");
  return { updated, message: `${updated} ingredienspriser uppdaterade från SCB KPI.`, lastUpdated };
}

router.post("/ingredients/sync-scb", async (_req, res) => {
  const result = await syncSCBPrices();
  return res.json(result);
});

export default router;
