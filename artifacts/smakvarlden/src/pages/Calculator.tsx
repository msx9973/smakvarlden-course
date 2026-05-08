import { useState, useRef, useEffect } from "react";
import {
  useGetTopPerformingRecipes, useGetIngredientCategoryBreakdown, useListIngredients,
  getGetTopPerformingRecipesQueryKey, getGetIngredientCategoryBreakdownQueryKey,
  getListIngredientsQueryKey,
} from "@workspace/api-client-react";
import type { Ingredient } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart2, Plus, Trash2, ChefHat, Search, Calculator as CalcIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const BAR_COLORS = ["hsl(44 50% 46%)","#3b82f6","#10b981","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"];

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

interface CalcLine {
  ingredientId: number;
  name: string;
  unit: string;
  unitPriceSek: number;
  quantity: number;
}

function DishCalculator() {
  const ingredients = useListIngredients({}, { query: { queryKey: getListIngredientsQueryKey() } });

  const [lines, setLines] = useState<CalcLine[]>([]);
  const [servings, setServings] = useState(4);
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const alreadyAdded = new Set(lines.map((l) => l.ingredientId));
  const filtered = (ingredients.data ?? [])
    .filter((i) => !alreadyAdded.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const addIngredient = (ing: Ingredient) => {
    setLines((prev) => [...prev, { ingredientId: ing.id, name: ing.name, unit: ing.unit, unitPriceSek: ing.currentPriceSek, quantity: 1 }]);
    setSearch("");
    setDropdownOpen(false);
  };

  const removeIngredient = (id: number) => setLines((prev) => prev.filter((l) => l.ingredientId !== id));

  const updateQuantity = (id: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setLines((prev) => prev.map((l) => l.ingredientId === id ? { ...l, quantity: n } : l));
  };

  const totalCost = lines.reduce((s, l) => s + l.quantity * l.unitPriceSek, 0);
  const safeServings = servings > 0 ? servings : 1;
  const costPerServing = totalCost / safeServings;
  const sp = typeof sellingPrice === "number" ? sellingPrice : 0;
  const margin = sp > 0 ? ((sp - costPerServing) / sp) * 100 : null;
  const profit = sp > 0 ? sp - costPerServing : null;

  const mColor = margin !== null ? marginColor(margin) : "var(--sv-text-2)";
  const mGrad = margin !== null ? marginGrad(margin) : "var(--sv-muted)";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--sv-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,.15)" }}>
          <CalcIcon className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
        </div>
        <div>
          <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Kalkylera ny rätt</h2>
          <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>Välj ingredienser, ange mängder och försäljningspris — marginalen räknas ut automatiskt</p>
        </div>
      </div>

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        {/* Left: ingredient picker + lines */}
        <div className="flex flex-col gap-4">
          {/* Search / add ingredient */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
              style={{ background: "var(--sv-muted)", border: "1.5px solid var(--sv-border)" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "var(--sv-text-2)" }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Sök och lägg till ingrediens…"
                className="flex-1 text-[13px] outline-none bg-transparent"
                style={{ color: "var(--sv-text)", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            {dropdownOpen && filtered.length > 0 && (
              <div ref={dropdownRef}
                className="absolute z-20 top-full mt-1 w-full rounded-xl overflow-hidden"
                style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 8px 24px var(--sv-shadow)" }}>
                {filtered.map((ing) => (
                  <button key={ing.id} onMouseDown={() => addIngredient(ing)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.04]">
                    <span className="text-[13px] font-medium" style={{ color: "var(--sv-text)" }}>{ing.name}</span>
                    <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{ing.currentPriceSek.toFixed(2)} kr/{ing.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ingredient lines */}
          {lines.length === 0 ? (
            <div className="rounded-xl py-10 flex flex-col items-center gap-2" style={{ background: "var(--sv-muted)" }}>
              <ChefHat className="w-8 h-8" style={{ color: "var(--sv-text-2)" }} />
              <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>Inga ingredienser tillagda ännu</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sv-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--sv-muted)", borderBottom: "1px solid var(--sv-border)" }}>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Ingrediens</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Mängd</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Kostnad</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={line.ingredientId} style={{ borderTop: i === 0 ? "none" : `1px solid var(--sv-border)` }}>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-medium" style={{ color: "var(--sv-text)" }}>{line.name}</span>
                        <span className="text-[11px] ml-1" style={{ color: "var(--sv-text-2)" }}>({line.unitPriceSek.toFixed(2)} kr/{line.unit})</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={line.quantity}
                            onChange={(e) => updateQuantity(line.ingredientId, e.target.value)}
                            className="w-16 px-2 py-1 rounded-lg text-right text-[13px] outline-none"
                            style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)", color: "var(--sv-text)", fontFamily: "'DM Sans', sans-serif" }}
                          />
                          <span className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{line.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>
                        {(line.quantity * line.unitPriceSek).toFixed(2)} kr
                      </td>
                      <td className="px-2 py-2.5">
                        <button onClick={() => removeIngredient(line.ingredientId)}
                          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                          style={{ color: "#dc2626" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid var(--sv-border)`, background: "var(--sv-muted)" }}>
                    <td colSpan={2} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Total råvarukostnad</td>
                    <td className="px-4 py-2.5 text-right text-[14px] font-bold" style={{ color: "var(--sv-text)" }}>{totalCost.toFixed(2)} kr</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Servings */}
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold shrink-0" style={{ color: "var(--sv-text-2)" }}>Antal portioner</label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
              className="w-20 px-3 py-2 rounded-xl text-[13px] outline-none text-center"
              style={{ background: "var(--sv-muted)", border: "1.5px solid var(--sv-border)", color: "var(--sv-text)", fontFamily: "'DM Sans', sans-serif" }}
            />
            <span className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>= {costPerServing.toFixed(2)} kr/portion</span>
          </div>
        </div>

        {/* Right: margin analysis */}
        <div className="flex flex-col gap-4">
          {/* Selling price input */}
          <div className="rounded-xl p-5" style={{ background: "var(--sv-muted)", border: "1.5px solid var(--sv-border)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sv-text-2)" }}>Försäljningspris per portion</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder="0"
                className="flex-1 px-4 py-3 rounded-xl text-xl font-bold outline-none text-center"
                style={{ background: "var(--sv-surface)", border: "2px solid var(--sv-border)", color: "var(--sv-text)", fontFamily: "'DM Sans', sans-serif" }}
              />
              <span className="text-[16px] font-bold" style={{ color: "var(--sv-text-2)" }}>kr</span>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: "var(--sv-surface)", border: "1.5px solid var(--sv-border)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Kalkylresultat</p>
            {[
              { label: "Råvarukostnad totalt",  value: `${totalCost.toFixed(2)} kr`,         muted: true },
              { label: "Kostnad per portion",    value: `${costPerServing.toFixed(2)} kr`,    muted: true },
              { label: "Försäljningspris",       value: sp > 0 ? `${sp.toFixed(2)} kr` : "—", muted: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{row.label}</span>
                <span className="text-[13px] font-semibold" style={{ color: row.muted ? "var(--sv-text-2)" : "var(--sv-text)" }}>{row.value}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid var(--sv-border)", paddingTop: 12, marginTop: 4 }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>Bruttovinst per portion</span>
                <span className="text-[14px] font-bold" style={{ color: profit !== null ? (profit > 0 ? "#16a34a" : "#dc2626") : "var(--sv-text-2)" }}>
                  {profit !== null ? `${profit > 0 ? "+" : ""}${profit.toFixed(2)} kr` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>Vinstmarginal</span>
                <span className="text-[18px] font-bold" style={{ color: mColor }}>
                  {margin !== null ? `${margin.toFixed(1)}%` : "—"}
                </span>
              </div>
              {margin !== null && (
                <>
                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "var(--sv-muted)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(margin, 0), 100)}%`, background: mGrad }} />
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>
                    {margin > 60 ? "✓ Bra marginal (>60%)" : margin > 45 ? "⚠ Godkänd marginal (45–60%)" : "✗ För låg marginal (<45%)"}
                  </p>
                </>
              )}
            </div>
          </div>

          {lines.length === 0 && (
            <p className="text-[12px] text-center" style={{ color: "var(--sv-text-2)" }}>
              Lägg till ingredienser till vänster för att börja kalkylen
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Calculator() {
  const topRecipes = useGetTopPerformingRecipes({ limit: 10 }, { query: { queryKey: getGetTopPerformingRecipesQueryKey({ limit: 10 }) } });
  const breakdown  = useGetIngredientCategoryBreakdown({ query: { queryKey: getGetIngredientCategoryBreakdownQueryKey() } });

  return (
    <div className="flex flex-col gap-7 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>Kalkylator</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Beräkna kostnad och marginal för dina rätter</p>
      </div>

      {/* Interactive dish cost calculator */}
      <DishCalculator />

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Margin bars */}
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(22,163,74,.12)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#16a34a" }} />
            </div>
            <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Bäst vinstmarginal</h2>
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
                      <p className="text-[11px] mt-1" style={{ color: "var(--sv-text-2)" }}>
                        {recipe.category} · Vinst: {recipe.profitSek.toFixed(0)} kr
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Category chart */}
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
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "var(--sv-text-2)" }}
                  angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: 12, fontSize: 12, color: "var(--sv-text)", boxShadow: "0 4px 16px var(--sv-shadow)" }}
                  formatter={(val: number) => [`${val.toFixed(2)} kr`, "Snittpris"]}
                  cursor={{ fill: "var(--sv-muted)" }}
                />
                <Bar dataKey="avgPriceSek" radius={[6,6,0,0]}>
                  {(breakdown.data ?? []).map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--sv-border)" }}>
          <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Detaljerad kostnadsjämförelse</h2>
        </div>
        {topRecipes.isLoading
          ? <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                  {["Recept","Kategori","Kostnad","Pris","Vinst","Marginal"].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest${i > 1 ? " text-right" : " text-left"}`}
                      style={{ color: "var(--sv-text-2)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(topRecipes.data ?? []).map((r, i) => (
                  <tr key={r.id} className="transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid var(--sv-border)` }}>
                    <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{r.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                        {r.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "var(--sv-text-2)" }}>{r.totalCostSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px]" style={{ color: "var(--sv-text-2)" }}>{r.sellingPriceSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "#16a34a" }}>+{r.profitSek.toFixed(0)} kr</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: r.profitMarginPct > 60 ? "rgba(22,163,74,.12)" : r.profitMarginPct > 45 ? "rgba(217,119,6,.12)" : "rgba(220,38,38,.12)",
                          color: marginColor(r.profitMarginPct),
                        }}>
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
