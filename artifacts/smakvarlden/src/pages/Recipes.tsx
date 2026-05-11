import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useListRecipes, useDeleteRecipe, useCreateRecipe, getListRecipesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, ChefHat, Globe, Clock, Upload, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecipeDialog } from "@/components/AddRecipeDialog";
import { ImportDialog, type CsvRow } from "@/components/ImportDialog";
import { useI18n, RECIPE_CATEGORIES, DIET_CATEGORIES, ALLERGY_CATEGORIES } from "@/lib/i18n";
import { apiFetch, useAuth } from "@/lib/auth";
import { RecipeSheet } from "@/components/RecipeSheet";
import { getRecipeImage } from "@/lib/foodImages";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_GRADIENT: Record<string, string> = {
  "Huvudrätter":    "linear-gradient(135deg,hsl(17 47% 22%),hsl(17 47% 13%))",
  "Sallader":       "linear-gradient(135deg,#16a34a,#14532d)",
  "Såser":          "linear-gradient(135deg,#d97706,#92400e)",
  "Dressingar":     "linear-gradient(135deg,#c9a84c,#a37a30)",
  "Desserter":      "linear-gradient(135deg,#db2777,#9d174d)",
  "Soppor":         "linear-gradient(135deg,#0891b2,#164e63)",
  "Förrätter":      "linear-gradient(135deg,#7c3aed,#4c1d95)",
  "Specialkost":    "linear-gradient(135deg,#f97316,#7c2d12)",
  "Veganskt":       "linear-gradient(135deg,#22c55e,#14532d)",
  "Vegetariskt":    "linear-gradient(135deg,#84cc16,#365314)",
  "Glutenfri":      "linear-gradient(135deg,#e8c840,#9a7c10)",
  "Laktosfri":      "linear-gradient(135deg,#38bdf8,#075985)",
  "Mjölkfri":       "linear-gradient(135deg,#a78bfa,#4c1d95)",
  "Äggfri":         "linear-gradient(135deg,#fb923c,#7c2d12)",
  "Nötfri":         "linear-gradient(135deg,#f43f5e,#881337)",
  "Fisk/skaldjursfri": "linear-gradient(135deg,#2dd4bf,#134e4a)",
};

function marginStyle(pct: number) {
  if (pct > 60) return { color: "#16a34a" };
  if (pct > 45) return { color: "#d97706" };
  return { color: "#dc2626" };
}

interface SpoonRecipe {
  id: number; title: string; image: string; readyInMinutes: number;
  cuisines: string[]; diets: string[];
}

function useSpoonSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<SpoonRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !query.trim()) { setResults([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${BASE}/api/spoonacular/recipes/search?query=${encodeURIComponent(query)}&number=12`);
        if (r.ok) { const d = await r.json(); setResults(d.results ?? []); }
      } finally { setLoading(false); }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, enabled]);

  return { results, loading };
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap"
      style={active ? {
        background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)",
      } : { background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
      {label}
    </button>
  );
}

export default function Recipes() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [tab, setTab] = useState<"mine" | "world">("mine");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [spoonQuery, setSpoonQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [sheetRecipeId, setSheetRecipeId] = useState<number | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = { ...(search ? { search } : {}), ...(category ? { category } : {}) };
  const recipes = useListRecipes(params, { query: { queryKey: getListRecipesQueryKey(params) } });
  const deleteRecipe = useDeleteRecipe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        toast({ title: t("Recept borttaget") });
      },
    },
  });
  const createRecipe = useCreateRecipe();
  const { results: spoonResults, loading: spoonLoading } = useSpoonSearch(spoonQuery, tab === "world");

  async function seedDemoData() {
    setSeedingDemo(true);
    try {
      const result = await apiFetch("/demo/seed", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
      toast({
        title: t("Demodata laddad"),
        description: `${result.ingredientsCreated ?? 0} ${t("ingredienser")} · ${result.recipesCreated ?? 0} ${t("recept")}`,
      });
    } catch (error) {
      toast({
        title: t("Fel uppstod."),
        description: error instanceof Error ? error.message : t("Något gick fel."),
        variant: "destructive",
      });
    } finally {
      setSeedingDemo(false);
    }
  }

  async function handleImport(rows: CsvRow[]) {
    for (const row of rows) {
      await createRecipe.mutateAsync({
        data: {
          name: row["name"] || row["namn"] || "Okänt recept",
          description: row["description"] || row["beskrivning"] || undefined,
          category: row["category"] || row["kategori"] || "Huvudrätter",
          servings: parseInt(row["servings"] || row["portioner"] || "4") || 4,
          sellingPriceSek: parseFloat(row["selling_price"] || row["pris"] || "0") || 0,
        },
      });
    }
    queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
    toast({ title: `${rows.length} ${t("rader importerade")}` });
  }

  const filterSections = [
    { key: "type",    label: t("Recepttyp"), cats: ["Alla", ...RECIPE_CATEGORIES] },
    { key: "diet",    label: t("Kost"),      cats: DIET_CATEGORIES },
    { key: "allergy", label: t("Allergi"),   cats: ALLERGY_CATEGORIES },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>
            {t("Recept")}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>
            {tab === "mine" ? t("Din privata kokbok med kostnadskalkyl") : t("Sök bland miljoner recept från hela världen")}
          </p>
        </div>
        {tab === "mine" && user && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)", border: "1.5px solid var(--sv-border)" }}>
              <Upload className="w-4 h-4" /> {t("Importera")}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
              <Plus className="w-4 h-4" /> {t("Nytt recept")}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
        {([["mine", ChefHat, t("Mina recept")], ["world", Globe, t("Hitta recept")]] as const).map(([tab2, Icon, label]) => (
          <button key={tab2} onClick={() => setTab(tab2)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={tab === tab2 ? {
              background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)",
            } : { color: "var(--sv-text-2)" }}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "mine" && !user ? (
        /* ── Guest login wall ── */
        <div className="flex flex-col items-center justify-center py-28 text-center rounded-2xl"
          style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(201,168,76,.15)" }}>
            <Lock className="w-8 h-8" style={{ color: "var(--sv-gold)" }} />
          </div>
          <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "var(--sv-text)" }}>{t("Logga in för din kokbok")}</h3>
          <p className="text-[13px] mb-6 max-w-sm" style={{ color: "var(--sv-text-2)" }}>
            {t("Skapa, redigera och kalkylera dina egna recept.")}
          </p>
          <Link href="/login"
            className="px-6 py-3 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
            {t("Logga in")}
          </Link>
        </div>
      ) : tab === "mine" ? (
        <>
          {/* Filter bar */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
              <input
                placeholder={t("Sök recept...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            {/* Category group filters */}
            {filterSections.map(({ key, label, cats }) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest pt-2 shrink-0 w-16 text-right"
                  style={{ color: "var(--sv-gold)" }}>
                  {label}
                </span>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {cats.map((cat) => (
                    <FilterPill
                      key={cat}
                      label={t(cat)}
                      active={category === (cat === "Alla" ? "" : cat)}
                      onClick={() => setCategory(cat === "Alla" ? "" : cat)}
                    />
                  ))}
                </div>
              </div>
            ))}
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
              <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Inga recept hittades")}</p>
              <p className="text-[13px] mt-1 mb-5 max-w-sm" style={{ color: "var(--sv-text-2)" }}>{t("Lägg till ditt första recept ovan")}</p>
              <button
                onClick={seedDemoData}
                disabled={seedingDemo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}
              >
                <Sparkles className="w-4 h-4" />
                {seedingDemo ? t("Laddar demodata...") : t("Ladda svensk demodata")}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(recipes.data ?? []).map((recipe) => {
                const mg = marginStyle(recipe.profitMarginPct);
                const catGrad = CAT_GRADIENT[recipe.category] ?? "linear-gradient(135deg,hsl(17 47% 20%),hsl(17 47% 13%))";
                return (
                  <div key={recipe.id}
                    className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                    style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}
                    onClick={() => setSheetRecipeId(recipe.id)}>
                    <div className="relative h-36 shrink-0 overflow-hidden" style={{ background: catGrad }}>
                      <img
                        src={getRecipeImage(recipe.name, recipe.category)}
                        alt={recipe.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ background: "rgba(0,0,0,.35)", backdropFilter: "blur(8px)" }}>
                        {t(recipe.category)}
                      </span>
                    </div>
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
                            style={{ background: "rgba(16,163,74,.12)", color: "#16a34a" }}>{t("Delat")}</span>
                        )}
                      </div>

                      {recipe.ingredientNames && recipe.ingredientNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredientNames.map((name) => (
                            <span key={name} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)", border: "1px solid var(--sv-border)" }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: t("Kostnad"),  value: `${recipe.totalCostSek.toFixed(0)} kr`,    style: {} },
                          { label: t("Pris"),     value: `${recipe.sellingPriceSek.toFixed(0)} kr`, style: {} },
                          { label: t("Marginal"), value: `${recipe.profitMarginPct.toFixed(1)}%`,   style: mg },
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
                          {recipe.servings} {t("portioner")}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ color: "#dc2626" }}
                            onClick={(e) => { e.stopPropagation(); deleteRecipe.mutate({ id: recipe.id }); }}>
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
        /* ── Spoonacular ── */
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
            <input
              placeholder={t("Sök recept på engelska, t.ex. pasta, chicken, salad...")}
              value={spoonQuery}
              onChange={(e) => setSpoonQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none"
              style={{ background: "var(--sv-surface)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 2px 8px var(--sv-shadow)" }}
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
              <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Inga recept hittades")}</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t("Försök med ett annat sökord")}</p>
            </div>
          )}

          {!spoonLoading && !spoonQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--sv-muted)" }}>
                <Globe className="w-8 h-8" style={{ color: "var(--sv-text-2)" }} />
              </div>
              <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Sök bland miljoner recept")}</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t("Skriv något i sökfältet ovan")}</p>
            </div>
          )}

          {!spoonLoading && spoonResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spoonResults.map((r) => (
                <div key={r.id}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                  style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                  {r.image && (
                    <img src={r.image} alt={r.title} className="w-full h-36 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-serif font-semibold text-[14px] leading-snug line-clamp-2" style={{ color: "var(--sv-text)" }}>
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
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        title={t("Importera recept")}
        expectedHeaders={["name", "description", "category", "servings", "selling_price"]}
        example={"Pasta Carbonara,Klassisk pasta,Huvudrätter,4,185"}
        onImport={handleImport}
      />
      <RecipeSheet recipeId={sheetRecipeId} onClose={() => setSheetRecipeId(null)} />
    </div>
  );
}
