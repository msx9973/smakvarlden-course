import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useListRecipes, useDeleteRecipe, getListRecipesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, ExternalLink, ChefHat, Globe, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecipeDialog } from "@/components/AddRecipeDialog";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SpoonRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  cuisines: string[];
  diets: string[];
  summary: string;
}

function useSpoonSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<SpoonRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${BASE}/api/spoonacular/recipes/search?query=${encodeURIComponent(query)}&number=12`);
        if (r.ok) {
          const data = await r.json();
          setResults(data.results ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, enabled]);

  return { results, loading };
}

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
  const [tab, setTab] = useState<"mine" | "world">("mine");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [spoonQuery, setSpoonQuery] = useState("");
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

  const { results: spoonResults, loading: spoonLoading } = useSpoonSearch(spoonQuery, tab === "world");

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>Recept</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>
            {tab === "mine" ? "Din privata kokbok med kostnadskalkyl" : "Sök bland miljoner recept från hela världen"}
          </p>
        </div>
        {tab === "mine" && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
            <Plus className="w-4 h-4" /> Nytt recept
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
        {([["mine", ChefHat, "Mina recept"], ["world", Globe, "Hitta recept"]] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={tab === t ? {
              background: "var(--sv-brown)", color: "var(--sv-surface)",
              boxShadow: "0 2px 8px var(--sv-shadow)",
            } : {
              color: "var(--sv-text-2)",
            }}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <>
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
        </>
      ) : (
        /* ── Spoonacular search ── */
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
            <input
              placeholder="Sök recept på engelska, t.ex. pasta, chicken, salad..."
              value={spoonQuery}
              onChange={(e) => setSpoonQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all"
              style={{
                background: "var(--sv-surface)",
                color: "var(--sv-text)",
                border: "1.5px solid var(--sv-border)",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 8px var(--sv-shadow)",
              }}
            />
          </div>

          {spoonLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          )}

          {!spoonLoading && spoonQuery.trim() && spoonResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Globe className="w-10 h-10 mb-3" style={{ color: "var(--sv-text-2)" }} />
              <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Inga recept hittades</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Försök med ett annat sökord</p>
            </div>
          )}

          {!spoonLoading && !spoonQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--sv-muted)" }}>
                <Globe className="w-8 h-8" style={{ color: "var(--sv-text-2)" }} />
              </div>
              <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>Sök bland miljoner recept</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>Skriv något i sökfältet ovan</p>
            </div>
          )}

          {!spoonLoading && spoonResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spoonResults.map((r) => (
                <div key={r.id}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                  style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                  {r.image && (
                    <img src={r.image} alt={r.title}
                      className="w-full h-36 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-serif font-semibold text-[14px] leading-snug line-clamp-2"
                      style={{ color: "var(--sv-text)" }}>
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <Clock className="w-3 h-3 shrink-0" style={{ color: "var(--sv-text-2)" }} />
                      <span className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{r.readyInMinutes} min</span>
                      {r.cuisines?.[0] && (
                        <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                          {r.cuisines[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddRecipeDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
