import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useListRecipes, useDeleteRecipe, getListRecipesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, ExternalLink, ChefHat, Languages, ShieldCheck, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddRecipeDialog } from "@/components/AddRecipeDialog";

const CATEGORIES = ["Alla", "Huvudratter", "Sallader", "Saser", "Dressingar", "Desserter", "Veganskt", "Vegetariskt", "Soppor", "Forratter"];
const DIET_FILTERS = ["Veganskt", "Vegetariskt", "Glutenfri", "Laktosfri"];
const ALLERGY_FILTERS = ["Glutenfri", "Mjolkfri", "Aggfri", "Notfri", "Fisk/skaldjursfri"];
const LANGUAGES = [
  { code: "sv", label: "SV" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "fi", label: "FI" },
] as const;
type LanguageCode = (typeof LANGUAGES)[number]["code"];

const COPY = {
  sv: {
    title: "Recept",
    subtitle: "Din privata kokbok med kostnad, sprakversioner och allergianpassningar",
    add: "Nytt recept",
    search: "Sok recept...",
    all: "Alla",
    language: "Sprak",
    diet: "Specialkost",
    allergy: "Allergi",
    cost: "Kostnad",
    price: "Pris",
    margin: "Marginal",
    shared: "Delat",
    noResults: "Inga recept hittades",
    noResultsHint: "Prova en annan sokning eller filter",
    allergens: "Allergener",
    allergyVersions: "Allergiversioner",
  },
  en: {
    title: "Recipes",
    subtitle: "Your private cookbook with costs, language versions and allergy adaptations",
    add: "New recipe",
    search: "Search recipes...",
    all: "All",
    language: "Language",
    diet: "Diet",
    allergy: "Allergy",
    cost: "Cost",
    price: "Price",
    margin: "Margin",
    shared: "Shared",
    noResults: "No recipes found",
    noResultsHint: "Try another search or filter",
    allergens: "Allergens",
    allergyVersions: "Allergy versions",
  },
  es: {
    title: "Recetas",
    subtitle: "Tu recetario privado con costes, idiomas y versiones para alergias",
    add: "Nueva receta",
    search: "Buscar recetas...",
    all: "Todas",
    language: "Idioma",
    diet: "Dieta",
    allergy: "Alergia",
    cost: "Coste",
    price: "Precio",
    margin: "Margen",
    shared: "Compartida",
    noResults: "No se encontraron recetas",
    noResultsHint: "Prueba otra busqueda o filtro",
    allergens: "Alergenos",
    allergyVersions: "Versiones para alergias",
  },
  de: {
    title: "Rezepte",
    subtitle: "Dein privates Kochbuch mit Kosten, Sprachen und Allergieversionen",
    add: "Neues Rezept",
    search: "Rezepte suchen...",
    all: "Alle",
    language: "Sprache",
    diet: "Ernahrung",
    allergy: "Allergie",
    cost: "Kosten",
    price: "Preis",
    margin: "Marge",
    shared: "Geteilt",
    noResults: "Keine Rezepte gefunden",
    noResultsHint: "Versuche eine andere Suche oder einen Filter",
    allergens: "Allergene",
    allergyVersions: "Allergieversionen",
  },
  fr: {
    title: "Recettes",
    subtitle: "Votre carnet prive avec couts, langues et versions allergenes",
    add: "Nouvelle recette",
    search: "Chercher des recettes...",
    all: "Toutes",
    language: "Langue",
    diet: "Regime",
    allergy: "Allergie",
    cost: "Cout",
    price: "Prix",
    margin: "Marge",
    shared: "Partagee",
    noResults: "Aucune recette trouvee",
    noResultsHint: "Essayez une autre recherche ou un filtre",
    allergens: "Allergenes",
    allergyVersions: "Versions allergenes",
  },
  fi: {
    title: "Reseptit",
    subtitle: "Oma keittokirja kustannuksilla, kielilla ja allergiaversioilla",
    add: "Uusi resepti",
    search: "Hae resepteja...",
    all: "Kaikki",
    language: "Kieli",
    diet: "Ruokavalio",
    allergy: "Allergia",
    cost: "Kulu",
    price: "Hinta",
    margin: "Kate",
    shared: "Jaettu",
    noResults: "Resepteja ei loytynyt",
    noResultsHint: "Kokeile toista hakua tai suodatinta",
    allergens: "Allergeenit",
    allergyVersions: "Allergiaversiot",
  },
} as const;

const CAT_GRADIENT: Record<string, string> = {
  "Huvudratter": "linear-gradient(135deg,hsl(17 47% 22%),hsl(17 47% 13%))",
  "Forratter": "linear-gradient(135deg,#0891b2,#164e63)",
  "Sallader": "linear-gradient(135deg,#22c55e,#15803d)",
  "Saser": "linear-gradient(135deg,#f59e0b,#b45309)",
  "Dressingar": "linear-gradient(135deg,#14b8a6,#0f766e)",
  "Vegetariskt": "linear-gradient(135deg,#16a34a,#14532d)",
  "Veganskt": "linear-gradient(135deg,#059669,#065f46)",
  "Desserter": "linear-gradient(135deg,#db2777,#9d174d)",
  "Soppor": "linear-gradient(135deg,#6366f1,#3730a3)",
  "Frukost": "linear-gradient(135deg,#ea580c,#9a3412)",
};

