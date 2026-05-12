import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Globe,
  Loader2,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth, apiFetch } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const PRO_FEATURES = [
  { icon: Sparkles, label: "7 dagar gratis", desc: "Testa Pro i en hel vecka innan månadspriset startar." },
  { icon: CheckCircle2, label: "Obegränsade recept och kalkyler", desc: "Bygg fler rätter, testa priser och spara arbetet utan stopp." },
  { icon: BarChart3, label: "Marginal, svinn och marknadsdata", desc: "Se råvarukostnad, branschjämförelser och lönsamhet på samma plats." },
  { icon: Globe, label: "Svensk restaurangbevakning", desc: "Community, nyheter och marknadsläge för svenska kök." },
  { icon: Zap, label: "AI-verktyg under Early Access", desc: "Tidiga Pro-kunder får nya AI-funktioner när de släpps." },
];

const FREE_FEATURES = [
  "3 recept",
  "Grundläggande kalkylator",
  "Begränsad ingredienshantering",
  "Läs community och marknadsöversikt",
];

export default function Upgrade() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      toast({ title: t("Betalning avbruten"), description: "Du kan försöka igen när du är redo." });
    }
  }, [toast, t]);

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
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4">
      <section
        className="overflow-hidden rounded-[24px] px-6 py-7 sm:px-8"
        style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", boxShadow: "0 10px 32px var(--sv-shadow)" }}
      >
        <div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(201,168,76,.14)", color: "var(--sv-gold)" }}
            >
              <Crown className="h-3.5 w-3.5" />
              Early Access
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--sv-text)" }}>
              Starta billigt, väx med Smakvärlden
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: "var(--sv-text-2)" }}>
              Första kunderna får ett lägre lanseringspris medan plattformen byggs vidare med mer AI,
              exports, analytics, lagerstöd och teamfunktioner.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Free", "0 SEK", "Prova i lugn takt"],
                ["Pro Early Access", "7 dagar gratis", "Sedan 59 SEK/mån"],
                ["Team", "Kommer senare", "För restauranger med flera användare"],
              ].map(([label, value, desc]) => (
                <div key={label} className="rounded-2xl p-4" style={{ background: "var(--sv-bg)", border: "1px solid var(--sv-border)" }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--sv-text-2)" }}>{label}</p>
                  <p className="mt-1 text-[20px] font-bold" style={{ color: "var(--sv-text)" }}>{value}</p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--sv-text-2)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative rounded-[22px] p-5"
            style={{ background: "linear-gradient(145deg, rgba(86,62,44,.96), rgba(47,38,31,.98))", color: "var(--sv-surface)" }}
          >
            {isPro && (
              <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,.12)", color: "var(--sv-gold)" }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Aktiv plan
              </div>
            )}
            <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>Pro Early Access</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-serif text-5xl font-bold">59</span>
              <span className="mb-2 text-[15px] font-semibold">SEK / månad</span>
            </div>
            <p className="mt-2 text-[13px]" style={{ color: "rgba(255,255,255,.72)" }}>
              Prova allt gratis i 7 dagar. Därefter behåller du founder-priset så länge du är aktiv kund.
              Avsluta när som helst, ingen bindningstid.
            </p>

            <div className="my-5 h-px" style={{ background: "rgba(255,255,255,.16)" }} />

            <div className="space-y-3">
              {PRO_FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,.11)" }}>
                    <Icon className="h-4 w-4" style={{ color: "var(--sv-gold)" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">{label}</p>
                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,.68)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {isPro ? (
              <div className="mt-6 w-full rounded-xl py-3 text-center text-[14px] font-semibold"
                style={{ background: "rgba(22,163,74,.18)", color: "#86efac" }}>
                Du är redan Pro-kock!
              </div>
            ) : (
              <button
                onClick={startCheckout}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: "var(--sv-gold)", color: "#2f261f", boxShadow: "0 8px 22px rgba(0,0,0,.22)" }}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Hanterar...</>
                ) : (
                  <><Crown className="h-4 w-4" /> Starta 7 dagar gratis</>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[20px] p-5" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(107,114,128,.10)" }}>
              <LockKeyhole className="h-5 w-5" style={{ color: "var(--sv-text-2)" }} />
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>Free Forever</p>
              <p className="text-[22px] font-bold" style={{ color: "var(--sv-text)" }}>0 SEK / månad</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--sv-text-2)" }}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[20px] p-5" style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)" }}>
          <p className="text-[13px] font-bold uppercase tracking-widest" style={{ color: "var(--sv-gold)" }}>Varför 7 dagar gratis?</p>
          <p className="mt-3 text-[14px] leading-7" style={{ color: "var(--sv-text-2)" }}>
            Restauranger ska kunna testa flödet i skarpt läge innan de betalar. I början är förtroende viktigare än högsta pris. Små kaféer, food trucks, studenter och nya kockar
            kan testa Smakvärlden utan stor risk, samtidigt som tidiga kunder hjälper plattformen bli starkare.
            När fler AI-verktyg, export, leverantörsstöd och teamkonton är redo kan nya kunder gå in på normalpris.
          </p>
        </div>
      </section>
    </div>
  );
}
