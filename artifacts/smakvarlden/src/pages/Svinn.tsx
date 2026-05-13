import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
import {
  Trash2, TrendingDown, AlertTriangle, Leaf, Lightbulb, BarChart2, Calendar, DollarSign, Info, ArrowRight,
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

interface CategorySvinn {
  category: string;
  svinnRatePct: number;
  ingredientCount: number;
  avgPriceSek: number;
  totalIngredientCostSek: number;
  wasteCostSek: number;
  estimatedWeeklyWasteSek: number;
  ingredients: CategoryIngredient[];
}
interface CategoryIngredient {
  id: number;
  name: string;
  unit: string;
  currentPriceSek: number;
  priceChangePct: number;
  supplier: string | null;
  estimatedWasteCostSek: number;
  estimatedWeeklyWasteSek: number;
}
interface SvinnSummary {
  dataNote: string;
  assumptions: { avgDailyPortions: number; monthlyWeeks: number; method: string };
  totalWasteCostSek: number;
  weeklyWasteSek: number;
  monthlyWasteSek: number;
  yearlyWasteSek: number;
  avgWasteRatePct: number;
  totalIngredientCostSek: number;
  avgRecipeCostSek: number;
  totalRecipes: number;
  categorySvinn: CategorySvinn[];
  tips: { icon: string; title: string; desc: string }[];
}

const RATE_COLOR = (rate: number) => {
  if (rate <= 5) return "#10b981";
  if (rate <= 12) return "#f59e0b";
  return "#ef4444";
};
const RATE_BG = (rate: number) => {
  if (rate <= 5) return "rgba(16,185,129,.1)";
  if (rate <= 12) return "rgba(245,158,11,.1)";
  return "rgba(239,68,68,.1)";
};

const BAR_COLORS = [
  "#ef4444","#f97316","#f59e0b","hsl(44 54% 54%)","#84cc16",
  "#10b981","#06b6d4","#3b82f6","#8b5cf6","#ec4899",
];

function StatBox({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
      style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 12px var(--sv-shadow)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-serif font-bold" style={{ color: "var(--sv-text)" }}>{value}</p>
      <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{sub}</p>
    </div>
  );
}

const EN_TIPS = [
  { icon: "🥩", title: "FIFO principle", desc: "Always rotate raw materials — First In, First Out. Older items towards the front of the fridge." },
  { icon: "📏", title: "Portion size control", desc: "Standardized portions reduce waste by up to 15%. Use a scale consistently." },
  { icon: "🍃", title: "Stem management", desc: "Roots and stems from vegetables can be used for stocks, saving 5–10%." },
  { icon: "❄️", title: "Vacuum storage", desc: "Vacuum-packed meat lasts 3× longer. Invest in a vacuum machine." },
  { icon: "📋", title: "Demand-driven purchasing", desc: "Plan the week's menu in advance and buy exactly what is needed. Reduces waste 20–30%." },
  { icon: "♻️", title: "Reuse trim waste", desc: "Fish heads, shellfish shells and vegetable peelings make excellent stock and broths." },
];

const EN_BENCHMARKS = [
  { label: "Vegetables & herbs", rate: "15–25%", your: 20, icon: "🥦", tip: "High waste due to peeling and trimming" },
  { label: "Fish & seafood", rate: "15–20%", your: 18, icon: "🐟", tip: "Bones, shells and skin cause natural waste" },
  { label: "Meat & poultry", rate: "8–15%", your: 12, icon: "🥩", tip: "Trim waste and bone content" },
  { label: "Dairy & eggs", rate: "2–5%", your: 3, icon: "🧀", tip: "Low waste with good storage" },
];

const SV_BENCHMARKS = [
  { label: "Grönsaker & örter", rate: "15–25%", your: 20, icon: "🥦", tip: "Hög svinn pga peeling och trimning" },
  { label: "Fisk & skaldjur", rate: "15–20%", your: 18, icon: "🐟", tip: "Ben, skal och skin ger naturligt svinn" },
  { label: "Kött & fågel", rate: "8–15%", your: 12, icon: "🥩", tip: "Trimspill och benandel" },
  { label: "Mejeri & ägg", rate: "2–5%", your: 3, icon: "🧀", tip: "Lågt svinn med god lagring" },
];

export default function Svinn() {
  const { t, lang } = useI18n();
  const [view, setView] = useState<"table" | "chart">("table");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTip, setSelectedTip] = useState<SvinnSummary["tips"][number] | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<(typeof SV_BENCHMARKS)[number] | null>(null);

  const { data, isLoading } = useQuery<SvinnSummary>({
    queryKey: ["svinn-summary"],
    queryFn: () => fetch(`${BASE}/api/svinn/summary`).then((r) => r.json()),
    staleTime: 60_000,
  });

  const chartData = (data?.categorySvinn ?? [])
    .slice(0, 10)
    .map((c) => ({ name: t(c.category), category: c.category, svinn: c.svinnRatePct, cost: c.wasteCostSek }));

  const tips = lang === "en" ? EN_TIPS : (data?.tips ?? []);
  const benchmarks = lang === "en" ? EN_BENCHMARKS : SV_BENCHMARKS;
  const selected = data?.categorySvinn.find((cat) => cat.category === selectedCategory) ?? null;
  const dataNote = data
    ? lang === "en"
      ? `Estimated waste analysis. Costs are based on your ingredient categories, standard industry reference rates, and the assumption of ${data.assumptions.avgDailyPortions} portions per day.`
      : data.dataNote
    : "";

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-7 xl:pr-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>
            {t("Svinnanalys")}
          </h1>
          <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
            {t("Matsvinn, kostnad och besparingsmöjligheter per råvarukategori")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl self-start sm:self-auto" style={{ background: "var(--sv-muted)" }}>
          {(["table", "chart"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={view === v ? {
                background: "var(--sv-brown)",
                color: "var(--sv-surface)",
                boxShadow: "0 2px 8px var(--sv-shadow)",
              } : { color: "var(--sv-text-2)" }}
            >
              {v === "table" ? t("Tabell") : t("Diagram")}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && data && (
        <div className="relative rounded-2xl overflow-hidden px-7 py-6"
          style={{ background: "linear-gradient(135deg,#5b221d 0%,#7c2d12 54%,#9a3412 100%)", boxShadow: "0 8px 28px rgba(124,45,18,.22)" }}>
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full opacity-[.08]"
            style={{ border: "36px solid #fff" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,.15)" }}>
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-red-200 mb-1">{t("Observera")}</p>
              <p className="text-white font-serif text-lg font-semibold">
                {t("Uppskattad svinnomsättning:")} <span className="text-yellow-300">{data.yearlyWasteSek.toFixed(0)} kr/{lang === "en" ? "year" : "år"}</span>
              </p>
              <p className="text-red-200 text-[13px] mt-1">
                {lang === "en"
                  ? `Estimate based on ${data.categorySvinn.length} ingredient categories · Modeled average waste rate ${data.avgWasteRatePct}%`
                  : `Estimat baserat på ${data.categorySvinn.length} ingredientskategorier · Modellerad snittfrekvens ${data.avgWasteRatePct}%`
                }
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-red-200 text-[11px] font-bold uppercase tracking-widest">{t("Möjlig besparing")}</p>
              <p className="text-white font-serif text-2xl font-bold">{(data.yearlyWasteSek * 0.4).toFixed(0)} kr</p>
              <p className="text-red-200 text-[12px]">{t("med bättre rutiner")}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && dataNote && (
        <div className="rounded-2xl px-5 py-3.5 flex items-start gap-3"
          style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#d97706" }} />
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{dataNote}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : data ? (
          <>
            <StatBox label={t("Svinn per vecka")} value={`${data.weeklyWasteSek.toFixed(0)} kr`}
              sub={lang === "en" ? `Estimate based on ${data.assumptions.avgDailyPortions} portions/day` : `Estimat baserat på ${data.assumptions.avgDailyPortions} portioner/dag`}
              icon={Calendar} color="#f59e0b" bg="rgba(245,158,11,.1)" />
            <StatBox label={t("Svinn per månad")} value={`${data.monthlyWasteSek.toFixed(0)} kr`}
              sub={t("4.33 veckor per månad")}
              icon={DollarSign} color="#ef4444" bg="rgba(239,68,68,.1)" />
            <StatBox label={t("Svinn per år")} value={`${data.yearlyWasteSek.toFixed(0)} kr`}
              sub={t("Stor besparingsmöjlighet")}
              icon={TrendingDown} color="#8b5cf6" bg="rgba(139,92,246,.1)" />
            <StatBox label={t("Snitt svinnfrekvens")} value={`${data.avgWasteRatePct}%`}
              sub={data.avgWasteRatePct > 10 ? t("Ovanför branschsnitt") : t("Under branschsnitt")}
              icon={AlertTriangle}
              color={data.avgWasteRatePct > 10 ? "#ef4444" : "#10b981"}
              bg={data.avgWasteRatePct > 10 ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)"} />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,.82fr)]">
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 12px var(--sv-shadow)" }}>
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,.1)" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#ef4444" }} />
            </div>
            <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--sv-text)" }}>
              {t("Svinn per kategori")}
            </h2>
            <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--sv-text-2)" }}>
              <ArrowRight className="w-3 h-3" /> {lang === "en" ? "Click a category for details" : "Klicka på en kategori för detaljer"}
            </span>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : view === "table" ? (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                  {[t("Kategori"), lang === "en" ? "Ingredients" : "R�varor", t("Svinnfrekvens"), lang === "en" ? "Waste cost" : "Svinnkostnad", t("Est. per vecka")].map((h, i) => (
                    <th key={h}
                      className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest${i > 1 ? " text-right" : " text-left"}`}
                      style={{ color: "var(--sv-text-2)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.categorySvinn ?? []).map((cat, i) => (
                  <tr key={cat.category}
                    className="hover:bg-muted/25 transition-colors cursor-pointer"
                    onClick={() => setSelectedCategory(cat.category)}
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid var(--sv-border)",
                      background: selectedCategory === cat.category ? "rgba(201,168,76,.10)" : undefined,
                    }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: RATE_BG(cat.svinnRatePct) }}>
                          <Leaf className="w-3.5 h-3.5" style={{ color: RATE_COLOR(cat.svinnRatePct) }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--sv-text)" }}>{t(cat.category)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: "var(--sv-text-2)" }}>
                      {cat.ingredientCount} {t("st")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: RATE_BG(cat.svinnRatePct), color: RATE_COLOR(cat.svinnRatePct) }}>
                        {cat.svinnRatePct}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold" style={{ color: "var(--sv-text)" }}>
                      {cat.wasteCostSek.toFixed(0)} kr
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold" style={{ color: "#ef4444" }}>
                      {cat.estimatedWeeklyWasteSek.toFixed(0)} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 50, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--sv-text-2)" }}
                    angle={-38} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "var(--sv-surface)", color: "var(--sv-text)", border: "1px solid var(--sv-border)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 16px var(--sv-shadow)" }}
                    formatter={(val: number) => [`${val}%`, t("Svinnfrekvens")]}
                    cursor={{ fill: "var(--sv-muted)" }}
                  />
                  <Bar dataKey="svinn" radius={[6, 6, 0, 0]} onClick={(entry: any) => setSelectedCategory(entry.category)}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={RATE_COLOR(entry.svinn)} cursor="pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 12px var(--sv-shadow)" }}>
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,.15)" }}>
              <Lightbulb className="w-4 h-4" style={{ color: "hsl(44 54% 50%)" }} />
            </div>
            <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--sv-text)" }}>
              {t("Spartips")}
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              : tips.map((tip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedTip(tip)}
                    className="w-full text-left p-3.5 rounded-xl transition-colors hover:bg-muted/30"
                    style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{tip.icon}</span>
                      <div>
                        <p className="text-[13px] font-bold mb-0.5" style={{ color: "var(--sv-text)" }}>{tip.title}</p>
                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{tip.desc}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "hsl(44 54% 46%)" }}>
                          {lang === "en" ? "Open details" : "Visa detaljer"} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))
            }
          </div>
        </div>
      </div>

      {selectedTip && (
        <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 12px var(--sv-shadow)", border: "1px solid var(--sv-border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{selectedTip.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(44 54% 46%)" }}>
                  {lang === "en" ? "Saving tip details" : "Detaljerat spartips"}
                </p>
                <h3 className="font-serif text-lg font-semibold mt-1" style={{ color: "var(--sv-text)" }}>{selectedTip.title}</h3>
                <p className="text-[13px] leading-relaxed mt-2 max-w-3xl" style={{ color: "var(--sv-text-2)" }}>{selectedTip.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTip(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {lang === "en" ? "Close" : "Stäng"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 mt-5">
            {[
              lang === "en" ? "Assign one owner for the routine during service prep." : "Ge rutinen en tydlig ansvarig under mise en place.",
              lang === "en" ? "Track before/after waste for one week to prove the effect." : "Mät svinn före/efter i en vecka för att se effekten.",
              lang === "en" ? "Start with the category that currently has the highest weekly waste cost." : "Börja med kategorin som har högst svinnkostnad per vecka.",
            ].map((item) => (
              <div key={item} className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 12px var(--sv-shadow)" }}>
          <div className="px-6 py-4 flex items-start gap-3" style={{ borderBottom: "1px solid var(--sv-border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: RATE_BG(selected.svinnRatePct) }}>
              <Leaf className="w-4 h-4" style={{ color: RATE_COLOR(selected.svinnRatePct) }} />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>
                {t(selected.category)}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en"
                  ? `${selected.ingredientCount} ingredients · ${selected.svinnRatePct}% modeled waste rate · ${selected.estimatedWeeklyWasteSek.toFixed(0)} SEK/week`
                  : `${selected.ingredientCount} ingredienser · ${selected.svinnRatePct}% modellerad svinnfrekvens · ${selected.estimatedWeeklyWasteSek.toFixed(0)} kr/vecka`}
              </p>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {lang === "en" ? "Close" : "Stäng"}
            </button>
          </div>
          <div className="grid gap-0 lg:grid-cols-3">
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                    {[
                      lang === "en" ? "Ingredient" : "Ingrediens",
                      lang === "en" ? "Supplier" : "Leverantör",
                      lang === "en" ? "Price" : "Pris",
                      lang === "en" ? "Price change" : "Prisändring",
                      lang === "en" ? "Est. waste/week" : "Est. svinn/vecka",
                    ].map((h, i) => (
                      <th key={h}
                        className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest${i >= 2 ? " text-right" : " text-left"}`}
                        style={{ color: "var(--sv-text-2)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.ingredients.map((ingredient, i) => (
                    <tr key={ingredient.id}
                      className="hover:bg-muted/25 transition-colors"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--sv-border)" }}>
                      <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>
                        {ingredient.name}
                      </td>
                      <td className="px-5 py-3.5 text-[13px]" style={{ color: "var(--sv-text-2)" }}>
                        {ingredient.supplier ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "var(--sv-text)" }}>
                        {ingredient.currentPriceSek.toFixed(2)} kr/{ingredient.unit}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: ingredient.priceChangePct > 0 ? "#ef4444" : ingredient.priceChangePct < 0 ? "#10b981" : "var(--sv-text-2)" }}>
                        {ingredient.priceChangePct > 0 ? "+" : ""}{ingredient.priceChangePct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "#ef4444" }}>
                        {ingredient.estimatedWeeklyWasteSek.toFixed(2)} kr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 flex flex-col gap-3" style={{ borderLeft: "1px solid var(--sv-border)" }}>
              <div className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(44 54% 46%)" }}>
                  {lang === "en" ? "Calculation" : "Beräkning"}
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
                  {lang === "en"
                    ? `Each ingredient uses the category rate (${selected.svinnRatePct}%). Weekly estimate assumes ${data?.assumptions.avgDailyPortions} portions/day and seven service days.`
                    : `Varje ingrediens använder kategorins svinnfrekvens (${selected.svinnRatePct}%). Veckoestimatet antar ${data?.assumptions.avgDailyPortions} portioner/dag och sju serveringsdagar.`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3" style={{ background: RATE_BG(selected.svinnRatePct) }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RATE_COLOR(selected.svinnRatePct) }}>
                    {lang === "en" ? "Rate" : "Frekvens"}
                  </p>
                  <p className="font-serif text-xl font-bold" style={{ color: "var(--sv-text)" }}>{selected.svinnRatePct}%</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--sv-muted)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>
                    {lang === "en" ? "Raw cost" : "Råvarukostnad"}
                  </p>
                  <p className="font-serif text-xl font-bold" style={{ color: "var(--sv-text)" }}>{selected.totalIngredientCostSek.toFixed(0)} kr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 12px var(--sv-shadow)" }}>
        <h2 className="font-serif text-lg font-semibold mb-5" style={{ color: "var(--sv-text)" }}>
          {t("Branschjämförelse — Svinnfrekvenser")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benchmarks.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setSelectedBenchmark(b)}
              className="rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
              style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "var(--sv-text)" }}>{b.label}</p>
                  <p className="text-[11px]" style={{ color: "hsl(44 54% 50%)" }}>{t("Bransch:")} {b.rate}</p>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--sv-border)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(b.your, 25) * 4}%`, background: RATE_COLOR(b.your) }} />
              </div>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{b.tip}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: RATE_COLOR(b.your) }}>
                {lang === "en" ? "Open details" : "Visa detaljer"} <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedBenchmark && (
        <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 12px var(--sv-shadow)", border: "1px solid var(--sv-border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">{selectedBenchmark.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(44 54% 46%)" }}>
                  {lang === "en" ? "Industry benchmark details" : "Detaljerad branschjämförelse"}
                </p>
                <h3 className="font-serif text-lg font-semibold mt-1" style={{ color: "var(--sv-text)" }}>{selectedBenchmark.label}</h3>
                <p className="text-[13px] leading-relaxed mt-2 max-w-3xl" style={{ color: "var(--sv-text-2)" }}>{selectedBenchmark.tip}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedBenchmark(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {lang === "en" ? "Close" : "Stäng"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mt-5">
            <div className="rounded-xl p-4" style={{ background: RATE_BG(selectedBenchmark.your), border: "1px solid var(--sv-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RATE_COLOR(selectedBenchmark.your) }}>
                {lang === "en" ? "Reference range" : "Branschintervall"}
              </p>
              <p className="font-serif text-xl font-bold mt-1" style={{ color: "var(--sv-text)" }}>{selectedBenchmark.rate}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en" ? "Modeled value" : "Modellerat värde"}
              </p>
              <p className="font-serif text-xl font-bold mt-1" style={{ color: RATE_COLOR(selectedBenchmark.your) }}>{selectedBenchmark.your}%</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en" ? "Action" : "Åtgärd"}
              </p>
              <p className="text-[12px] leading-relaxed mt-1" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en"
                  ? "Compare this reference against your selected category and prioritize the highest weekly waste cost."
                  : "Jämför referensen med vald kategori och prioritera den högsta svinnkostnaden per vecka."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
