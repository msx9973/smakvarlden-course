import { Link } from "wouter";
import { useGetRecipe, getGetRecipeQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Leaf } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getIngredientImage, getRecipeImage } from "@/lib/foodImages";

export default function RecipeDetail({ id }: { id: number }) {
  const { t } = useI18n();
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
        <p className="text-base font-serif font-semibold">{t("Receptet hittades inte")}</p>
        <Link href="/recipes">
          <Button variant="link" className="mt-2">{t("Tillbaka till recept")}</Button>
        </Link>
      </div>
    );
  }

  const r = recipe.data;
  const margin = r.profitMarginPct;
  const marginColor = margin > 60 ? "text-emerald-600" : margin > 45 ? "text-amber-600" : "text-red-500";
  const profitSek = r.sellingPriceSek - r.totalCostSek;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Back */}
      <div>
        <Link href="/recipes">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4 text-muted-foreground rounded-lg">
            <ArrowLeft className="w-4 h-4" /> {t("Tillbaka till recept")}
          </Button>
        </Link>
        <div className="relative overflow-hidden rounded-xl p-6 min-h-64 flex items-end card-shadow"
          style={{ background: "linear-gradient(135deg,hsl(17 47% 13%),hsl(17 37% 20%))" }}>
          <img
            src={getRecipeImage(r.name, r.category)}
            alt={r.name}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
          <div className="relative flex items-end justify-between gap-4 w-full">
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-white">{r.name}</h1>
              {r.description && <p className="text-white/75 mt-1.5 text-sm leading-relaxed max-w-xl">{r.description}</p>}
            </div>
            <Badge variant="outline" className="rounded-lg shrink-0 bg-white/10 text-white border-white/25">{t(r.category)}</Badge>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("Portioner"),        value: r.servings,                           color: "text-foreground" },
          { label: t("Kostnad"),          value: `${r.totalCostSek.toFixed(0)} kr`,    color: "text-foreground" },
          { label: t("Försäljningspris"), value: `${r.sellingPriceSek.toFixed(0)} kr`, color: "text-foreground" },
          { label: t("Marginal"),         value: `${margin.toFixed(1)}%`,              color: marginColor },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-card-border rounded-xl p-4 text-center card-shadow">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{m.label}</p>
            <p className={`text-2xl font-serif font-bold mt-1.5 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Profitability */}
      <div className="bg-card border border-card-border rounded-xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h2 className="text-base font-serif font-semibold">{t("Lönsamhetskalkyl")}</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { label: t("Råvarukostnad"),       val: `${r.totalCostSek.toFixed(2)} kr`,                  cls: "" },
            { label: t("Kostnad per portion"),  val: `${(r.totalCostSek / r.servings).toFixed(2)} kr`,  cls: "" },
            { label: t("Försäljningspris"),     val: `${r.sellingPriceSek.toFixed(2)} kr`,              cls: "" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`font-medium ${row.cls}`}>{row.val}</span>
            </div>
          ))}
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between text-sm font-semibold">
            <span>{t("Bruttovinst")}</span>
            <span className={profitSek > 0 ? "text-emerald-600" : "text-red-500"}>
              {profitSek > 0 ? "+" : ""}{profitSek.toFixed(2)} kr
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>{t("Vinstmarginal")}</span>
            <span className={marginColor}>{margin.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      {r.ingredients && r.ingredients.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Leaf className="w-3 h-3 text-emerald-600" />
            </div>
            <h2 className="text-base font-serif font-semibold">{t("Ingredienser")}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Ingrediens")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Mängd")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Styckpris")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Kostnad")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {r.ingredients.map((ing) => (
                <tr key={ing.ingredientId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={getIngredientImage(ing.ingredientName)}
                          alt={ing.ingredientName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      {ing.ingredientName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{ing.quantity} {ing.unit}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{ing.unitPriceSek.toFixed(2)} kr</td>
                  <td className="px-4 py-3 text-right font-semibold">{ing.lineCostSek.toFixed(2)} kr</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td colSpan={3} className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">{t("Totalt")}</td>
                <td className="px-4 py-3 text-right font-bold">{r.totalCostSek.toFixed(2)} kr</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
