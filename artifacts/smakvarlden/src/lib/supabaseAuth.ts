const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseAuth = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseSessionResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
};

function authUrl(path: string) {
  if (!supabaseUrl) throw new Error("Supabase saknar URL.");
  return `${supabaseUrl}/auth/v1${path}`;
}

async function supabaseFetch(path: string, init: RequestInit) {
  if (!supabaseAnonKey) throw new Error("Supabase saknar anon key.");
  const res = await fetch(authUrl(path), {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({})) as SupabaseSessionResponse;
  if (!res.ok) {
    throw new Error(data.error_description ?? data.msg ?? data.error ?? "Supabase Auth misslyckades.");
  }
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const data = await supabaseFetch("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!data.access_token) throw new Error("Inloggningen saknar session.");
  return data.access_token;
}

export async function signUpWithPassword(name: string, email: string, password: string) {
  const data = await supabaseFetch("/signup", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { name: name.trim() },
    }),
  });
  if (!data.access_token) {
    throw new Error("Kontrollera din e-post för att verifiera kontot och logga sedan in.");
  }
  return data.access_token;
}

export async function sendPasswordReset(email: string) {
  await supabaseFetch("/recover", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      redirect_to: `${window.location.origin}/login`,
    }),
  });
}

export function startSupabaseGoogleLogin() {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase Auth är inte konfigurerat.");
  const url = new URL(authUrl("/authorize"));
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", `${window.location.origin}/login`);
  window.location.href = url.toString();
}

export function readSupabaseAccessTokenFromUrl() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const token = hash.get("access_token") ?? query.get("access_token");
  if (!token) return null;
  window.history.replaceState({}, "", window.location.pathname);
  return token;
}
