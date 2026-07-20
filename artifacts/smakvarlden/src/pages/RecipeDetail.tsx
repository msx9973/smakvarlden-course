import { useState } from "react";
import { Link } from "wouter";
import { useGetRecipe, getGetRecipeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Leaf, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getIngredientImage, getRecipeImage } from "@/lib/foodImages";
import { EditRecipeDialog } from "@/components/EditRecipeDialog";

function preferredImage(item: unknown) {
  const value = item as { imageUrl?: string | null; image_url?: string | null; image?: string | null };
  return value.imageUrl ?? value.image_url ?? value.image;
}

function marginColor(pct: number) {
  if (pct > 60) return "#16a34a";
  if (pct > 45) return "#d97706";
  return "#dc2626";
}

export default function RecipeDetail({ id }: { id: number }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const recipe = useGetRecipe(id, {
    query: { queryKey: getGetRecipeQueryKey(id), enabled: !!id },
  });

  if (recipe.isLoading) {
    return (
      <div className="max-w-3xl flex flex-col gap-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!recipe.data) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>
          {t("Receptet hittades inte")}
        </p>
        <Link href="/recipes"
          className="inline-block mt-3 px-5 py-2 rounded-full text-[13px] font-semibold"
          style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
          {t("Tillbaka till recept")}
        </Link>
      </div>
    );
  }

  const r = recipe.data;
  const margin = r.profitMarginPct;
  const mColor = marginColor(margin);
  const profitSek = r.sellingPriceSek - r.totalCostSek;
  const costPerServing = r.servings > 0 ? r.totalCostSek / r.servings : r.totalCostSek;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/recipes" className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70" style={{ color: "var(--sv-text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> {t("Tillbaka till recept")}
        </Link>
        <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold" style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)", border: "1.5px solid var(--sv-border)" }}>
          <Pencil className="w-3.5 h-3.5" /> {t("Redigera")}
        </button>
      </div>
      <div className="relative overflow-hidden rounded-2xl min-h-56 flex items-end" style={{ background: "linear-gradient(135deg,hsl(17 47% 13%),hsl(17 37% 20%))" }}>
        <img src={getRecipeImage(r.name, r.category, preferredImage(r))} alt={r.name} className="absolute inset-0 h-full w-full object-cover opacity-55" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
        <div className="relative flex items-end justify-between gap-4 w-full px-6 py-6">
          <div><h1 className="text-3xl font-serif font-bold tracking-tight text-white">{r.name}</h1>{r.description && <p className="text-white/75 mt-1.5 text-sm leading-relaxed max-w-xl">{r.description}</p>}</div>
          <span className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full text-white" style={{ background: "rgba(255,255,255,.15)" }}>{t(r.category)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{label:t("Portioner"),value:String(r.servings)},{label:t("Kostnad"),value:`${r.totalCostSek.toFixed(0)} kr`},{label:t("Försäljningspris"),value:r.sellingPriceSek>0?`${r.sellingPriceSek.toFixed(0)} kr`:"—"},{label:t("Marginal"),value:r.sellingPriceSek>0?`${margin.toFixed(1)}%`:"—",color:mColor}].map((m)=>( <div key={m.label} className="rounded-xl p-4 text-center" style={{background:"var(--sv-surface)",boxShadow:"0 2px 8px var(--sv-shadow)",border:"1px solid var(--sv-border)"}}><p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{color:"var(--sv-text-2)"}}>{m.label}</p><p className="text-2xl font-serif font-bold" style={{color:m.color??"var(--sv-text)"}}>{m.value}</p></div> ))}
      </div>
      <EditRecipeDialog recipe={r.id?{id:r.id,name:r.name,description:r.description,category:r.category,servings:r.servings,sellingPriceSek:r.sellingPriceSek,isShared:r.isShared}:null} onClose={()=>{setEditOpen(false);qc.invalidateQueries({queryKey:getGetRecipeQueryKey(id)});}} />
    </div>
  );
}
