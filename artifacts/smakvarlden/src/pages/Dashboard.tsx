import {
  useGetDashboardSummary,
  useGetDashboardRecentActivity,
  useGetTopPerformingRecipes,
  useGetIngredientCategoryBreakdown,
  getGetDashboardSummaryQueryKey,
  getGetDashboardRecentActivityQueryKey,
  getGetTopPerformingRecipesQueryKey,
  getGetIngredientCategoryBreakdownQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, BookOpen, Leaf, Users, AlertTriangle, Share2, ChefHat, ArrowRight, Zap, BarChart2, Trash2,
  LayoutDashboard, Calculator,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { RecipeSheet } from "@/components/RecipeSheet";
import { getRecipeImage } from "@/lib/foodImages";

function StatCard({
  label, value, icon: Icon, sub, gradient, iconColor, href,
}: {
  label: string; value: string | number; icon: React.ElementType;
  sub?: string; gradient: string; iconColor: string; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)",
        cursor: href ? "pointer" : "default",
      }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-3xl font-serif font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>{value}</p>
      {sub && <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{sub}</p>}
      {href && (
        <p className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--sv-gold)" }}>
          <ArrowRight className="w-3 h-3" /> Se mer
        </p>
      )}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
    recipe_created: { bg: "rgba(59,130,246,.12)",  icon: BookOpen,    color: "#3b82f6" },
    recipe_updated: { bg: "rgba(245,158,11,.12)",  icon: ChefHat,     color: "#d97706" },
    price_change:   { bg: "rgba(239,68,68,.12)",   icon: TrendingUp,  color: "#ef4444" },
    recipe_shared:  { bg: "rgba(16,185,129,.12)",  icon: Share2,      color: "#10b981" },
  };
  const e = map[type] ?? { bg: "var(--sv-muted)", icon: ChefHat, color: "var(--sv-text-2)" };
  const Icon = e.icon;
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: e.bg }}>
      <Icon className="w-3.5 h-3.5" style={{ color: e.color }} />
    </div>
  );
}

const MEDAL_COLORS = ["hsl(44 58% 48%)", "hsl(220 10% 58%)", "hsl(25 58% 42%)"];
const CAT_COLORS = ["hsl(44 50% 46%)","#3b82f6","#10b981","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"];

function preferredImage(item: unknown) {
  const value = item as { imageUrl?: string | null; image_url?: string | null; image?: string | null };
  return value.imageUrl ?? value.image_url ?? value.image;
}

