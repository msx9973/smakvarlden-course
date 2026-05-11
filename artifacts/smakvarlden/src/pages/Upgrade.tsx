import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Crown, Zap, Globe, BarChart3, Loader2 } from "lucide-react";
import { useAuth, apiFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export default function Upgrade() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const FEATURES = [
    { icon: Globe,        label: t("Receptsök från hela världen"),  desc: t("Sök bland miljoner recept via Spoonacular") },
    { icon: Zap,          label: t("Obegränsade AI-förslag"),        desc: t("Generera recept och analyser utan begränsning") },
    { icon: BarChart3,    label: t("Avancerad analytics"),           desc: t("Djupgående marginalrapporter och trender") },
    { icon: CheckCircle2, label: t("Prioriterad support"),           desc: t("Snabbare svar från teamet") },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      toast({ title: t("Betalning avbruten"), description: t("Du kan försöka igen när du är redo.") });
    }
  }, []);

  async function startCheckout() {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/stripe/checkout", {
        method: "POST",
      });
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      toast({ title: t("Fel uppstod."), description: err instanceof Error ? err.message : t("Något gick fel."), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const isPro = user?.plan === "pro";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 py-4">

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--sv-brown)" }}>
          <Crown className="w-7 h-7" style={{ color: "var(--sv-gold)" }} />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight" style={{ color: "var(--sv-text)" }}>
          Smakvärlden <span style={{ color: "var(--sv-gold)", fontStyle: "italic" }}>Pro Chef</span>
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--sv-text-2)" }}>
          {t("Lås upp alla verktyg och ta ditt kök till nästa nivå")}
        </p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "var(--sv-surface)", boxShadow: "0 4px 20px var(--sv-shadow)", border: "1.5px solid var(--sv-border)" }}>

        {isPro && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold"
            style={{ background: "rgba(201,168,76,.15)", color: "var(--sv-gold)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> {t("Aktiv plan")}
          </div>
        )}

        <div className="flex items-end gap-1 mb-1">
          <span className="font-serif text-4xl font-bold" style={{ color: "var(--sv-text)" }}>89</span>
          <span className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--sv-text-2)" }}>{t("kr / månad")}</span>
        </div>
        <p className="text-[12px] mb-6" style={{ color: "var(--sv-text-2)" }}>{t("Avsluta när som helst · Inga bindningstider")}</p>

        <div className="space-y-3 mb-6">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(201,168,76,.12)" }}>
                <Icon className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--sv-text)" }}>{label}</p>
                <p className="text-[12px]" style={{ color: "var(--sv-text-2)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {isPro ? (
          <div className="w-full py-3 rounded-xl text-center text-[14px] font-semibold"
            style={{ background: "rgba(22,163,74,.1)", color: "#16a34a" }}>
            {t("Du är redan Pro-kock!")}
          </div>
        ) : (
          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-3 rounded-xl text-[14px] font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "var(--sv-brown)", color: "var(--sv-surface)", boxShadow: "0 4px 14px var(--sv-shadow)" }}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("Hanterar...")}</>
            ) : (
              <><Crown className="w-4 h-4" /> {t("Uppgradera till Pro")}</>
            )}
          </button>
        )}
      </div>

      {/* Free plan comparison */}
      <div className="rounded-2xl p-5"
        style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
        <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sv-gold)" }}>
          {t("Gratis plan inkluderar")}
        </p>
        <ul className="space-y-2">
          {[t("Upp till 10 recept"), t("Grundläggande kalkylator"), t("Ingredienshantering"), t("Community-åtkomst")].map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--sv-text-2)" }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--sv-text-2)" }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
