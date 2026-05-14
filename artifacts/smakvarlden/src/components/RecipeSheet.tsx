import { Link } from "wouter";
import { useGetRecipe, getGetRecipeQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Leaf, ExternalLink, Calculator } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getRecipeImage } from "@/lib/foodImages";

interface RecipeSheetProps {
  recipeId: number | null;
  onClose: () => void;
}

function marginColor(pct: number) {
  if (pct > 60) return "#16a34a";
  if (pct > 45) return "#d97706";
  return "#dc2626";
}

function preferredImage(item: unknown) {
  const value = item as { imageUrl?: string | null; image_url?: string | null; image?: string | null };
  return value.imageUrl ?? value.image_url ?? value.image;
}

export function RecipeSheet({ recipeId, onClose }: RecipeSheetProps) {
  const { t } = useI18n();
  const recipe = useGetRecipe(recipeId!, {
    query: { queryKey: getGetRecipeQueryKey(recipeId!), enabled: !!recipeId },
  });

  const r = recipe.data;
  const margin = r?.profitMarginPct ?? 0;
  const profitSek = r ? r.sellingPriceSek - r.totalCostSek : 0;

  return (
    <Sheet open={!!recipeId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden"
        style={{ background: "var(--sv-surface)" }}
      >
        {recipe.isLoading || !r ? (
          <div className="p-6 flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="relative px-6 py-5 shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,hsl(17 47% 13%),hsl(17 37% 20%))" }}>
              <img
                src={getRecipeImage(r.name, r.category, preferredImage(r))}
                alt={r.name}
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-black/70" />
              <SheetHeader className="relative mb-0">
                <SheetTitle className="font-serif text-xl font-bold text-white pr-6">{r.name}</SheetTitle>
              </SheetHeader>
              {r.description && (
                <p className="relative text-[12px] mt-1 leading-relaxed" style={{ color: "rgba(250,248,244,.78)" }}>
                  {r.description}
                </p>
              )}
              <div className="relative grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: t("Kostnad"),  value: `${r.totalCostSek.toFixed(0)} kr` },
                  { label: t("Pris"),     value: `${r.sellingPriceSek.toFixed(0)} kr` },
                  { label: t("Marginal"), value: `${margin.toFixed(1)}%`, color: marginColor(margin) },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,.08)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: "rgba(250,248,244,.5)" }}>{label}</p>
                    <p className="text-[15px] font-bold" style={{ color: color ?? "white" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Profitability */}
              <div className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,.12)" }}>
                    <TrendingUp className="w-3 h-3" style={{ color: "#10b981" }} />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--sv-text-2)" }}>{t("Lönsamhetskalkyl")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: t("Råvarukostnad"),      val: `${r.totalCostSek.toFixed(2)} kr` },
                    { label: t("Kostnad per portion"), val: `${(r.totalCostSek / r.servings).toFixed(2)} kr` },
                    { label: t("Försäljningspris"),    val: `${r.sellingPriceSek.toFixed(2)} kr` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-[13px]">
                      <span style={{ color: "var(--sv-text-2)" }}>{row.label}</span>
                      <span className="font-medium" style={{ color: "var(--sv-text)" }}>{row.val}</span>
                    </div>
                  ))}
                  <div className="h-px my-1" style={{ background: "var(--sv-border)" }} />
                  <div className="flex justify-between text-[13px] font-bold">
                    <span style={{ color: "var(--sv-text)" }}>{t("Bruttovinst")}</span>
                    <span style={{ color: profitSek >= 0 ? "#10b981" : "#dc2626" }}>
                      {profitSek >= 0 ? "+" : ""}{profitSek.toFixed(2)} kr
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold">
                    <span style={{ color: "var(--sv-text)" }}>{t("Vinstmarginal")}</span>
                    <span style={{ color: marginColor(margin) }}>{margin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              {r.ingredients && r.ingredients.length > 0 && (
                <div className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--sv-border)" }}>
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{ borderBottom: "1px solid var(--sv-border)", background: "var(--sv-muted)" }}>
                    <Leaf className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                    <span className="text-[12px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--sv-text-2)" }}>
                      {t("Ingredienser")} · {r.ingredients.length} st
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--sv-border)" }}>
                    {r.ingredients.map((ing) => (
                      <div key={ing.ingredientId}
                        className="flex items-center justify-between px-4 py-2.5 text-[13px]"
                        style={{ background: "var(--sv-surface)" }}>
                        <span className="font-medium" style={{ color: "var(--sv-text)" }}>{ing.ingredientName}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span style={{ color: "var(--sv-text-2)" }}>{ing.quantity} {ing.unit}</span>
                          <span className="font-semibold w-16 text-right" style={{ color: "var(--sv-text)" }}>
                            {ing.lineCostSek.toFixed(2)} kr
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5 text-[13px] font-bold"
                      style={{ background: "var(--sv-muted)", borderTop: `2px solid var(--sv-border)` }}>
                      <span style={{ color: "var(--sv-text-2)" }}>{t("Totalt")}</span>
                      <span style={{ color: "var(--sv-text)" }}>{r.totalCostSek.toFixed(2)} kr</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 flex gap-2 shrink-0"
              style={{ borderTop: "1px solid var(--sv-border)", background: "var(--sv-surface)" }}>
              <Link href={`/recipes/${r.id}`} onClick={onClose} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all"
                  style={{ background: "var(--sv-muted)", color: "var(--sv-text)", border: "1.5px solid var(--sv-border)" }}>
                  <ExternalLink className="w-3.5 h-3.5" /> {t("Fullständig vy")}
                </button>
              </Link>
              <Link href="/calculator" onClick={onClose} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
                  <Calculator className="w-3.5 h-3.5" /> {t("Kalkylator")}
                </button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