function marginStyle(pct: number) {
  if (pct > 60) return { color: "#16a34a" };
  if (pct > 45) return { color: "#d97706" };
  return { color: "#dc2626" };
}

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [diet, setDiet] = useState("");
  const [allergy, setAllergy] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("sv");
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = COPY[language];

  const params = { ...(search ? { search } : {}), ...(category ? { category } : {}) };
  const recipes = useListRecipes(params, { query: { queryKey: getListRecipesQueryKey(params) } });
  const visibleRecipes = useMemo(() => {
    return (recipes.data ?? []).filter((recipe) => {
      if (diet && !(recipe.dietaryTags ?? []).includes(diet)) return false;
      if (allergy && !(recipe.allergyVersions ?? []).includes(allergy)) return false;
      return true;
    });
  }, [allergy, diet, recipes.data]);

  const deleteRecipe = useDeleteRecipe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        toast({ title: language === "sv" ? "Recept borttaget" : "Recipe deleted" });
      },
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>{t.title}</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--sv-muted)" }}>
            <Languages className="w-4 h-4 ml-2" style={{ color: "var(--sv-text-2)" }} />
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                style={language === code ? { background: "var(--sv-surface)", color: "var(--sv-text)", boxShadow: "0 1px 4px var(--sv-shadow)" } : { color: "var(--sv-text-2)" }}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
            <Plus className="w-4 h-4" /> {t.add}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 flex flex-col gap-4"
        style={{ background: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--sv-text-2)" }} />
            <input
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
              style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const value = cat === "Alla" ? "" : cat;
              const active = category === value;
              return (
                <button key={cat} onClick={() => setCategory(value)}
                  className="px-3.5 py-2 rounded-full text-[12px] font-medium transition-all"
                  style={active ? { background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 2px 8px var(--sv-shadow)" } : { background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
                  {cat === "Alla" ? t.all : cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <FilterGroup icon={<Leaf className="w-3.5 h-3.5" />} label={t.diet} filters={DIET_FILTERS} active={diet} onChange={setDiet} />
          <FilterGroup icon={<ShieldCheck className="w-3.5 h-3.5" />} label={t.allergy} filters={ALLERGY_FILTERS} active={allergy} onChange={setAllergy} />
        </div>
      </div>

      {recipes.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : visibleRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--sv-muted)" }}>
            <ChefHat className="w-8 h-8" style={{ color: "var(--sv-text-2)" }} />
          </div>
          <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t.noResults}</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--sv-text-2)" }}>{t.noResultsHint}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((recipe) => {
            const mg = marginStyle(recipe.profitMarginPct);
            const catGrad = CAT_GRADIENT[recipe.category] ?? "linear-gradient(135deg,hsl(17 47% 20%),hsl(17 47% 13%))";
            const text = recipe.languageVersions?.[language] ?? { name: recipe.name, description: recipe.description ?? "" };
            return (
              <div key={recipe.id}
                className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
                <div className="h-2 shrink-0" style={{ background: catGrad }} />
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-[15px] leading-snug" style={{ color: "var(--sv-text)" }}>{text.name}</h3>
                      {text.description && <p className="text-[12px] mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{text.description}</p>}
                    </div>
                    {recipe.isShared && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(16,163,74,.12)", color: "#16a34a" }}>{t.shared}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(recipe.dietaryTags ?? []).slice(0, 3).map((tag) => <BadgePill key={tag} label={tag} tone="green" />)}
                    {(recipe.allergyVersions ?? []).slice(0, 2).map((tag) => <BadgePill key={tag} label={tag} tone="blue" />)}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t.cost, value: `${recipe.totalCostSek.toFixed(0)} kr`, style: {} },
                      { label: t.price, value: `${recipe.sellingPriceSek.toFixed(0)} kr`, style: {} },
                      { label: t.margin, value: `${recipe.profitMarginPct.toFixed(1)}%`, style: mg },
                    ].map(({ label, value, style }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "var(--sv-muted)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--sv-text-2)" }}>{label}</p>
                        <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)", ...style }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
                    <span className="font-semibold">{t.allergens}:</span> {(recipe.allergens ?? []).length ? recipe.allergens?.join(", ") : "Inga markerade"}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>{recipe.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/recipes/${recipe.id}`}>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: "var(--sv-text-2)" }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: "#dc2626" }} onClick={() => deleteRecipe.mutate({ id: recipe.id })}>
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

function FilterGroup({ icon, label, filters, active, onChange }: { icon: ReactNode; label: string; filters: string[]; active: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mr-1" style={{ color: "var(--sv-text-2)" }}>{icon}{label}</span>
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(active === filter ? "" : filter)}
          className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
          style={active === filter ? { background: "var(--sv-brown)", color: "var(--sv-surface)" } : { background: "var(--sv-muted)", color: "var(--sv-text-2)" }}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function BadgePill({ label, tone }: { label: string; tone: "green" | "blue" }) {
  const style = tone === "green"
    ? { background: "rgba(22,163,74,.12)", color: "#15803d" }
    : { background: "rgba(37,99,235,.10)", color: "#2563eb" };
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={style}>{label}</span>;
}
