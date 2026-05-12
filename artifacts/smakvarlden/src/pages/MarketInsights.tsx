import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, TrendingUp, TrendingDown, AlertTriangle, Leaf, ChefHat,
  ArrowRight, Info, BarChart2,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine,
} from "recharts";
import { useI18n } from "@/lib/i18n";

interface Overview {
  dataNote:      string;
  priceIndex:    { month: string; livsmedel: number; restaurang: number; kott: number; fisk: number }[];
  categoryStats: {
    category: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    count: number;
    ingredients?: {
      id: number;
      name: string;
      unit: string;
      currentPriceSek: number;
      priceChangePct: number;
      supplier?: string;
    }[];
  }[];
  benchmarks:    { label: string; yours: number; industry: number; unit: string; desc: string; goodIfLower: boolean }[];
  seasonalGuide: { season: string; emoji: string; cheap: string[]; expensive: string[]; tip: string }[];
  insights:      { tag: string; color: string; title: string; desc: string }[];
  summary:       { foodInflationPct: number; restaurantPricePct: number; avgFoodCostPct: number; avgMarginPct: number };
}

function useMarketOverview() {
  return useQuery<Overview>({
    queryKey: ["market-overview"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/api/market/overview`);
      if (!r.ok) throw new Error("Failed to load market data");
      return r.json();
    },
    staleTime: 5 * 60_000,
  });
}

function benchmarkColor(yours: number, industry: number, goodIfLower: boolean) {
  const better = goodIfLower ? yours <= industry : yours >= industry;
  return better ? "#16a34a" : yours === industry ? "#d97706" : "#dc2626";
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-serif font-bold" style={{ color: "var(--sv-text)" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{sub}</p>
    </div>
  );
}

const LINE_COLORS = { livsmedel: "hsl(44 50% 46%)", restaurang: "#3b82f6", kott: "#ef4444", fisk: "#06b6d4" };
const BAR_COLORS  = ["hsl(44 50% 46%)","#3b82f6","#10b981","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16","#d97706","#14b8a6"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-[12px]"
      style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 4px 16px var(--sv-shadow)", color: "var(--sv-text)" }}>
      <p className="font-bold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--sv-text-2)" }}>{p.name}:</span>
          <span className="font-semibold">{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

const EN_SEASONAL = [
  { season: "Winter (Dec–Feb)", emoji: "❄️", cheap: ["Root vegetables", "Cabbage", "Citrus fruits", "Winter apples", "Pork"], expensive: ["Tomatoes", "Cucumber", "Summer berries", "Asparagus"], tip: "Focus on root mash, cabbage soup and slow-cooked stews. Replace tomatoes with canned." },
  { season: "Spring (Mar–May)", emoji: "🌱", cheap: ["Asparagus", "Wild garlic", "Spinach", "Radishes", "Lamb"], expensive: ["Game", "Mushrooms", "Pumpkin", "Root vegetables (end of season)"], tip: "Asparagus stays cheap March–May. Wild garlic replaces garlic in salads and sauces." },
  { season: "Summer (Jun–Aug)", emoji: "☀️", cheap: ["Tomatoes", "Cucumber", "Zucchini", "Strawberries", "Blueberries"], expensive: ["Lobster", "Crayfish (Aug season)", "Imported meat"], tip: "Fill the menu with local vegetables. Choose cod or pollack instead of salmon (salmon rises in summer)." },
  { season: "Autumn (Sep–Nov)", emoji: "🍂", cheap: ["Chanterelles", "Game", "Squash", "Pears", "Apples", "Pumpkin"], expensive: ["Asparagus", "Summer herbs", "Strawberries"], tip: "October–November is best for game (moose, deer). Mushrooms are cheapest in September." },
];

const EN_INSIGHTS = [
  { tag: "SCB", color: "#3b82f6", title: "Food Price Index +3.8% YoY", desc: "Consumer price index for food rose 3.8% in 2025 compared to 2024 according to SCB. Milk, cheese and eggs drove the increase at +5.2%." },
  { tag: "Trend", color: "#10b981", title: "Vegetarian dishes +22%", desc: "The share of vegetarian orders in Swedish restaurants increased 22% in 2024–2025 (Visita). Menus with plant-based options increase revenue by an average of 8%." },
  { tag: "Ingredients", color: "#ef4444", title: "Salmon +11%, shrimp +8% YoY", desc: "Norwegian salmon averaged 145 SEK/kg Q1 2026 (+11% YoY). North Sea shrimp +8%. Switch to cod or pollack to preserve margin." },
  { tag: "Energy", color: "#d97706", title: "Electricity costs stabilising", desc: "The electricity price for large kitchens SE3/SE4 stabilised at ~1.10 SEK/kWh Q1 2026 after peaking at 2.30 SEK/kWh. Energy costs now burden the margin by 3–5% vs the previous 8–10%." },
  { tag: "HRF", color: "#8b5cf6", title: "Restaurant industry status", desc: "The Hotel and Restaurant Workers' Union (HRF) reports that 67% of Swedish restaurants achieve 60%+ food margin. Lunch restaurants have the lowest margin (52% average)." },
];

const EN_BENCHMARKS_LABELS: Record<string, { label: string; desc: string }> = {
  "Råvarukostnad": { label: "Raw material cost", desc: "Of selling price" },
  "Vinstmarginal": { label: "Profit margin", desc: "Food margin" },
  "Menymarkup":    { label: "Menu markup", desc: "Cost × factor" },
  "Svinnfrekvens": { label: "Waste rate", desc: "Industry avg SE 2025" },
  "Prisändringar": { label: "Price changes", desc: "Alerts last week" },
};

export default function MarketInsights() {
  const { data, isLoading } = useMarketOverview();
  const { t, lang } = useI18n();
  const [selectedInsight, setSelectedInsight] = useState<Overview["insights"][number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Overview["categoryStats"][number] | null>(null);
  const dataNote = lang === "en"
    ? "Recipe and ingredient costs come from the database. Price indexes are fetched from Statistics Sweden (SCB) when available. Industry targets and seasonal guidance are planning references."
    : data?.dataNote;

  const insights      = lang === "en" ? EN_INSIGHTS      : (data?.insights ?? []);
  const seasonalGuide = lang === "en" ? EN_SEASONAL      : (data?.seasonalGuide ?? []);

  const lineNames = lang === "en"
    ? { livsmedel: "Food", restaurang: "Restaurant price", kott: "Meat", fisk: "Fish" }
    : { livsmedel: "Livsmedel", restaurang: "Restaurangpris", kott: "Kött", fisk: "Fisk" };

  const benchmarks = (data?.benchmarks ?? []).map((b) => {
    if (lang === "en" && EN_BENCHMARKS_LABELS[b.label]) {
      return { ...b, ...EN_BENCHMARKS_LABELS[b.label] };
    }
    return b;
  });

  return (
    <div className="flex flex-col gap-7 max-w-6xl">

      <div className="relative rounded-2xl overflow-hidden px-7 py-7"
        style={{ background: "linear-gradient(135deg, hsl(220 40% 18%), hsl(220 35% 24%))", boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}>
        <div className="absolute right-0 top-0 w-64 h-full opacity-[.06]"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 70%)" }} />
        <div className="relative flex items-center justify-between gap-5 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,.25)" }}>
                <Globe className="w-4 h-4" style={{ color: "#93c5fd" }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd" }}>{t("Modellerad marknadsdata")}</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">{t("Marknadsinsikter & Ekonomi")}</h1>
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,.55)" }}>
              {t("Prisindex, branschbenchmark och säsongsguide för svenska restaurangkockar")}
            </p>
          </div>
          <div className="flex gap-2 text-[11px] text-white/60 items-center shrink-0">
            <Info className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Curated references: SCB · HRF · Visita · 2025–2026" : "Kuraterade referenser: SCB · HRF · Visita · 2025–2026"}</span>
          </div>
        </div>
      </div>

      {!isLoading && dataNote && (
        <div className="rounded-2xl px-5 py-3 flex items-start gap-3"
          style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.18)", color: "var(--sv-text-2)" }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#3b82f6" }} />
          <p className="text-[12px] leading-relaxed">{dataNote}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) : data && (
          <>
            <StatCard label={t("Livsmedelsindex")} value={`+${data.summary.foodInflationPct}%`}
              sub={t("Estimerad YoY-referens (SCB 2025)")} icon={TrendingUp} color="#ef4444" />
            <StatCard label={t("Restaurangprisindex")} value={`+${data.summary.restaurantPricePct}%`}
              sub={t("Prisstegring på menyer")} icon={TrendingUp} color="#d97706" />
            <StatCard label={t("Din råvarukostnad")} value={`${Number(data.summary.avgFoodCostPct).toFixed(1)}%`}
              sub={t("Av försäljningspriset (bransch: 30%)")} icon={ChefHat} color="hsl(44 50% 46%)" />
            <StatCard label={t("Din livsmedelsmarginal")} value={`${Number(data.summary.avgMarginPct).toFixed(1)}%`}
              sub={t("Snittmarginal på dina recept")} icon={BarChart2} color="#10b981" />
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl p-6"
          style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,.12)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Prisindex — 12 månader")}</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("Basindex 100 = Juni 2025")}</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-64 rounded-xl mt-4" /> : (
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={data?.priceIndex ?? []} margin={{ top: 16, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[98, 109]} tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <ReferenceLine y={100} stroke="var(--sv-border)" strokeDasharray="4 2" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "var(--sv-text-2)" }} />
                <Line type="monotone" dataKey="livsmedel" name={lineNames.livsmedel} stroke={LINE_COLORS.livsmedel} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="restaurang" name={lineNames.restaurang} stroke={LINE_COLORS.restaurang} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="kott" name={lineNames.kott} stroke={LINE_COLORS.kott} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="fisk" name={lineNames.fisk} stroke={LINE_COLORS.fisk} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Marknadsläge")}</h2>
            <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("Aktuellt för svenska restauranger")}</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--sv-border)" }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-5 py-4"><Skeleton className="h-14 rounded-lg" /></div>)
              : insights.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setSelectedInsight(item)}
                    className="w-full text-left px-5 py-4 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.04]"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${item.color}18`, color: item.color }}>
                        {item.tag}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{item.title}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{item.desc}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: item.color }}>
                      {lang === "en" ? "Open details" : "Visa detaljer"} <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))
            }
          </div>
        </div>
      </div>

      {selectedInsight && (
        <div className="rounded-2xl p-5"
          style={{ background: "var(--sv-surface)", border: `1px solid ${selectedInsight.color}33`, boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${selectedInsight.color}18`, color: selectedInsight.color }}>
                {selectedInsight.tag}
              </span>
              <h3 className="font-serif text-lg font-semibold mt-3" style={{ color: "var(--sv-text)" }}>{selectedInsight.title}</h3>
              <p className="text-[13px] leading-relaxed mt-2 max-w-3xl" style={{ color: "var(--sv-text-2)" }}>{selectedInsight.desc}</p>
            </div>
            <button
              onClick={() => setSelectedInsight(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {lang === "en" ? "Close" : "Stäng"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 mt-5">
            {[
              lang === "en" ? "Check affected menu items and compare their current margin." : "Kontrollera berörda rätter och jämför aktuell marginal.",
              lang === "en" ? "Update supplier quotes before changing menu prices." : "Uppdatera leverantörspriser innan du ändrar menypriser.",
              lang === "en" ? "Use this as a planning signal, not audited live market data." : "Använd detta som planeringssignal, inte reviderad live-marknadsdata.",
            ].map((text) => (
              <div key={text} className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,.12)" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Jämfört med branschen")}</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("Dina siffror vs svensk branschsnitt (HRF 2025)")}</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
            <div className="flex flex-col gap-4">
              {benchmarks.map((b) => {
                const yoursN  = typeof b.yours    === "number" ? b.yours    : parseFloat(String(b.yours));
                const industN = typeof b.industry === "number" ? b.industry : parseFloat(String(b.industry));
                const col = benchmarkColor(yoursN, industN, b.goodIfLower);
                const maxBar = Math.max(yoursN, industN) * 1.25;
                return (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{b.label}</span>
                        <span className="text-[11px] ml-2" style={{ color: "var(--sv-text-2)" }}>{b.desc}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[12px] font-bold" style={{ color: col }}>{b.yours}{b.unit}</span>
                        <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>/ {b.industry}{b.unit}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: "var(--sv-text-2)" }}>{t("Du")}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(yoursN / maxBar) * 100}%`, background: col }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: "var(--sv-text-2)" }}>{t("Snitt")}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(industN / maxBar) * 100}%`, background: "var(--sv-text-2)" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,.12)" }}>
              <Leaf className="w-4 h-4" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Snittpris per kategori")}</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("kr/kg — baserat på dina ingredienser")}</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={(data?.categoryStats ?? []).slice(0, 10)}
                layout="vertical"
                margin={{ top: 4, right: 40, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" width={90}
                  tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => t(v)} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--sv-muted)" }} />
                <Bar dataKey="avgPrice" name={t("Snitt kr/kg")} radius={[0,4,4,0]}>
                  {(data?.categoryStats ?? []).slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,163,74,.12)" }}>
            <Leaf className="w-4 h-4" style={{ color: "#16a34a" }} />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Säsongsguide — köp rätt råvaror i rätt tid")}</h2>
            <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("Billigast och dyrast per säsong för svenska restauranger")}</p>
          </div>
        </div>
        {isLoading ? <Skeleton className="h-48 rounded-2xl" /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {seasonalGuide.map((s) => (
              <div key={s.season} className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <p className="text-[12px] font-bold" style={{ color: "var(--sv-text)" }}>{s.season}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#16a34a" }}>
                    {t("Billigast nu")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.cheap.map((item) => (
                      <span key={item} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#dc2626" }}>
                    {t("Undvik nu")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.expensive.map((item) => (
                      <span key={item} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(220,38,38,.10)", color: "#dc2626" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed pt-1" style={{ color: "var(--sv-text-2)", borderTop: "1px solid var(--sv-border)" }}>
                  💡 {s.tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
          <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Detaljerat prisregister per kategori")}</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>{t("Min, max och snitt baserat på dina spårade ingredienser")}</p>
        </div>
        {isLoading ? <div className="p-5"><Skeleton className="h-48 rounded-xl" /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                {[t("Kategori"), t("Antal"), t("Lägst kr/kg"), t("Snitt kr/kg"), t("Högst kr/kg"), t("Prisintervall")].map((h, i) => (
                  <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest ${i > 1 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--sv-text-2)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.categoryStats ?? []).map((cat, i) => {
                const min  = Number(cat.minPrice);
                const avg  = Number(cat.avgPrice);
                const max  = Number(cat.maxPrice);
                const cnt  = Number(cat.count);
                const range = max - min;
                const pct   = max > 0 ? (avg / max) * 100 : 50;
                return (
                  <tr
                    key={cat.category}
                    onClick={() => setSelectedCategory(cat)}
                    className="transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.04] cursor-pointer"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid var(--sv-border)`,
                      background: selectedCategory?.category === cat.category ? "rgba(201,168,76,.10)" : undefined,
                    }}>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{t(cat.category)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                        {cnt} {t("st")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "#16a34a" }}>{min.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{avg.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "#dc2626" }}>{max.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right" style={{ minWidth: 100 }}>
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                        <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{range.toFixed(0)} kr</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedCategory && (
        <div className="rounded-2xl p-5"
          style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>
                {lang === "en" ? "Price category details" : "Prisregister detaljer"}
              </p>
              <h3 className="font-serif text-lg font-semibold mt-1" style={{ color: "var(--sv-text)" }}>
                {t(selectedCategory.category)}
              </h3>
              <p className="text-[12px] mt-1" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en"
                  ? `${selectedCategory.count} tracked ingredients in this category. Use the spread to spot unusually expensive items.`
                  : `${selectedCategory.count} spårade ingredienser i kategorin. Använd prisintervallet för att hitta ovanligt dyra råvaror.`}
              </p>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
              {lang === "en" ? "Close" : "Stäng"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 mt-5">
            {[
              { label: lang === "en" ? "Lowest" : "Lägst", value: `${Number(selectedCategory.minPrice).toFixed(0)} kr/kg`, color: "#16a34a" },
              { label: lang === "en" ? "Average" : "Snitt", value: `${Number(selectedCategory.avgPrice).toFixed(0)} kr/kg`, color: "var(--sv-text)" },
              { label: lang === "en" ? "Highest" : "Högst", value: `${Number(selectedCategory.maxPrice).toFixed(0)} kr/kg`, color: "#dc2626" },
              { label: lang === "en" ? "Spread" : "Intervall", value: `${(Number(selectedCategory.maxPrice) - Number(selectedCategory.minPrice)).toFixed(0)} kr`, color: "#d97706" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>{item.label}</p>
                <p className="font-serif text-xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl overflow-hidden mt-4" style={{ border: "1px solid var(--sv-border)" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--sv-muted)", borderBottom: "1px solid var(--sv-border)" }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>
                {lang === "en" ? "Ingredients in category" : "Ingredienser i kategorin"}
              </p>
              <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>
                {(selectedCategory.ingredients ?? []).length} {t("st")}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--sv-border)" }}>
              {(selectedCategory.ingredients ?? []).map((ingredient) => (
                <div key={ingredient.id} className="px-4 py-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_90px] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--sv-text)" }}>{ingredient.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--sv-text-2)" }}>
                      {ingredient.supplier || (lang === "en" ? "No supplier" : "Ingen leverantör")}
                    </p>
                  </div>
                  <p className="text-[13px] font-bold sm:text-right" style={{ color: "var(--sv-text)" }}>
                    {ingredient.currentPriceSek.toFixed(2)} kr/{ingredient.unit}
                  </p>
                  <p className="text-[12px] font-semibold sm:text-right" style={{ color: ingredient.priceChangePct > 0 ? "#dc2626" : ingredient.priceChangePct < 0 ? "#16a34a" : "var(--sv-text-2)" }}>
                    {ingredient.priceChangePct > 0 ? "+" : ""}{ingredient.priceChangePct.toFixed(1)}%
                  </p>
                </div>
              ))}
              {(selectedCategory.ingredients ?? []).length === 0 && (
                <p className="px-4 py-3 text-[12px]" style={{ color: "var(--sv-text-2)" }}>
                  {lang === "en" ? "No ingredients found for this category." : "Inga ingredienser hittades i kategorin."}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl p-4 mt-3" style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.18)" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
              {lang === "en"
                ? "Next action: compare the highest-priced ingredients against supplier alternatives, then check whether recipes using them still meet your target margin."
                : "Nästa steg: jämför de dyraste råvarorna mot alternativa leverantörer och kontrollera om recepten som använder dem fortfarande når målmargin."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
