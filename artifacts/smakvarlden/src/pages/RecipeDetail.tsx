import { useState } from "react";
import { Link } from "wouter";
import { useGetRecipe, getGetRecipeQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Leaf, Languages, ShieldCheck } from "lucide-react";

const LANGUAGES = [
  { code: "sv", label: "SV" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "fi", label: "FI" },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]["code"];

const DETAIL_COPY: Record<LanguageCode, {
  back: string;
  notFound: string;
  panelTitle: string;
  diet: string;
  allergens: string;
  versions: string;
  noTags: string;
  noneMarked: string;
  manual: string;
  servings: string;
  cost: string;
  price: string;
  margin: string;
  profitTitle: string;
  rawCost: string;
  portionCost: string;
  grossProfit: string;
  ingredients: string;
  ingredient: string;
  amount: string;
  unitPrice: string;
  total: string;
}> = {
  sv: { back: "Tillbaka till recept", notFound: "Receptet hittades inte", panelTitle: "Sprak och allergiversioner", diet: "Specialkost", allergens: "Allergener", versions: "Mojliga versioner", noTags: "Ingen markering", noneMarked: "Inga markerade", manual: "Kontrollera manuellt", servings: "Portioner", cost: "Kostnad", price: "Forsaljningspris", margin: "Marginal", profitTitle: "Lonsamhetskalkyl", rawCost: "Ravarukostnad", portionCost: "Kostnad per portion", grossProfit: "Bruttovinst", ingredients: "Ingredienser", ingredient: "Ingrediens", amount: "Mangd", unitPrice: "Styckpris", total: "Totalt" },
  en: { back: "Back to recipes", notFound: "Recipe not found", panelTitle: "Language and allergy versions", diet: "Diet", allergens: "Allergens", versions: "Possible versions", noTags: "No tags", noneMarked: "None marked", manual: "Check manually", servings: "Servings", cost: "Cost", price: "Selling price", margin: "Margin", profitTitle: "Profitability", rawCost: "Raw ingredient cost", portionCost: "Cost per serving", grossProfit: "Gross profit", ingredients: "Ingredients", ingredient: "Ingredient", amount: "Amount", unitPrice: "Unit price", total: "Total" },
  es: { back: "Volver a recetas", notFound: "Receta no encontrada", panelTitle: "Idioma y versiones para alergias", diet: "Dieta", allergens: "Alergenos", versions: "Versiones posibles", noTags: "Sin marcas", noneMarked: "Ninguno", manual: "Revisar manualmente", servings: "Raciones", cost: "Coste", price: "Precio de venta", margin: "Margen", profitTitle: "Rentabilidad", rawCost: "Coste de ingredientes", portionCost: "Coste por racion", grossProfit: "Beneficio bruto", ingredients: "Ingredientes", ingredient: "Ingrediente", amount: "Cantidad", unitPrice: "Precio unitario", total: "Total" },
  de: { back: "Zuruck zu Rezepten", notFound: "Rezept nicht gefunden", panelTitle: "Sprache und Allergieversionen", diet: "Ernahrung", allergens: "Allergene", versions: "Mogliche Versionen", noTags: "Keine Markierung", noneMarked: "Keine", manual: "Manuell prufen", servings: "Portionen", cost: "Kosten", price: "Verkaufspreis", margin: "Marge", profitTitle: "Rentabilitat", rawCost: "Wareneinsatz", portionCost: "Kosten pro Portion", grossProfit: "Bruttogewinn", ingredients: "Zutaten", ingredient: "Zutat", amount: "Menge", unitPrice: "Stuckpreis", total: "Gesamt" },
  fr: { back: "Retour aux recettes", notFound: "Recette introuvable", panelTitle: "Langue et versions allergenes", diet: "Regime", allergens: "Allergenes", versions: "Versions possibles", noTags: "Aucun tag", noneMarked: "Aucun", manual: "Verifier manuellement", servings: "Portions", cost: "Cout", price: "Prix de vente", margin: "Marge", profitTitle: "Rentabilite", rawCost: "Cout matieres", portionCost: "Cout par portion", grossProfit: "Marge brute", ingredients: "Ingredients", ingredient: "Ingredient", amount: "Quantite", unitPrice: "Prix unitaire", total: "Total" },
  fi: { back: "Takaisin resepteihin", notFound: "Reseptia ei loytynyt", panelTitle: "Kieli ja allergiaversiot", diet: "Ruokavalio", allergens: "Allergeenit", versions: "Mahdolliset versiot", noTags: "Ei merkintoja", noneMarked: "Ei merkintoja", manual: "Tarkista kasin", servings: "Annokset", cost: "Kulu", price: "Myyntihinta", margin: "Kate", profitTitle: "Kannattavuus", rawCost: "Raaka-ainekulu", portionCost: "Kulu per annos", grossProfit: "Bruttovoitto", ingredients: "Ainekset", ingredient: "Aines", amount: "Maara", unitPrice: "Yksikkohinta", total: "Yhteensa" },
};

