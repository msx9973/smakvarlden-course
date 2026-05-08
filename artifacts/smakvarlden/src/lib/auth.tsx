import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "pro";
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "smakvarlden_token";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Något gick fel.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    apiFetch("/auth/me")
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export { apiFetch };
