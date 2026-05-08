import { Check, Sparkles, Timer, TrendingUp } from "lucide-react";
import { FEATURE_LOCK_RULES, FREE_FEATURES, LOCKED_FEATURES, PLAN_LIMITS, PLANS } from "@/lib/plans";
import { apiFetch, useAuth } from "@/lib/auth";
import { useState } from "react";

const toneStyle: Record<string, { bg: string; border: string; color: string; accent: string }> = {
  muted: {
    bg: "var(--sv-surface)",
    border: "var(--sv-border)",
    color: "var(--sv-text)",
    accent: "var(--sv-muted)",
  },
  featured: {
    bg: "linear-gradient(135deg, hsl(44 54% 54%), hsl(38 55% 48%))",
    border: "transparent",
    color: "hsl(17 47% 13%)",
    accent: "rgba(44,24,16,.12)",
  },
  dark: {
    bg: "linear-gradient(135deg, hsl(17 47% 13%), hsl(17 37% 20%))",
    border: "transparent",
    color: "#FAF8F4",
    accent: "rgba(255,255,255,.10)",
  },
};

function PlanCard({ plan, onCheckout, loadingPlan }: { plan: (typeof PLANS)[number]; onCheckout: (planId: string) => void; loadingPlan: string | null }) {
  const style = toneStyle[plan.tone];
  const isFeatured = plan.id === "trial";
  const canCheckout = plan.id === "pro";
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5 relative overflow-hidden"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: isFeatured ? "0 14px 34px rgba(201,168,76,.24)" : "0 2px 10px var(--sv-shadow)",
        color: style.color,
      }}
    >
      {isFeatured && (
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-20" style={{ border: "26px solid #fff" }} />
      )}
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: style.accent }}>
            {plan.eyebrow}
          </span>
          {isFeatured && <Sparkles className="w-4 h-4" />}
        </div>
        <h2 className="font-serif text-xl font-bold mt-4">{plan.name}</h2>
        <p className="text-[13px] leading-relaxed mt-2 opacity-75">{plan.description}</p>
      </div>
      <div className="relative">
        <div className="flex items-end gap-2">
          <span className="font-serif text-3xl font-bold">{plan.price}</span>
          <span className="text-[12px] pb-1 opacity-70">{plan.cadence}</span>
        </div>
      </div>
      <div className="relative flex flex-col gap-2">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-[13px]">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <button
        disabled={plan.id === "team" || loadingPlan === plan.id}
        onClick={() => canCheckout ? onCheckout(plan.id) : undefined}
        className="relative mt-auto rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all disabled:opacity-55"
        style={{
          background: plan.tone === "dark" ? "hsl(44 54% 54%)" : plan.tone === "featured" ? "hsl(17 47% 13%)" : "var(--sv-brown)",
          color: plan.tone === "featured" ? "#FAF8F4" : plan.tone === "dark" ? "hsl(17 47% 13%)" : "var(--sv-surface)",
        }}
      >
        {loadingPlan === plan.id ? "Oppnar Stripe..." : plan.cta}
      </button>
    </div>
  );
}

export default function Plans() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const checkout = async (planId: string) => {
    setCheckoutError("");
    setLoadingPlan(planId);
    try {
      const data = await apiFetch("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ planId, email: user?.email }),
      });
      if (!data.url) throw new Error("Stripe checkout URL saknas.");
      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Stripe checkout kunde inte startas.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl flex flex-col gap-7">
      <div className="relative rounded-2xl overflow-hidden px-7 py-8"
        style={{ background: "linear-gradient(135deg, hsl(17 47% 13%), hsl(17 37% 20%))", boxShadow: "0 8px 32px rgba(44,24,16,.22)" }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full opacity-[.08]" style={{ border: "40px solid hsl(44 54% 54%)" }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(44 60% 60%)" }}>
              Prova innan du betalar
            </p>
            <h1 className="font-serif text-3xl font-bold text-white">Smakvarlden Plans</h1>
            <p className="text-[14px] leading-relaxed mt-2 max-w-2xl" style={{ color: "rgba(250,248,244,.66)" }}>
              Starta med gratis recept och basic kalkyl. Uppgradera nar export, AI, supplier sync och obegransade recept sparar tid i koket.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,.08)", color: "#fff" }}>
            <Timer className="w-5 h-5" style={{ color: "hsl(44 60% 60%)" }} />
            <div>
              <p className="text-[12px] font-bold">{PLAN_LIMITS.trialDays}-day Pro Trial</p>
              <p className="text-[11px]" style={{ color: "rgba(250,248,244,.58)" }}>No credit card in the first launch phase</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => <PlanCard key={plan.id} plan={plan} onCheckout={checkout} loadingPlan={loadingPlan} />)}
      </div>

      {checkoutError && (
        <div className="rounded-xl px-4 py-3 text-[13px] font-semibold" style={{ background: "hsl(350 60% 96%)", color: "hsl(350 60% 36%)" }}>
          {checkoutError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: "var(--sv-gold)" }} />
            <h2 className="font-serif text-lg font-bold" style={{ color: "var(--sv-text)" }}>Smart feature locking</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FREE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="rounded-xl p-3" style={{ background: "var(--sv-muted)" }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color: "var(--sv-gold)" }} />
                  <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{feature.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--sv-text-2)" }}>{feature.detail}</p>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            {FEATURE_LOCK_RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.title} className="rounded-xl p-3" style={{ border: "1px solid var(--sv-border)" }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color: "var(--sv-gold)" }} />
                  <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{rule.title}</p>
                  <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--sv-text-2)" }}>{rule.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 2px 10px var(--sv-shadow)" }}>
          <h2 className="font-serif text-lg font-bold mb-4" style={{ color: "var(--sv-text)" }}>Locked after Free</h2>
          <div className="flex flex-col gap-3">
            {LOCKED_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: "var(--sv-muted)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--sv-surface)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--sv-gold)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold" style={{ color: "var(--sv-text)" }}>{feature.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--sv-text-2)" }}>{feature.plan}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--sv-brown)", color: "var(--sv-surface)" }}>
                    Upgrade
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
