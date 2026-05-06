import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Shield, RefreshCw, Database, Users, ChefHat, CheckCircle, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Admin() {
  const { user, token } = useAuth();
  const [scbLoading, setScbLoading] = useState(false);
  const [scbResult, setScbResult] = useState<{ updated: number; message: string; lastUpdated?: string } | null>(null);
  const [scbError, setScbError] = useState("");

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Åtkomst nekad</p>
        <p className="text-sm text-muted-foreground">Den här sidan kräver admin-behörighet.</p>
      </div>
    );
  }

  const syncSCB = async () => {
    setScbLoading(true);
    setScbError("");
    setScbResult(null);
    try {
      const res = await fetch(`${BASE}/api/ingredients/sync-scb`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Synk misslyckades");
      setScbResult(data);
    } catch (e: unknown) {
      setScbError(e instanceof Error ? e.message : "Fel uppstod");
    } finally {
      setScbLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Systemadministration för Smakvärlden</p>
      </div>

      {/* Admin info */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email} · <span className="text-primary font-medium">Admin</span></p>
        </div>
      </div>

      {/* SCB Price Sync */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">SCB Prissynkronisering</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Hämtar aktuella livsmedelspriser från Statistics Sweden (SCB) KPI-databas och uppdaterar ingredienspriserna i systemet. SCB publicerar nya data månadsvis.
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-lg">Kött & fågel</span>
          <span className="px-2 py-1 bg-muted rounded-lg">Fisk & skaldjur</span>
          <span className="px-2 py-1 bg-muted rounded-lg">Mejeriprodukter</span>
          <span className="px-2 py-1 bg-muted rounded-lg">Grönsaker & frukt</span>
          <span className="px-2 py-1 bg-muted rounded-lg">Torrvaror & kryddor</span>
        </div>

        {scbResult && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{scbResult.message}</p>
              {scbResult.lastUpdated && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Uppdaterat: {scbResult.lastUpdated}</p>
              )}
            </div>
          </div>
        )}
        {scbError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{scbError}</p>
          </div>
        )}

        <button
          onClick={syncSCB}
          disabled={scbLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${scbLoading ? "animate-spin" : ""}`} />
          {scbLoading ? "Hämtar SCB-data…" : "Synkronisera SCB-priser"}
        </button>
      </div>

      {/* Users */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Användare</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Inloggade användare kan skapa och hantera sina egna recept. Det första kontot som registreras får automatiskt admin-behörighet.
        </p>
        <div className="bg-muted rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Standard-admin</p>
          <p className="text-sm font-mono font-medium text-foreground mt-0.5">admin@smakvarlden.se</p>
          <p className="text-xs text-muted-foreground mt-0.5">Lösenord satt vid seeding</p>
        </div>
      </div>

      {/* AI config */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground">AI-konfiguration</h2>
        <p className="text-sm text-muted-foreground">
          AI-assistenten kräver en Anthropic API-nyckel. Sätt <code className="bg-muted px-1 rounded text-xs font-mono">ANTHROPIC_API_KEY</code> i miljövariablerna via Replit Secrets.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${import.meta.env.VITE_AI_ENABLED === "true" ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span className="text-muted-foreground">Status kontrolleras av servern vid varje anrop</span>
        </div>
      </div>
    </div>
  );
}
