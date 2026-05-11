import { Router } from "express";
import { db, ingredientsTable, recipesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const SCB_KPI_URL = "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020COICOPM";

const SCB_SERIES = {
  livsmedel: "01",
  restaurang: "11.1",
  kott: "01.1.2",
  fisk: "01.1.3",
} as const;

type ScbSeriesKey = keyof typeof SCB_SERIES;

interface ScbMarketData {
  priceIndex: { month: string; livsmedel: number; restaurang: number; kott: number; fisk: number }[];
  yearlyChange: Record<ScbSeriesKey, number>;
  latestMonth: string;
  source: string;
}

function formatScbMonth(value: string) {
  const [year, month] = value.split("M");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("sv-SE", { month: "short", year: month === "01" ? "2-digit" : undefined });
}

async function fetchScbMarketData(): Promise<ScbMarketData | null> {
  const query = {
    query: [
      {
        code: "VaruTjanstegrupp",
        selection: { filter: "item", values: Object.values(SCB_SERIES) },
      },
      {
        code: "ContentsCode",
        selection: { filter: "item", values: ["0000080H", "00000805"] },
      },
      {
        code: "Tid",
        selection: { filter: "top", values: ["12"] },
      },
    ],
    response: { format: "json" },
  };

  const response = await fetch(SCB_KPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) return null;

  const payload = await response.json() as {
    data?: { key: [string, string]; values: [string, string] }[];
  };

  if (!payload.data?.length) return null;

  const byMonth = new Map<string, Partial<Record<ScbSeriesKey, number>>>();
  const yearlyChange: Partial<Record<ScbSeriesKey, number>> = {};

  for (const row of payload.data) {
    const [seriesCode, month] = row.key;
    const seriesKey = (Object.entries(SCB_SERIES).find(([, code]) => code === seriesCode)?.[0] ?? "") as ScbSeriesKey;
    if (!seriesKey) continue;

    const index = Number(row.values[0]);
    const annualChange = Number(row.values[1]);
    if (!Number.isFinite(index)) continue;

    byMonth.set(month, { ...(byMonth.get(month) ?? {}), [seriesKey]: Math.round(index * 100) / 100 });
    if (Number.isFinite(annualChange)) yearlyChange[seriesKey] = Math.round(annualChange * 10) / 10;
  }

  const priceIndex = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month: formatScbMonth(month),
      livsmedel: values.livsmedel ?? 0,
      restaurang: values.restaurang ?? 0,
      kott: values.kott ?? 0,
      fisk: values.fisk ?? 0,
    }))
    .filter((row) => row.livsmedel && row.restaurang && row.kott && row.fisk);

  const latestMonth = [...byMonth.keys()].sort().at(-1) ?? "";

  return {
    priceIndex,
    yearlyChange: {
      livsmedel: yearlyChange.livsmedel ?? 0,
      restaurang: yearlyChange.restaurang ?? 0,
      kott: yearlyChange.kott ?? 0,
      fisk: yearlyChange.fisk ?? 0,
    },
    latestMonth,
    source: "SCB KPI 2020 COICOP, tabell KPI2020COICOPM",
  };
}