function StatsSidebar({ summary, catBreakdown }: {
  summary: ReturnType<typeof useGetDashboardSummary>["data"];
  catBreakdown: { category: string; count: number; avgPriceSek: number; totalPriceSek: number }[];
}) {
  const { t } = useI18n();
  const topCats = catBreakdown.slice(0, 6).map((c, i) => ({
    name: c.category.length > 10 ? c.category.slice(0, 9) + "…" : c.category,
    value: c.count,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  return (
    <aside className="flex flex-col gap-5">
      <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,.12)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
          </div>
          <h3 className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{t("Marginalstatus")}</h3>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: t("Bra (>60%)"),  pct: 72, color: "#10b981", bg: "rgba(16,185,129,.15)" },
            { label: t("OK (45–60%)"), pct: 20, color: "#d97706", bg: "rgba(217,119,6,.15)"  },
            { label: t("Låg (<45%)"),  pct: 8,  color: "#ef4444", bg: "rgba(239,68,68,.15)"  },
          ].map(({ label, pct, color, bg }) => (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: "var(--sv-text-2)" }}>{label}</span>
                <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--sv-muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <Link href="/calculator"
          className="flex items-center gap-1.5 mt-4 text-[12px] font-semibold"
          style={{ color: "var(--sv-gold)" }}>
          {t("Se fullständig analys")} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,.12)" }}>
            <BarChart2 className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
          </div>
          <h3 className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{t("Nyckeltal")}</h3>
        </div>
        <div className="flex flex-col">
          {[
            { label: t("Snitt marginal"),   value: summary ? `${summary.avgProfitMarginPct.toFixed(1)}%` : "–" },
            { label: t("Snitt receptkost"), value: summary ? `${summary.avgRecipeCostSek.toFixed(0)} kr` : "–" },
            { label: t("Prisvarningar"),    value: summary ? `${summary.priceAlerts} st` : "–" },
            { label: t("Delade recept"),    value: summary ? `${summary.sharedRecipes} st` : "–" },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--sv-border)` : "none" }}>
              <span className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{label}</span>
              <span className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {topCats.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,.15)" }}>
              <Leaf className="w-3.5 h-3.5" style={{ color: "var(--sv-gold)" }} />
            </div>
            <h3 className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{t("Ingredienser / kategori")}</h3>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={topCats} margin={{ top: 4, right: 4, bottom: 24, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--sv-text-2)" }}
                angle={-28} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: 8, fontSize: 11, color: "var(--sv-text)" }}
                cursor={{ fill: "var(--sv-muted)" }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {topCats.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Link href="/svinn"
        className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 group"
        style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,.12)" }}>
          <Trash2 className="w-5 h-5" style={{ color: "#ef4444" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{t("Svinnanalys")}</p>
          <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{t("Reducera matsvinn och öka vinst")}</p>
        </div>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "var(--sv-text-2)" }} />
      </Link>
    </aside>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [sheetRecipeId, setSheetRecipeId] = useState<number | null>(null);
  const summary      = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const activity     = useGetDashboardRecentActivity({ limit: 8 }, { query: { queryKey: getGetDashboardRecentActivityQueryKey({ limit: 8 }) } });
  const topRecipes   = useGetTopPerformingRecipes({ limit: 5 }, { query: { queryKey: getGetTopPerformingRecipesQueryKey({ limit: 5 }) } });
  const catBreakdown = useGetIngredientCategoryBreakdown({ query: { queryKey: getGetIngredientCategoryBreakdownQueryKey() } });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("God morgon") : hour < 17 ? t("God eftermiddag") : t("God kväll");
  const dateLocale = lang === "en" ? enUS : sv;

  return (
    <div className="flex gap-7 max-w-[1400px]">
      <div className="flex-1 min-w-0 flex flex-col gap-7">
        <div className="relative rounded-2xl overflow-hidden px-6 py-6 md:px-7 md:py-7 sv-soft-panel">
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--sv-gold)" }}>{greeting}</p>
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>
                  {t("Välkommen till Smakvärlden")}
                </h1>
                <p className="text-[14px] md:text-[15px] mt-3 max-w-2xl leading-7" style={{ color: "var(--sv-text-2)" }}>
                  {t("Ett digitalt arbetsbord för recept, råvarupriser, marginal och svinn i svenska restauranger.")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: t("Skapa recept"), desc: t("Bygg din kokbok"), icon: BookOpen, href: "/recipes", color: "#3b82f6" },
                  { label: t("Kalkylera ny rätt"), desc: t("Se marginal direkt"), icon: Calculator, href: "/calculator", color: "var(--sv-gold)" },
                  { label: t("Se prisvarningar"), desc: t("Hitta dyra råvaror"), icon: AlertTriangle, href: "/ingredients", color: "#d97706" },
                ].map(({ label, desc, icon: Icon, href, color }) => (
                  <Link key={label} href={href} className="sv-action-tile rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--sv-muted)" }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 sv-comfort-panel">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sv-gold)" }}>{t("Dagens fokus")}</p>
              <div className="space-y-3">
                {[
                  t("Kontrollera prisvarningar innan du ändrar menyn."),
                  t("Kalkylera nya rätter innan de publiceras."),
                  t("Följ svinn och råvarukostnad varje vecka."),
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--sv-muted)" }}>
                    <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--sv-gold)" }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>{item}</p>
                  </div>
                ))}
              </div>
              {user && <p className="text-[11px] mt-4" style={{ color: "var(--sv-text-2)" }}>{t("Inloggad som")} <span className="font-semibold" style={{ color: "var(--sv-text)" }}>{user.name}</span></p>}
            </div>
          </div>
        </div>

        <div id="dashboard-overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-6">
          {summary.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            : summary.data ? (
              <>
                <StatCard label={t("Recept")} value={summary.data.totalRecipes} icon={BookOpen} sub={t("I din kokbok")}
                  gradient="rgba(59,130,246,.14)" iconColor="#3b82f6" href="/recipes" />
                <StatCard label={t("Ingredienser")} value={summary.data.totalIngredients} icon={Leaf} sub={t("Spårade råvaror")}
                  gradient="rgba(16,185,129,.14)" iconColor="#10b981" href="/ingredients" />
                <StatCard label={t("Snitt marginal")} value={`${summary.data.avgProfitMarginPct.toFixed(1)}%`}
                  icon={TrendingUp} sub={t("Vinstmarginal")}
                  gradient="rgba(201,168,76,.18)" iconColor="hsl(44 50% 44%)" href="/market" />
                <StatCard label={t("Prisvarningar")} value={summary.data.priceAlerts}
                  icon={AlertTriangle} sub={t("Råvaror med >5% ändring")}
                  gradient={summary.data.priceAlerts > 0 ? "rgba(239,68,68,.14)" : "rgba(16,185,129,.10)"}
                  iconColor={summary.data.priceAlerts > 0 ? "#ef4444" : "#10b981"} href="/ingredients" />
              </>
            ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <div id="dashboard-activity" className="lg:col-span-3 rounded-2xl overflow-hidden scroll-mt-6"
            style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--sv-border)" }}>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Senaste aktivitet")}</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--sv-accent)", color: "var(--sv-gold)" }}>Live</span>
            </div>
            <div>
              {activity.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-3 flex gap-3 items-center"
                      style={{ borderBottom: "1px solid var(--sv-border)" }}>
                      <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div>
                    </div>
                  ))
                : (activity.data ?? []).map((entry, i, arr) => (
                    <Link key={entry.id}
                      href={entry.type === "price_change" ? "/ingredients" : "/recipes"}
                      className="px-6 py-3 flex items-center gap-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.03]"
                      style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--sv-border)` : "none", display: "flex" }}>
                      <ActivityIcon type={entry.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "var(--sv-text)" }}>{entry.title}</p>
                        <p className="text-[12px] truncate" style={{ color: "var(--sv-text-2)" }}>{entry.subtitle}</p>
                      </div>
                      <span className="text-[11px] whitespace-nowrap shrink-0" style={{ color: "var(--sv-text-2)" }}>
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </Link>
                  ))
              }
            </div>
          </div>

          <div id="dashboard-top-recipes" className="lg:col-span-2 rounded-2xl overflow-hidden scroll-mt-6"
            style={{ background: "var(--sv-surface)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--sv-border)" }}>
              <h2 className="font-serif text-base font-semibold" style={{ color: "var(--sv-text)" }}>{t("Toprecept")}</h2>
              <Link href="/recipes" className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: "var(--sv-gold)" }}>
                {t("Alla")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {topRecipes.isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
                : (topRecipes.data ?? []).map((recipe, idx) => (
                    <div key={recipe.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.03] cursor-pointer"
                      onClick={() => setSheetRecipeId(recipe.id)}>
                      <span className="font-serif font-bold text-base w-5 text-center shrink-0"
                        style={{ color: MEDAL_COLORS[idx] ?? "var(--sv-text-2)" }}>
                        {idx + 1}
                      </span>
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--sv-muted)" }}>
                        <img
                          src={getRecipeImage(recipe.name, recipe.category, preferredImage(recipe))}
                          alt={recipe.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--sv-text)" }}>{recipe.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>
                          {t(recipe.category)} · {recipe.totalCostSek.toFixed(0)} kr
                        </p>
                      </div>
                      <p className="text-[13px] font-bold shrink-0" style={{ color: "#10b981" }}>
                        {recipe.profitMarginPct.toFixed(1)}%
                      </p>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>

      <div className="w-72 shrink-0 hidden xl:block">
        <StatsSidebar summary={summary.data} catBreakdown={catBreakdown.data ?? []} />
      </div>

      <RecipeSheet recipeId={sheetRecipeId} onClose={() => setSheetRecipeId(null)} />
    </div>
  );
}
