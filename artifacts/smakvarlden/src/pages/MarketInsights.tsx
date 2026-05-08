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

/* ── Types ── */
interface Overview {
  priceIndex:    { month: string; livsmedel: number; restaurang: number; kott: number; fisk: number }[];
  categoryStats: { category: string; avgPrice: number; minPrice: number; maxPrice: number; count: number }[];
  benchmarks:    { label: string; yours: number; industry: number; unit: string; desc: string; goodIfLower: boolean }[];
  seasonalGuide: { season: string; emoji: string; cheap: string[]; expensive: string[]; tip: string }[];
  insights:      { tag: string; color: string; title: string; desc: string }[];
  summary:       { foodInflationPct: number; restaurantPricePct: number; avgFoodCostPct: number; avgMarginPct: number };
}

/* ── Fetch hook ── */
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

/* ── Helpers ── */
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

/* ── Custom tooltip ── */
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

export default function MarketInsights() {
  const { data, isLoading } = useMarketOverview();

  return (
    <div className="flex flex-col gap-7 max-w-6xl">

      {/* ── Header ── */}
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
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#93c5fd" }}>Live marknadsdata</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Marknadsinsikter & Ekonomi</h1>
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,.55)" }}>
              Prisindex, branschbenchmark och säsongsguide för svenska restaurangkockar
            </p>
          </div>
          <div className="flex gap-2 text-[11px] text-white/60 items-center shrink-0">
            <Info className="w-3.5 h-3.5" />
            <span>Data: SCB · HRF · Visita · 2025–2026</span>
          </div>
        </div>
      </div>

      {/* ── 4 stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) : data && (
          <>
            <StatCard label="Livsmedelsindex" value={`+${data.summary.foodInflationPct}%`}
              sub="YoY inflation (SCB 2025)" icon={TrendingUp} color="#ef4444" />
            <StatCard label="Restaurangprisindex" value={`+${data.summary.restaurantPricePct}%`}
              sub="Prisstegring på menyer" icon={TrendingUp} color="#d97706" />
            <StatCard label="Din råvarukostnad" value={`${Number(data.summary.avgFoodCostPct).toFixed(1)}%`}
              sub="Av försäljningspriset (bransch: 30%)" icon={ChefHat} color="hsl(44 50% 46%)" />
            <StatCard label="Din livsmedelsmarginal" value={`${Number(data.summary.avgMarginPct).toFixed(1)}%`}
              sub="Snittmarginal på dina recept" icon={BarChart2} color="#10b981" />
          </>
        )}
      </div>

      {/* ── Price index chart + Insights ── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Price index — 3/5 */}
        <div className="lg:col-span-3 rounded-2xl p-6"
          style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,.12)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Prisindex — 12 månader</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>Basindex 100 = Juni 2025</p>
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
                <Line type="monotone" dataKey="livsmedel" name="Livsmedel" stroke={LINE_COLORS.livsmedel} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="restaurang" name="Restaurangpris" stroke={LINE_COLORS.restaurang} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="kott" name="Kött" stroke={LINE_COLORS.kott} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="fisk" name="Fisk" stroke={LINE_COLORS.fisk} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Market news — 2/5 */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Marknadsläge</h2>
            <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>Aktuellt för svenska restauranger</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--sv-border)" }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-5 py-4"><Skeleton className="h-14 rounded-lg" /></div>)
              : (data?.insights ?? []).map((item) => (
                  <div key={item.title} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${item.color}18`, color: item.color }}>
                        {item.tag}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{item.title}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{item.desc}</p>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* ── Benchmarks + Category prices ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Benchmarks */}
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,.12)" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Jämfört med branschen</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>Dina siffror vs svensk branschsnitt (HRF 2025)</p>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
            <div className="flex flex-col gap-4">
              {(data?.benchmarks ?? []).map((b) => {
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
                        <span className="text-[12px] font-bold" style={{ color: col }}>
                          {b.yours}{b.unit}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>/ {b.industry}{b.unit}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: "var(--sv-text-2)" }}>Du</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(yoursN / maxBar) * 100}%`, background: col }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-10 shrink-0" style={{ color: "var(--sv-text-2)" }}>Snitt</span>
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

        {/* Category avg prices chart */}
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,.12)" }}>
              <Leaf className="w-4 h-4" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Snittpris per kategori</h2>
              <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>kr/kg — baserat på dina 148 ingredienser</p>
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
                  tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--sv-muted)" }} />
                <Bar dataKey="avgPrice" name="Snitt kr/kg" radius={[0,4,4,0]}>
                  {(data?.categoryStats ?? []).slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Seasonal guide ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,163,74,.12)" }}>
            <Leaf className="w-4 h-4" style={{ color: "#16a34a" }} />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Säsongsguide — köp rätt råvaror i rätt tid</h2>
            <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>Billigast och dyrast per säsong för svenska restauranger</p>
          </div>
        </div>
        {isLoading ? <Skeleton className="h-48 rounded-2xl" /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.seasonalGuide ?? []).map((s) => (
              <div key={s.season} className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <p className="text-[12px] font-bold" style={{ color: "var(--sv-text)" }}>{s.season}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#16a34a" }}>
                    Billigast nu
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
                    Undvik nu
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

      {/* ── Category price table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
          <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Detaljerat prisregister per kategori</h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>Min, max och snitt baserat på dina spårade ingredienser</p>
        </div>
        {isLoading ? <div className="p-5"><Skeleton className="h-48 rounded-xl" /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                {["Kategori", "Antal", "Lägst kr/kg", "Snitt kr/kg", "Högst kr/kg", "Prisintervall"].map((h, i) => (
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
                  <tr key={cat.category} className="transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid var(--sv-border)` }}>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{cat.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                        {cnt} st
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "#16a34a" }}>
                      {min.toFixed(0)} kr
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>
                      {avg.toFixed(0)} kr
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "#dc2626" }}>
                      {max.toFixed(0)} kr
                    </td>
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

    </div>
  );
}
