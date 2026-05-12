import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { hasSupabaseAuth, sendPasswordReset, startSupabaseGoogleLogin } from "@/lib/supabaseAuth";

export default function Login({ onSuccess }: { onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") === "failed") {
      setError("Google-inloggningen kunde inte slutföras. Försök igen.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(contact, password);
      } else {
        await register(name, contact, password);
      }
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("Fel uppstod."));
    } finally {
      setLoading(false);
    }
  };

  const startGoogleLogin = () => {
    if (hasSupabaseAuth) {
      try {
        startSupabaseGoogleLogin();
        return;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Google-inloggningen kunde inte startas.");
      }
    }

    const returnTo = encodeURIComponent("/");
    window.location.href = `/api/auth/google/start?returnTo=${returnTo}`;
  };

  const resetPassword = async () => {
    setError("");
    if (!contact.includes("@")) {
      setError("Skriv din e-postadress först, så skickar vi återställningslänken.");
      return;
    }
    try {
      if (!hasSupabaseAuth) {
        setError("Lösenordsåterställning kräver Supabase Auth.");
        return;
      }
      await sendPasswordReset(contact);
      setError("Om e-postadressen finns skickas en återställningslänk.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka återställningslänk.");
    }
  };

  return (
    <div className="login-page flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--sv-brown)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sv-gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--sv-text)" }}>
            Smakvärlden
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--sv-text-2)" }}>
            {t("Kockens digitala verktyg")}
          </p>
        </div>

        <div
          className="login-card relative overflow-hidden rounded-2xl p-6"
          style={{ boxShadow: "0 6px 24px var(--sv-shadow)", border: "1px solid var(--sv-border)" }}
        >
          <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, var(--sv-gold), transparent)" }} />

          <button
            type="button"
            onClick={startGoogleLogin}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all hover:bg-stone-50"
            style={{ borderColor: "var(--sv-border)", color: "var(--sv-text)" }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[15px] font-bold" style={{ color: "#4285f4" }}>G</span>
            Fortsätt med Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--sv-border)" }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--sv-text-2)" }}>eller</span>
            <div className="h-px flex-1" style={{ background: "var(--sv-border)" }} />
          </div>

          <div className="mb-6 flex gap-1 rounded-xl p-1" style={{ background: "var(--sv-muted)" }}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
                style={mode === m ? {
                  background: "var(--sv-surface)",
                  color: "var(--sv-text)",
                  boxShadow: "0 1px 3px rgba(44,24,16,.08)",
                } : {
                  color: "var(--sv-text-2)",
                }}
              >
                {m === "login" ? t("Logga in") : t("Skapa konto")}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--sv-text-2)" }}>
                  {t("Namn")}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chef Erik"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                  style={{
                    border: "1.5px solid var(--sv-border)",
                    background: "var(--sv-surface)",
                    color: "var(--sv-text)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--sv-gold)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--sv-border)"}
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--sv-text-2)" }}>
                E-post eller telefonnummer
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--sv-text-2)" }} />
                <Phone className="absolute left-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--sv-text-2)" }} />
                <input
                  type="text"
                  inputMode="email"
                  autoComplete={mode === "login" ? "username" : "email"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="chef@koken.se eller 070 123 45 67"
                  className="w-full rounded-lg py-2.5 pl-14 pr-3 text-sm outline-none transition-all"
                  style={{
                    border: "1.5px solid var(--sv-border)",
                    background: "var(--sv-surface)",
                    color: "var(--sv-text)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--sv-gold)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--sv-border)"}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--sv-text-2)" }}>
                {t("Lösenord")}
              </label>
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minst 8 tecken, bokstav och siffra" : "••••••••"}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--sv-border)",
                  background: "var(--sv-surface)",
                  color: "var(--sv-text)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--sv-gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--sv-border)"}
                required
              />
              {mode === "login" && (
                <button
                  type="button"
                  onClick={resetPassword}
                  className="mt-2 text-xs font-semibold transition-colors hover:underline"
                  style={{ color: "var(--sv-gold)" }}
                >
                  Glömt lösenord?
                </button>
              )}
            </div>

            {mode === "register" && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "hsl(150 34% 95%)", color: "hsl(150 42% 28%)" }}>
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Starkare lösenordskrav och säkrare inloggning skyddar kontot bättre.</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "hsl(350 60% 96%)", color: "hsl(350 60% 36%)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full py-3 text-sm font-semibold transition-all disabled:opacity-60"
              style={{
                background: "var(--sv-brown)",
                color: "white",
                boxShadow: "0 4px 16px rgba(44,24,16,.2)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loading ? "Laddar..." : mode === "login" ? t("Logga in") : t("Skapa konto")}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--sv-text-2)" }}>
          Smakvärlden · Kockens digitala verktyg
        </p>
      </div>
    </div>
  );
}
