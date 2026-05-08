import { useState } from "react";
import {
  useListIngredients, useDeleteIngredient, useCreateIngredient,
  useGetIngredientPriceTrends, getListIngredientsQueryKey, getGetIngredientPriceTrendsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Minus, Leaf, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddIngredientDialog } from "@/components/AddIngredientDialog";
import { ImportDialog, type CsvRow } from "@/components/ImportDialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useI18n, INGREDIENT_CATEGORIES } from "@/lib/i18n";

const CHART_COLORS = ["hsl(44 50% 46%)", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

function PriceChangePill({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  if (abs < 0.1) return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
      <Minus className="w-3 h-3" /> 0.0%
    </span>
  );
  if (pct > 0) return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(239,68,68,.12)", color: "#dc2626" }}>
      <TrendingUp className="w-3 h-3" /> +{pct.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }}>
      <TrendingDown className="w-3 h-3" /> {pct.toFixed(1)}%
    </span>
  );
}

export default function Ingredients() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { ...(search ? { search } : {}), ...(category ? { category } : {}) };
  const ingredients = useListIngredients(params, { query: { queryKey: getListIngredientsQueryKey(params) } });
  const priceTrends = useGetIngredientPriceTrends({ query: { queryKey: getGetIngredientPriceTrendsQueryKey() } });
  const deleteIngredient = useDeleteIngredient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
        toast({ title: t("Ingrediens borttagen") });
      },
    },
  });
  const createIngredient = useCreateIngredient();

  async function handleImport(rows: CsvRow[]) {
    for (const row of rows) {
      await createIngredient.mutateAsync({
        data: {
          name: row["name"] || row["namn"] || "Okänd",
          category: row["category"] || row["kategori"] || "Kött",
          unit: row["unit"] || row["enhet"] || "kg",
          currentPriceSek: parseFloat(row["price"] || row["pris"] || "0") || 0,
          supplier: row["supplier"] || row["leverantör"] || undefined,
        },
      });
    }
    queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
    toast({ title: `${rows.length} ${t("rader importerade")}` });
  }

  const trendsByIngredient = (priceTrends.data ?? []).reduce<Record<string, typeof priceTrends.data>>((acc, entry) => {
    if (!acc[entry.ingredientName]) acc[entry.ingredientName] = [];
    acc[entry.ingredientName]!.push(entry);
    return acc;
  }, {});
  const chartIngredients = Object.keys(trendsByIngredient).slice(0, 5);
  const dates = [...new Set((priceTrends.data ?? []).map((e) => e.date))].sort();
  const chartData = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    chartIngredients.forEach((name) => {
      const entry = trendsByIngredient[name]?.find((e) => e.date === date);
      if (entry) row[name] = entry.priceSek;
    });
    return row;
  });

  const FILTER_CATS = ["Alla", ...INGREDIENT_CATEGORIES];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>
            {t("Ingredienser")}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t("Råvarupriser uppdateras 3× per vecka")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 transition-all"
            style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)", border: "1.5px solid var(--sv-border)" }}>
            <Upload className="w-4 h-4" /> {t("Importera")}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 transition-all"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
            <Plus className="w-4 h-4" /> {t("Ny ingrediens")}
          </button>
        </div>
      </div>

      {/* Price trend chart */}
      {priceTrends.data && priceTrends.data.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "var(--sv-gold)" }}>
            {t("Prisutveckling · 7 veckor")}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: 12, fontSize: 12, color: "var(--sv-text)", boxShadow: "0 4px 16px var(--sv-shadow)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {chartIngredients.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={CHART_COLORS[i % CHART_COLORS.length]} dot={false} strokeWidth={2.5} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
          <input
            placeholder={t("Sök ingrediens...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)", fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_CATS.map((cat) => {
            const active = category === (cat === "Alla" ? "" : cat);
            return (
              <button key={cat} onClick={() => setCategory(cat === "Alla" ? "" : cat)}
                className="px-3.5 py-2 rounded-full text-[12px] font-medium transition-all"
                style={active ? {
                  background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)",
                } : { background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                {t(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {ingredients.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                {[t("Ingrediens"), t("Kategori"), t("Leverantör"), t("Pris"), t("Förändring"), ""].map((h) => (
                  <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest${h === t("Pris") || h === t("Förändring") ? " text-right" : " text-left"}`}
                    style={{ color: "var(--sv-text-2)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(ingredients.data ?? []).map((ing, i) => (
                <tr key={ing.id} className="group transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid var(--sv-border)` }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,.12)" }}>
                        <Leaf className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{ing.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                      {t(ing.category)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: "var(--sv-text-2)" }}>{ing.supplier ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>
                    {ing.currentPriceSek.toFixed(2)} kr/{ing.unit}
                  </td>
                  <td className="px-5 py-3.5 text-right"><PriceChangePill pct={ing.priceChangePct} /></td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => deleteIngredient.mutate({ id: ing.id })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "#dc2626" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {ingredients.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Leaf className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--sv-text-2)" }} />
                    <p className="text-[13px]" style={{ color: "var(--sv-text-2)" }}>{t("Inga ingredienser hittades")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AddIngredientDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        title={t("Importera ingredienser")}
        expectedHeaders={["name", "category", "unit", "price", "supplier"]}
        example={"Smör,Mejeri,kg,45.50,Arla"}
        onImport={handleImport}
      />
    </div>
  );
}
