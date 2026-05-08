import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  role: "user" | "admin" | string;
  createdAt: string;
  provider?: "local" | "supabase";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  supabaseEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "smakvarlden_token";
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

function mapSupabaseUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    role: user.user_metadata?.role ?? "user",
    createdAt: user.created_at,
    provider: "supabase",
  };
}

async function getAuthToken() {
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Nagot gick fel.");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            if (!isMounted) return;
            localStorage.removeItem(TOKEN_KEY);
            setToken(data.session.access_token);
            setUser(mapSupabaseUser(data.session.user));
            setLoading(false);
            return;
          }
        }

        const localToken = localStorage.getItem(TOKEN_KEY);
        if (!localToken) {
          if (isMounted) setLoading(false);
          return;
        }

        const currentUser = await apiFetch("/auth/me");
        if (!isMounted) return;
        setToken(localToken);
        setUser({ ...currentUser, provider: currentUser.provider ?? "local" });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(session?.access_token ?? null);
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({ ...data.user, provider: "local" });
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({ ...data.user, provider: "local" });
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase is not configured yet.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    if (supabase) await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, supabaseEnabled: isSupabaseConfigured, login, register, loginWithGoogle, logout }}>
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
