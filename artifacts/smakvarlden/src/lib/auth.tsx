import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  hasSupabaseAuth,
  readSupabaseAccessTokenFromUrl,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabaseAuth";

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
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, contact: string, password: string) => Promise<void>;
  loginWithSupabaseToken: (accessToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "smakvarlden_token";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = `${BASE}/.netlify/functions/api`;

function encodeJsonPayload(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return null;
  try {
    return btoa(unescape(encodeURIComponent(body)));
  } catch {
    return null;
  }
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem(TOKEN_KEY);
  const encodedPayload = encodeJsonPayload(opts?.body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(encodedPayload ? { "X-Smakvarlden-Payload": encodedPayload } : {}),
    ...((opts?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Något gick fel.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseAccessToken = readSupabaseAccessTokenFromUrl();
    if (supabaseAccessToken) {
      apiFetch("/auth/supabase", {
        method: "POST",
        body: JSON.stringify({ accessToken: supabaseAccessToken }),
      })
        .then((data) => {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!token) { setLoading(false); return; }
    apiFetch("/auth/me")
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (identifier: string, password: string) => {
    if (hasSupabaseAuth && identifier.includes("@")) {
      try {
        const accessToken = await signInWithPassword(identifier, password);
        await loginWithSupabaseToken(accessToken);
        return;
      } catch {
        // Keep existing Smakvarlden accounts working while Supabase Auth is being rolled out.
      }
    }

    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, contact: string, password: string) => {
    if (hasSupabaseAuth && contact.includes("@")) {
      try {
        const accessToken = await signUpWithPassword(name, contact, password);
        await loginWithSupabaseToken(accessToken);
        return;
      } catch {
        // Fall back to the app account system if Supabase needs email confirmation or is incomplete.
      }
    }

    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, contact, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithSupabaseToken = async (accessToken: string) => {
    const data = await apiFetch("/auth/supabase", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
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
    <AuthContext.Provider value={{ user, token, loading, login, register, loginWithSupabaseToken, logout }}>
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
