import { createContext, useContext, useEffect, useState, ReactNode, Component, ErrorInfo } from "react";
import { hasSupabaseAuth, readSupabaseAccessTokenFromUrl, signInWithPassword, signUpWithPassword } from "@/lib/supabaseAuth";

export interface AuthUser { id: number; name: string; email: string; role: "user" | "admin"; plan: "free" | "pro"; createdAt: string; }

interface AuthState { user: AuthUser | null; token: string | null; loading: boolean; login: (identifier: string, password: string) => Promise<void>; register: (name: string, contact: string, password: string) => Promise<void>; loginWithSupabaseToken: (accessToken: string) => Promise<void>; logout: () => void; }

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "smakvarlden_token";
const USER_KEY = "smakvarlden_user";

// Unified API base — works with both Vite dev proxy and Netlify Functions
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = `${BASE}/api`;

function encodeJsonPayload(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return null;
  try { return btoa(unescape(encodeURIComponent(body))); } catch { return null; }
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem(TOKEN_KEY);
  const encodedPayload = encodeJsonPayload(opts?.body);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(encodedPayload ? { "X-Smakvarlden-Payload": encodedPayload } : {}), ...((opts?.headers as Record<string, string>) ?? {}) };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Något gick fel.");
  return data;
}

function readCachedUser() {
  try { const raw = localStorage.getItem(USER_KEY); return raw ? (JSON.parse(raw) as AuthUser) : null; }
  catch { localStorage.removeItem(USER_KEY); return null; }
}

function persistSession(nextToken: string, nextUser: AuthUser) { localStorage.setItem(TOKEN_KEY, nextToken); localStorage.setItem(USER_KEY, JSON.stringify(nextUser)); }
function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { hasError: false, message: "" }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, message: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("AppErrorBoundary caught:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <p style={{ fontSize: 32, margin: 0 }}>⚠️</p>
          <h2 style={{ margin: 0, fontSize: 18 }}>Något gick fel</h2>
          <p style={{ color: "#666", maxWidth: 400, margin: 0 }}>Sidan kunde inte laddas. Försök ladda om.</p>
          {this.state.message && <code style={{ fontSize: 12, color: "#999", background: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>{this.state.message}</code>}
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: "8px 24px", borderRadius: 999, border: "none", background: "#2c1810", color: "#fff", cursor: "pointer", fontSize: 14 }}>Ladda om</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)) && !readCachedUser());

  useEffect(() => {
    const supabaseAccessToken = readSupabaseAccessTokenFromUrl();
    if (supabaseAccessToken) {
      apiFetch("/auth/supabase", { method: "POST", body: JSON.stringify({ accessToken: supabaseAccessToken }) })
        .then((data) => { persistSession(data.token, data.user); setToken(data.token); setUser(data.user); })
        .catch(() => { clearSession(); setToken(null); setUser(null); })
        .finally(() => setLoading(false));
      return;
    }
    if (!token) { setLoading(false); return; }
    apiFetch("/auth/me")
      .then((u: AuthUser) => { localStorage.setItem(USER_KEY, JSON.stringify(u)); setUser(u); })
      .catch(() => { clearSession(); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (identifier: string, password: string) => {
    if (hasSupabaseAuth && identifier.includes("@")) { try { const accessToken = await signInWithPassword(identifier, password); await loginWithSupabaseToken(accessToken); return; } catch {} }
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
    persistSession(data.token, data.user); setToken(data.token); setUser(data.user);
  };

  const register = async (name: string, contact: string, password: string) => {
    if (hasSupabaseAuth && contact.includes("@")) { try { const accessToken = await signUpWithPassword(name, contact, password); await loginWithSupabaseToken(accessToken); return; } catch {} }
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, contact, password }) });
    persistSession(data.token, data.user); setToken(data.token); setUser(data.user);
  };

  const loginWithSupabaseToken = async (accessToken: string) => {
    const data = await apiFetch("/auth/supabase", { method: "POST", body: JSON.stringify({ accessToken }) });
    persistSession(data.token, data.user); setToken(data.token); setUser(data.user);
  };

  const logout = () => { clearSession(); setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, token, loading, login, register, loginWithSupabaseToken, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export { apiFetch };