router.get("/overview", async (_req, res) => {
  const categoryStats = await db
    .select({
      category: ingredientsTable.category,
      avgPrice: sql<number>`round(avg(${ingredientsTable.currentPriceSek})::numeric, 2)`,
      minPrice: sql<number>`round(min(${ingredientsTable.currentPriceSek})::numeric, 2)`,
      maxPrice: sql<number>`round(max(${ingredientsTable.currentPriceSek})::numeric, 2)`,
      count: sql<number>`count(*)::int`,
    })
    .from(ingredientsTable)
    .groupBy(ingredientsTable.category)
    .orderBy(sql`avg(${ingredientsTable.currentPriceSek}) desc`);

  const [recipeEcon] = await db
    .select({
      avgCost: sql<number>`round(avg(${recipesTable.totalCostSek})::numeric, 2)`,
      avgMargin: sql<number>`round(avg(${recipesTable.profitMarginPct})::numeric, 1)`,
      avgPrice: sql<number>`round(avg(${recipesTable.sellingPriceSek})::numeric, 2)`,
      recipeCount: sql<number>`count(*)::int`,
    })
    .from(recipesTable);

  const [priceAlerts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ingredientsTable)
    .where(sql`abs(${ingredientsTable.priceChangePct}::numeric) > 5`);

  const econ = recipeEcon ?? { avgCost: 0, avgMargin: 0, avgPrice: 0, recipeCount: 0 };
  const foodCostPct = Number(econ.avgPrice) > 0
    ? Number(((Number(econ.avgCost) / Number(econ.avgPrice)) * 100).toFixed(1))
    : 0;
  const markup = Number(econ.avgCost) > 0
    ? Number((Number(econ.avgPrice) / Number(econ.avgCost)).toFixed(2))
    : 0;

  const scb = await fetchScbMarketData();

  const benchmarks = [
    { label: "Råvarukostnad", yours: foodCostPct, industry: 30, unit: "%", desc: "Av försäljningspriset", goodIfLower: true },
    { label: "Vinstmarginal", yours: Number(econ.avgMargin ?? 0), industry: 62, unit: "%", desc: "Livsmedelsmarginal", goodIfLower: false },
    { label: "Menymarkup", yours: markup, industry: 3.3, unit: "×", desc: "Kostnad × faktor", goodIfLower: false },
    { label: "Prisändringar", yours: priceAlerts?.count ?? 0, industry: 8, unit: " st", desc: "Aktiva råvaruvarningar", goodIfLower: true },
  ];

  const seasonalGuide = [
    {
      season: "Vinter (Dec-Feb)",
      emoji: "❄",
      cheap: ["Rotfrukter", "Kål", "Citrusfrukter", "Vinteräpplen"],
      expensive: ["Tomater", "Gurka", "Sommarbär", "Sparris"],
      tip: "Planera menyn runt lagringsdugliga råvaror och kontrollera egna leverantörspriser innan prisjustering.",
    },
    {
      season: "Vår (Mar-Maj)",
      emoji: "🌱",
      cheap: ["Sparris", "Spenat", "Rädisor", "Lamm"],
      expensive: ["Vilt", "Pumpa", "Sena rotfrukter"],
      tip: "Använd SCB-trenden som inflationssignal och dina egna inköpspriser som beslutsunderlag.",
    },
    {
      season: "Sommar (Jun-Aug)",
      emoji: "☀",
      cheap: ["Tomater", "Gurka", "Zucchini", "Bär"],
      expensive: ["Kräftor", "Hummer", "Importerat kött"],
      tip: "Låt lokala grönsaker bära menyn och följ fisk/skaldjur extra noga i prisregistret.",
    },
    {
      season: "Höst (Sep-Nov)",
      emoji: "🍂",
      cheap: ["Svamp", "Vilt", "Äpplen", "Pumpa"],
      expensive: ["Sparris", "Sommarörter", "Färska bär"],
      tip: "Passar för långkok, svamp och rotfrukter. Kontrollera marginalen efter varje större menybyte.",
    },
  ];

  const insights = scb
    ? [
        {
          tag: "SCB",
          color: "#3b82f6",
          title: `Livsmedel ${scb.yearlyChange.livsmedel >= 0 ? "+" : ""}${scb.yearlyChange.livsmedel}% år/år`,
          desc: `Senaste SCB-månaden ${scb.latestMonth}. Avser KPI för livsmedel och alkoholfria drycker, inte dina exakta grossistavtal.`,
        },
        {
          tag: "SCB",
          color: "#d97706",
          title: `Restaurangtjänster ${scb.yearlyChange.restaurang >= 0 ? "+" : ""}${scb.yearlyChange.restaurang}% år/år`,
          desc: "Visar prisutveckling för bar- och restaurangtjänster i KPI. Jämför med dina egna menypriser och marginaler.",
        },
        {
          tag: "SCB",
          color: "#ef4444",
          title: `Kött ${scb.yearlyChange.kott >= 0 ? "+" : ""}${scb.yearlyChange.kott}% · Fisk ${scb.yearlyChange.fisk >= 0 ? "+" : ""}${scb.yearlyChange.fisk}%`,
          desc: "Använd kategoritrenden för att prioritera vilka råvaror som ska kontrolleras mot leverantörspris.",
        },
        {
          tag: "DB",
          color: "#10b981",
          title: `${econ.recipeCount ?? 0} recept · ${categoryStats.length} råvarukategorier`,
          desc: "Dina recept, ingredienser, snittpriser och marginaler kommer från databasen.",
        },
      ]
    : [
        {
          tag: "DB",
          color: "#10b981",
          title: `${econ.recipeCount ?? 0} recept · ${categoryStats.length} råvarukategorier`,
          desc: "SCB kunde inte hämtas just nu. Sidan visar dina databasvärden och döljer live-index.",
        },
      ];

  return res.json({
    dataNote: scb
      ? `Recept, råvarukostnader och prisregister hämtas från databasen. Prisindex och årsförändringar hämtas från ${scb.source}. Branschmål är referensvärden och ska jämföras med dina egna leverantörspriser.`
      : "Recept, råvarukostnader och prisregister hämtas från databasen. SCB-index kunde inte hämtas vid detta anrop.",
    priceIndex: scb?.priceIndex ?? [],
    categoryStats,
    benchmarks,
    seasonalGuide,
    insights,
    summary: {
      foodInflationPct: scb?.yearlyChange.livsmedel ?? 0,
      restaurantPricePct: scb?.yearlyChange.restaurang ?? 0,
      avgFoodCostPct: foodCostPct,
      avgMarginPct: Number(econ.avgMargin ?? 0),
    },
  });
});

export default router;
