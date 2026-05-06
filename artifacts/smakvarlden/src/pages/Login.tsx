import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Login({ onSuccess }: { onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fel uppstod.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(36 38% 98%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "hsl(17 47% 13%)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(44 60% 70%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: "hsl(17 47% 13%)" }}>
            Smakvärlden
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(20 20% 53%)" }}>
            Kockens digitala verktyg
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 relative overflow-hidden"
          style={{ boxShadow: "0 6px 24px rgba(44,24,16,.09)", border: "1px solid hsl(33 28% 89%)" }}>
          {/* Gold top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, hsl(44 54% 54%), transparent)" }} />

          {/* Tab switcher */}
          <div className="flex mb-6 rounded-xl p-1 gap-1" style={{ background: "hsl(36 27% 94%)" }}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={mode === m ? {
                  background: "#fff",
                  color: "hsl(17 47% 13%)",
                  boxShadow: "0 1px 3px rgba(44,24,16,.08)",
                } : {
                  color: "hsl(20 20% 53%)",
                }}
              >
                {m === "login" ? "Logga in" : "Skapa konto"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(20 20% 53%)" }}>
                  Namn
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chef Erik"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    border: "1.5px solid hsl(33 28% 89%)",
                    background: "#fff",
                    color: "hsl(17 47% 13%)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "hsl(44 54% 54%)"}
                  onBlur={(e) => e.target.style.borderColor = "hsl(33 28% 89%)"}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(20 20% 53%)" }}>
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@koken.se"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid hsl(33 28% 89%)",
                  background: "#fff",
                  color: "hsl(17 47% 13%)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => e.target.style.borderColor = "hsl(44 54% 54%)"}
                onBlur={(e) => e.target.style.borderColor = "hsl(33 28% 89%)"}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(20 20% 53%)" }}>
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minst 6 tecken" : "••••••••"}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid hsl(33 28% 89%)",
                  background: "#fff",
                  color: "hsl(17 47% 13%)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => e.target.style.borderColor = "hsl(44 54% 54%)"}
                onBlur={(e) => e.target.style.borderColor = "hsl(33 28% 89%)"}
                required
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "hsl(350 60% 96%)", color: "hsl(350 60% 36%)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-sm font-semibold transition-all mt-2 disabled:opacity-60"
              style={{
                background: "hsl(17 47% 13%)",
                color: "hsl(36 38% 95%)",
                boxShadow: "0 4px 16px rgba(44,24,16,.2)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loading ? "Laddar…" : mode === "login" ? "Logga in" : "Skapa konto"}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: "hsl(20 20% 65%)" }}>
          Smakvärlden · Kockens digitala verktyg
        </p>
      </div>
    </div>
  );
}
