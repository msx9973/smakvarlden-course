import { useState } from "react";
import { Link } from "wouter";
import { useListRecipes, useDeleteRecipe, getListRecipesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, ExternalLink, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecipeDialog } from "@/components/AddRecipeDialog";

const CATEGORIES = ["Alla", "Kött", "Fisk & skaldjur", "Vegetariskt", "Pasta", "Mejeri", "Svamp & vilt"];

const CAT_GRADIENT: Record<string, string> = {
  "Kött":           "linear-gradient(135deg,#ef4444,#b91c1c)",
  "Fisk & skaldjur":"linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "Vegetariskt":    "linear-gradient(135deg,#16a34a,#14532d)",
  "Pasta":          "linear-gradient(135deg,#d97706,#92400e)",
  "Mejeri":         "linear-gradient(135deg,#c9a84c,#a37a30)",
  "Svamp & vilt":   "linear-gradient(135deg,#7c3aed,#4c1d95)",
  "Desserter":      "linear-gradient(135deg,#db2777,#9d174d)",
  "Frukost":        "linear-gradient(135deg,#ea580c,#9a3412)",
  "Förrätter":      "linear-gradient(135deg,#0891b2,#164e63)",
  "Huvudrätter":    "linear-gradient(135deg,hsl(17 47% 22%),hsl(17 47% 13%))",
};

function marginStyle(pct: number) {
  if (pct > 60) return { color: "#16a34a" };
  if (pct > 45) return { color: "#d97706" };
  return { color: "#dc2626" };
}

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { ...(search ? { search } : {}), ...(category ? { category } : {}) };
  const recipes = useListRecipes(params, { query: { queryKey: getListRecipesQueryKey(params) } });
  const deleteRecipe = useDeleteRecipe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        toast({ title: "Recept borttaget" });
      },
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>Recept</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Din privata kokbok med kostnadskalkyl</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
          <Plus className="w-4 h-4" /> Nytt recept
        </button>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
          <input
            placeholder="Sök recept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
            style={{
              background: "var(--sv-muted)",
              color: "var(--sv-text)",
              border: "1.5px solid var(--sv-border)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = category === (cat === "Alla" ? "" : cat);
            return (
              <button key={cat} onClick={() => setCategory(cat === "Alla" ? "" : cat)}
                className="px-3.5 py-2 rounded-full text-[12px] font-medium transition-all"
                style={active ? {
                  background: "var(--sv-brown)", color: "var(--sv-surface)",
                  boxShadow: "0 2px 8px var(--sv-shadow)",
                } : {
                  background: "var(--sv-muted)", color: "var(--sv-text-2)",
                }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {recipes.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : recipes.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--sv-muted)" }}>
            <ChefHat className="w-8 h-8" style={{ color: "var(--sv-text-2)" }} />
          </div>
          <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Inga recept hittades</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Lägg till ditt första recept ovan</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(recipes.data ?? []).map((recipe) => {
            const mg = marginStyle(recipe.profitMarginPct);
            const catGrad = CAT_GRADIENT[recipe.category] ?? "linear-gradient(135deg,hsl(17 47% 20%),hsl(17 47% 13%))";
            return (
              <div key={recipe.id}
                className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                <div className="h-2 shrink-0" style={{ background: catGrad }} />
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-[15px] leading-snug" style={{ color: "var(--sv-text)" }}>
                        {recipe.name}
                      </h3>
                      {recipe.description && (
                        <p className="text-[12px] mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
                          {recipe.description}
                        </p>
                      )}
                    </div>
                    {recipe.isShared && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(16,163,74,.12)", color: "#16a34a" }}>Delat</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Kostnad", value: `${recipe.totalCostSek.toFixed(0)} kr`, style: {} },
                      { label: "Pris",    value: `${recipe.sellingPriceSek.toFixed(0)} kr`, style: {} },
                      { label: "Marginal", value: `${recipe.profitMarginPct.toFixed(1)}%`, style: mg },
                    ].map(({ label, value, style }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "var(--sv-muted)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--sv-text-2)" }}>{label}</p>
                        <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)", ...style }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                      {recipe.category}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/recipes/${recipe.id}`}>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: "var(--sv-text-2)" }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: "#dc2626" }}
                        onClick={() => deleteRecipe.mutate({ id: recipe.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddRecipeDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
