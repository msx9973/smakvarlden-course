import { useMemo, useState } from "react";
import {
  useGetTopPerformingRecipes,
  useGetIngredientCategoryBreakdown,
  getGetTopPerformingRecipesQueryKey,
  getGetIngredientCategoryBreakdownQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart2, Calculator as CalculatorIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const BAR_COLORS = ["hsl(44 50% 46%)", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function marginColor(pct: number) {
  if (pct > 60) return "#16a34a";
  if (pct > 45) return "#d97706";
  return "#dc2626";
}

function marginGrad(pct: number) {
  if (pct > 60) return "linear-gradient(90deg,#16a34a,#4ade80)";
  if (pct > 45) return "linear-gradient(90deg,#d97706,#fbbf24)";
  return "linear-gradient(90deg,#dc2626,#f87171)";
}

export default function Calculator() {
  const [rawCost, setRawCost] = useState(42);
  const [sellingPrice, setSellingPrice] = useState(149);
  const [servings, setServings] = useState(4);
  const topRecipes = useGetTopPerformingRecipes({ limit: 10 }, { query: { queryKey: getGetTopPerformingRecipesQueryKey({ limit: 10 }) } });
  const breakdown = useGetIngredientCategoryBreakdown({ query: { queryKey: getGetIngredientCategoryBreakdownQueryKey() } });
  const manual = useMemo(() => {
    const safeServings = Math.max(servings, 1);
    const profit = sellingPrice - rawCost;
    const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const foodCostPct = sellingPrice > 0 ? (rawCost / sellingPrice) * 100 : 0;
    const recommendedPrice = rawCost > 0 ? rawCost / 0.3 : 0;
    return {
      profit,
      marginPct,
      foodCostPct,
      costPerServing: rawCost / safeServings,
      pricePerServing: sellingPrice / safeServings,
      recommendedPrice,
    };
  }, [rawCost, sellingPrice, servings]);

  return (
    <div className="flex flex-col gap-7 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>Kalkylator</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Statistik, food cost och lonsamhetsanalys for dina recept</p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,119,6,.12)" }}>
            <CalculatorIcon className="w-4 h-4" style={{ color: "#d97706" }} />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Manuell food cost-kalkyl</h2>
            <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>Rakna snabbt marginal, food cost och rekommenderat pris.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField label="Ravarukostnad (kr)" value={rawCost} onChange={setRawCost} />
          <NumberField label="Forsaljningspris (kr)" value={sellingPrice} onChange={setSellingPrice} />
          <NumberField label="Portioner" value={servings} onChange={setServings} min={1} step={1} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-5">
          {[
            { label: "Vinst", value: `${manual.profit.toFixed(0)} kr`, color: manual.profit >= 0 ? "#16a34a" : "#dc2626" },
            { label: "Marginal", value: `${manual.marginPct.toFixed(1)}%`, color: marginColor(manual.marginPct) },
            { label: "Food cost", value: `${manual.foodCostPct.toFixed(1)}%`, color: manual.foodCostPct <= 35 ? "#16a34a" : manual.foodCostPct <= 45 ? "#d97706" : "#dc2626" },
            { label: "Kostnad/portion", value: `${manual.costPerServing.toFixed(2)} kr`, color: "var(--sv-text)" },
            { label: "Pris for 30%", value: `${manual.recommendedPrice.toFixed(0)} kr`, color: "var(--sv-text)" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "var(--sv-muted)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--sv-text-2)" }}>{item.label}</p>
              <p className="text-[16px] font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(22,163,74,.12)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#16a34a" }} />
            </div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Bast vinstmarginal</h2>
          </div>
          {topRecipes.isLoading
            ? <div className="space-y-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-xl" />)}</div>
            : (
              <div className="space-y-5">
                {(topRecipes.data ?? []).map((recipe) => {
                  const m = recipe.profitMarginPct;
                  return (
                    <div key={recipe.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[13px] font-medium truncate" style={{ color: "var(--sv-text)" }}>{recipe.name}</span>
                        <span className="text-[13px] font-bold shrink-0 ml-3" style={{ color: marginColor(m) }}>{m.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(m, 100)}%`, background: marginGrad(m) }} />
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--sv-text-2)" }}>{recipe.category} - Vinst: {recipe.profitSek.toFixed(0)} kr</p>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,.12)" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#3b82f6" }} />
            </div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Ingredienser per kategori</h2>
          </div>
          {breakdown.isLoading ? <Skeleton className="h-60 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={breakdown.data ?? []} margin={{ top: 4, right: 4, bottom: 44, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: 12, fontSize: 12, color: "var(--sv-text)", boxShadow: "0 4px 16px var(--sv-shadow)" }}
                  formatter={(val: number) => [`${val.toFixed(2)} kr`, "Snittpris"]}
                  cursor={{ fill: "var(--sv-muted)" }}
                />
                <Bar dataKey="avgPriceSek" radius={[6, 6, 0, 0]}>
                  {(breakdown.data ?? []).map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
          <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Detaljerad kostnadsjamforelse</h2>
        </div>
        {topRecipes.isLoading
          ? <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                  {["Recept", "Kategori", "Kostnad", "Pris", "Vinst", "Marginal"].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest${i > 1 ? " text-right" : " text-left"}`} style={{ color: "var(--sv-text-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(topRecipes.data ?? []).map((r, i) => (
                  <tr key={r.id} className="transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]" style={{ borderTop: i === 0 ? "none" : `1px solid var(--sv-border)` }}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{r.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>{r.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "var(--sv-text-2)" }}>{r.totalCostSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "var(--sv-text-2)" }}>{r.sellingPriceSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "#16a34a" }}>+{r.profitSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: r.profitMarginPct > 60 ? "rgba(22,163,74,.12)" : r.profitMarginPct > 45 ? "rgba(217,119,6,.12)" : "rgba(220,38,38,.12)", color: marginColor(r.profitMarginPct) }}>
                        {r.profitMarginPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, step = 0.01 }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
        style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)" }}
      />
    </label>
  );
}
