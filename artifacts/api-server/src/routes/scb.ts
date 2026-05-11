import { Router } from "express";
import { db, ingredientsTable } from "@workspace/db";
import { ilike, or } from "drizzle-orm";

const router = Router();

const SCB_KPI_URL = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020COICOPM";

const SCB_INGREDIENT_GROUPS: Record<string, string[]> = {
  "01.1.2": ["högrev", "nöt", "kyckling", "kött", "fläsk"],
  "01.1.3": ["torsk", "lax", "räkor", "fisk", "skaldjur"],
  "01.1.4": ["mjölk", "grädde", "smör", "parmesan", "ost", "yoghurt"],
  "01.1.4.8": ["ägg"],
  "01.1.6": ["äpple", "citron", "lime", "banan", "lingon", "frukt"],
  "01.1.7": ["tomat", "potatis", "lök", "morot", "sallad", "grönsak"],
  "01.1.9.3": ["salt", "peppar", "dill", "timjan", "sås"],
};

async function fetchLatestScbAnnualChanges() {
  const query = {
    query: [
      {
        code: "VaruTjanstegrupp",
        selection: { filter: "item", values: Object.keys(SCB_INGREDIENT_GROUPS) },
      },
      {
        code: "ContentsCode",
        selection: { filter: "item", values: ["00000805"] },
      },
      {
        code: "Tid",
        selection: { filter: "top", values: ["1"] },
      },
    ],
    response: { format: "json" },
  };

  const response = await fetch(SCB_KPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) throw new Error(`SCB API returned ${response.status}`);

  const payload = await response.json() as { data?: { key: [string, string]; values: [string] }[] };
  const changes: Record<string, number> = {};
  let lastUpdated = "";

  for (const row of payload.data ?? []) {
    const [categoryCode, month] = row.key;
    const value = Number(row.values[0]);
    if (Number.isFinite(value)) changes[categoryCode] = Math.round(value * 100) / 100;
    lastUpdated = month;
  }

  return { changes, lastUpdated };
}

export async function syncSCBPrices(): Promise<{ updated: number; message: string; lastUpdated?: string }> {
  const { changes, lastUpdated } = await fetchLatestScbAnnualChanges();
  let updated = 0;

  for (const [categoryCode, names] of Object.entries(SCB_INGREDIENT_GROUPS)) {
    const annualChange = changes[categoryCode];
    if (!Number.isFinite(annualChange)) continue;

    const conditions = names.map((name) => ilike(ingredientsTable.name, `%${name}%`));
    if (!conditions.length) continue;

    const rows = await db
      .update(ingredientsTable)
      .set({
        priceChangePct: String(annualChange),
        updatedAt: new Date(),
      })
      .where(or(...conditions))
      .returning({ id: ingredientsTable.id });

    updated += rows.length;
  }

  return {
    updated,
    message: `${updated} ingrediensers prisändring uppdaterades från SCB KPI årsförändring.`,
    lastUpdated,
  };
}

router.post("/ingredients/sync-scb", async (_req, res) => {
  const result = await syncSCBPrices();
  return res.json(result);
});

export default router;