export default function RecipeDetail({ id }: { id: number }) {
  const [language, setLanguage] = useState<LanguageCode>("sv");
  const t = DETAIL_COPY[language];
  const recipe = useGetRecipe(id, { query: { queryKey: getGetRecipeQueryKey(id), enabled: !!id } });

  if (recipe.isLoading) {
    return (
      <div className="max-w-3xl flex flex-col gap-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-6 w-64 rounded-lg" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!recipe.data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-base font-serif font-semibold">{t.notFound}</p>
        <Link href="/recipes">
          <Button variant="link" className="mt-2">{t.back}</Button>
        </Link>
      </div>
    );
  }

  const r = recipe.data;
  const margin = r.profitMarginPct;
  const marginColor = margin > 60 ? "text-emerald-600" : margin > 45 ? "text-amber-600" : "text-red-500";
  const profitSek = r.sellingPriceSek - r.totalCostSek;
  const text = r.languageVersions?.[language] ?? { name: r.name, description: r.description ?? "" };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/recipes">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4 text-muted-foreground rounded-lg">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">{text.name}</h1>
            {text.description && <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{text.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="rounded-lg shrink-0">{r.category}</Badge>
            <div className="flex items-center gap-1 rounded-full border border-border p-1">
              <Languages className="w-3.5 h-3.5 text-muted-foreground ml-1" />
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold ${language === code ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-base font-serif font-semibold">{t.panelTitle}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoBlock title={t.diet} items={r.dietaryTags ?? []} empty={t.noTags} />
          <InfoBlock title={t.allergens} items={r.allergens ?? []} empty={t.noneMarked} />
          <InfoBlock title={t.versions} items={r.allergyVersions ?? []} empty={t.manual} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.servings, value: r.servings, color: "text-foreground" },
          { label: t.cost, value: `${r.totalCostSek.toFixed(0)} kr`, color: "text-foreground" },
          { label: t.price, value: `${r.sellingPriceSek.toFixed(0)} kr`, color: "text-foreground" },
          { label: t.margin, value: `${margin.toFixed(1)}%`, color: marginColor },
        ].map((metric) => (
          <div key={metric.label} className="bg-card border border-card-border rounded-xl p-4 text-center card-shadow">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{metric.label}</p>
            <p className={`text-2xl font-serif font-bold mt-1.5 ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h2 className="text-base font-serif font-semibold">{t.profitTitle}</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { label: t.rawCost, val: `${r.totalCostSek.toFixed(2)} kr` },
            { label: t.portionCost, val: `${(r.totalCostSek / r.servings).toFixed(2)} kr` },
            { label: t.price, val: `${r.sellingPriceSek.toFixed(2)} kr` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.val}</span>
            </div>
          ))}
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between text-sm font-semibold">
            <span>{t.grossProfit}</span>
            <span className={profitSek > 0 ? "text-emerald-600" : "text-red-500"}>
              {profitSek > 0 ? "+" : ""}{profitSek.toFixed(2)} kr
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>{t.margin}</span>
            <span className={marginColor}>{margin.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {r.ingredients && r.ingredients.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Leaf className="w-3 h-3 text-emerald-600" />
            </div>
            <h2 className="text-base font-serif font-semibold">{t.ingredients}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.ingredient}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.amount}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.unitPrice}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.cost}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {r.ingredients.map((ing) => (
                <tr key={ing.ingredientId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{ing.ingredientName}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{ing.quantity} {ing.unit}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{ing.unitPriceSek.toFixed(2)} kr</td>
                  <td className="px-4 py-3 text-right font-semibold">{ing.lineCostSek.toFixed(2)} kr</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td colSpan={3} className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">{t.total}</td>
                <td className="px-4 py-3 text-right font-bold">{r.totalCostSek.toFixed(2)} kr</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl p-3 bg-muted/40">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length
          ? items.map((item) => <Badge key={item} variant="secondary" className="rounded-full text-[11px]">{item}</Badge>)
          : <span className="text-xs text-muted-foreground">{empty}</span>}
      </div>
    </div>
  );
}
