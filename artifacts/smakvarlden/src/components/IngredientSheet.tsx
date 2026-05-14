import { useGetIngredientPriceTrends, getGetIngredientPriceTrendsQueryKey } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TrendingUp, TrendingDown, Minus, Leaf, Package, Building2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useI18n } from "@/lib/i18n";
import { getIngredientImage } from "@/lib/foodImages";

interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentPriceSek: number;
  priceChangePct: number;
  supplier?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  image?: string | null;
}

interface IngredientSheetProps {
  ingredient: Ingredient | null;
  onClose: () => void;
}

function ChangePill({ pct }: { pct: number }) {
  const abs = Math.abs(pct);
  if (abs < 0.1) return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1 rounded-full"
      style={{ background: "var(--sv-muted)", color: "var(--sv-text-2)" }}>
      <Minus className="w-3.5 h-3.5" /> 0.0%
    </span>
  );
  if (pct > 0) return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1 rounded-full"
      style={{ background: "rgba(239,68,68,.12)", color: "#dc2626" }}>
      <TrendingUp className="w-3.5 h-3.5" /> +{pct.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold px-3 py-1 rounded-full"
      style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }}>
      <TrendingDown className="w-3.5 h-3.5" /> {pct.toFixed(1)}%
    </span>
  );
}

export function IngredientSheet({ ingredient, onClose }: IngredientSheetProps) {
  const { t } = useI18n();
  const trends = useGetIngredientPriceTrends({
    query: { queryKey: getGetIngredientPriceTrendsQueryKey(), enabled: !!ingredient },
  });

  const ingTrend = ingredient
    ? (trends.data ?? []).filter((e) => e.ingredientName === ingredient.name)
    : [];

  const chartData = ingTrend.map((e) => ({ date: e.date, pris: e.priceSek }));

  const priceStatus =
    !ingredient ? "stable"
    : ingredient.priceChangePct > 5 ? "rising"
    : ingredient.priceChangePct < -5 ? "falling"
    : "stable";

  const statusColor =
    priceStatus === "rising" ? "#dc2626"
    : priceStatus === "falling" ? "#16a34a"
    : "var(--sv-text-2)";

  const statusLabel = {
    rising: t("Stigande pris"),
    falling: t("Fallande pris"),
    stable: t("Stabilt pris"),
  }[priceStatus];

  return (
    <Sheet open={!!ingredient} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden"
        style={{ background: "var(--sv-surface)" }}
      >
        {!ingredient ? null : (
          <>
            {/* Hero */}
            <div className="relative px-6 py-5 shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,hsl(147 40% 13%),hsl(147 30% 20%))" }}>
              <img
                src={getIngredientImage(
                  ingredient.name,
                  ingredient.category,
                  ingredient.imageUrl ?? ingredient.image_url ?? ingredient.image,
                )}
                alt={ingredient.name}
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/70" />
              <SheetHeader className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(22,163,74,.2)" }}>
                    <Leaf className="w-5 h-5" style={{ color: "#4ade80" }} />
                  </div>
                  <SheetTitle className="font-serif text-xl font-bold text-white">{ingredient.name}</SheetTitle>
                </div>
              </SheetHeader>
              <div className="relative grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(250,248,244,.5)" }}>
                    {t("Pris")}
                  </p>
                  <p className="text-[15px] font-bold text-white">{ingredient.currentPriceSek.toFixed(2)} kr</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(250,248,244,.5)" }}>/{ingredient.unit}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(250,248,244,.5)" }}>
                    {t("Förändring")}
                  </p>
                  <p className="text-[15px] font-bold" style={{ color: statusColor }}>
                    {ingredient.priceChangePct > 0 ? "+" : ""}{ingredient.priceChangePct.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(250,248,244,.5)" }}>
                    {t("Trend")}
                  </p>
                  <p className="text-[12px] font-bold" style={{ color: statusColor }}>{statusLabel}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(59,130,246,.12)" }}>
                    <Package className="w-4 h-4" style={{ color: "#3b82f6" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--sv-text-2)" }}>
                      {t("Kategori")}
                    </p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: "var(--sv-text)" }}>
                      {t(ingredient.category)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(201,168,76,.15)" }}>
                    <Building2 className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--sv-text-2)" }}>
                      {t("Leverantör")}
                    </p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: "var(--sv-text)" }}>
                      {ingredient.supplier ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price change pill */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                <span className="text-[13px] font-medium" style={{ color: "var(--sv-text-2)" }}>
                  {t("Prisförändring sedan förra veckan")}
                </span>
                <ChangePill pct={ingredient.priceChangePct} />
              </div>

              {/* Price trend chart */}
              {chartData.length > 0 ? (
                <div className="rounded-xl p-4" style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "var(--sv-gold)" }}>
                    {t("Prisutveckling · 7 veckor")}
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--sv-text-2)" }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip
                        contentStyle={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: 10, fontSize: 12, color: "var(--sv-text)" }}
                        formatter={(v: number) => [`${v.toFixed(2)} kr`, t("Pris")]}
                      />
                      <Line
                        type="monotone" dataKey="pris" stroke="hsl(44 50% 46%)"
                        strokeWidth={2.5} dot={false} activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-xl p-6 text-center"
                  style={{ background: "var(--sv-muted)", border: "1px solid var(--sv-border)" }}>
                  <p className="text-[13px]" style={{ color: "var(--sv-text-2)" }}>
                    {t("Prishistorik tillgänglig för topingredienster")}
                  </p>
                </div>
              )}

              {/* Cost insight */}
              <div className="rounded-xl p-4"
                style={{ background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--sv-gold)" }}>
                  {t("Kostnadsinsikt")}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--sv-text-2)" }}>
                  {ingredient.currentPriceSek > 100
                    ? (t("Premium råvara") + " — " + t("överväg portionskontroll eller substitut vid högt svinn"))
                    : ingredient.priceChangePct > 10
                    ? (t("Priset har stigit kraftigt") + " — " + t("kontrollera receptmarginalerna"))
                    : (t("Priset är stabilt") + " — " + t("bra råvara att planera menyn runt"))}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
