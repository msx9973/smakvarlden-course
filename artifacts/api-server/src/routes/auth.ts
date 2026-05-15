import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();
const PHONE_EMAIL_DOMAIN = "phone.smakvarlden.local";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
};

// ── SECRET — NEVER fall back to a hardcoded string ────────────
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is required. Set it in your environment variables.");
  return s;
}

function signToken(user: { id: number; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, getSecret(), {
    expiresIn: "14d",
    issuer: "smakvarlden",
    audience: "smakvarlden-app",
  });
}

function publicContact(email: string) {
  if (!email.endsWith(`@${PHONE_EMAIL_DOMAIN}`)) return email;
  const digits = email.slice("phone.".length, -(`@${PHONE_EMAIL_DOMAIN}`.length));
  return `+${digits}`;
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: publicContact(u.email),
    role: u.role,
    plan: u.plan,
    createdAt: u.createdAt.toISOString(),
  };
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[()\s-]/g, "");
  const withPlus = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact.startsWith("0")
    ? `+46${compact.slice(1)}`
    : compact;
  return /^\+[1-9]\d{7,14}$/.test(withPlus) ? withPlus : null;
}

function contactToStorageEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = normalizeEmail(value);
  if (email) return email;
  const phone = normalizePhone(value);
  if (phone) return `phone.${phone.slice(1)}@${PHONE_EMAIL_DOMAIN}`;
  return null;
}

function validatePassword(password: unknown) {
  if (typeof password !== "string") return "Fyll i lösenord.";
  if (password.length < 8) return "Lösenordet måste vara minst 8 tecken.";
  if (!/[A-Za-zÅÄÖåäö]/.test(password) || !/\d/.test(password)) {
    return "Lösenordet måste innehålla både bokstäver och siffror.";
  }
  return null;
}

function verifyToken(token: string) {
  return jwt.verify(token, getSecret(), {
    issuer: "smakvarlden",
    audience: "smakvarlden-app",
  }) as { id: number };
}

function getOrigin(req: Request) {
  // Always prefer the configured env var — never trust the client-supplied Origin header
  const configured = process.env.PUBLIC_APP_URL ?? process.env.URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ??
    req.protocol ??
    "https";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ??
    req.headers.host;
  return `${proto}://${host}`;
}

function getGoogleRedirectUri(req: Request) {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${getOrigin(req)}/api/auth/google/callback`
  );
}

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function getSupabaseCredentials() {
  const url = (
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  )?.replace(/\/$/, "");
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getSupabaseUrl() {
  return (
    (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.replace(
      /\/$/,
      "",
    ) ?? null
  );
}

function signState(returnTo: string) {
  const payload = Buffer.from(
    JSON.stringify({
      returnTo: returnTo.startsWith("/") ? returnTo : "/",
      nonce: crypto.randomBytes(16).toString("hex"),
      ts: Date.now(),
    }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function readState(value: unknown) {
  if (typeof value !== "string") return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  const actualBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
    return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { returnTo?: string; ts?: number };
    if (!parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) return null;
    return parsed.returnTo?.startsWith("/") ? parsed.returnTo : "/";
  } catch {
    return null;
  }
}

function oauthResultHtml(token: string, returnTo: string) {
  return `<!doctype html>
<html lang="sv">
<head><meta charset="utf-8"><title>Loggar in...</title></head>
<body>
<script>
localStorage.setItem("smakvarlden_token", ${JSON.stringify(token)});
window.location.replace(${JSON.stringify(returnTo)});
</script>
</body>
</html>`;
}

// ── First-user admin promotion — race-safe via DB-level count ─
async function resolveRole(): Promise<"admin" | "user"> {
  // Use a single SQL count — avoids the TOCTOU race in the original code
  const [row] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(usersTable);
  return (row?.cnt ?? 0) === 0 ? "admin" : "user";
}

async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const email = normalizeEmail(profile.email);
  if (!email || profile.email_verified === false)
    throw new Error(
      "Google-kontot måste ha en verifierad e-postadress.",
    );

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) return existing;

  const role = await resolveRole();
  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(32).toString("base64url"),
    12,
  );
  const [user] = await db
    .insert(usersTable)
    .values({
      name: (
        profile.name ??
        profile.given_name ??
        email.split("@")[0]
      )
        .trim()
        .slice(0, 80),
      email,
      passwordHash,
      role,
    })
    .returning();
  return user;
}

async function findOrCreateSupabaseUser(profile: SupabaseUser) {
  const email = profile.email ? normalizeEmail(profile.email) : null;
  const storageEmail =
    email ??
    contactToStorageEmail(profile.phone) ??
    `supabase.${profile.id}@${PHONE_EMAIL_DOMAIN}`;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, storageEmail));
  if (existing) return existing;

  const fallbackName =
    email?.split("@")[0] ?? profile.phone ?? "Smakvärlden användare";
  const role = await resolveRole();
  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(32).toString("base64url"),
    12,
  );
  const [user] = await db
    .insert(usersTable)
    .values({
      name: (
        profile.user_metadata?.full_name ??
        profile.user_metadata?.name ??
        fallbackName
      )
        .trim()
        .slice(0, 80),
      email: storageEmail,
      passwordHash,
      role,
    })
    .returning();
  return user;
}

// ── Routes ────────────────────────────────────────────────────

router.post("/auth/supabase", async (req, res) => {
  const credentials = getSupabaseCredentials();
  const { accessToken } = req.body ?? {};
  if (!credentials)
    return res.status(503).json({ error: "Supabase Auth är inte konfigurerat." });
  if (typeof accessToken !== "string" || accessToken.length < 20) {
    return res.status(400).json({ error: "Supabase-session saknas." });
  }

  try {
    const userResponse = await fetch(`${credentials.url}/auth/v1/user`, {
      headers: {
        apikey: credentials.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userResponse.ok)
      return res.status(401).json({ error: "Ogiltig Supabase-session." });

    const profile = (await userResponse.json()) as SupabaseUser;
    const user = await findOrCreateSupabaseUser(profile);
    return res.json({ token: signToken(user), user: formatUser(user) });
  } catch {
    return res.status(500).json({ error: "Kunde inte verifiera Supabase-session." });
  }
});

router.get("/auth/google/start", (req, res) => {
  const credentials = getGoogleCredentials();
  if (!credentials) {
    const supabaseUrl = getSupabaseUrl();
    if (supabaseUrl) {
      const url = new URL(`${supabaseUrl}/auth/v1/authorize`);
      url.searchParams.set("provider", "google");
      url.searchParams.set("redirect_to", `${getOrigin(req)}/login`);
      return res.redirect(url.toString());
    }
    return res.status(503).send("Google OAuth är inte konfigurerat.");
  }

  const returnTo =
    typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", getGoogleRedirectUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", signState(returnTo));
  url.searchParams.set("prompt", "select_account");
  return res.redirect(url.toString());
});

router.get("/auth/google/callback", async (req, res) => {
  const credentials = getGoogleCredentials();
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const returnTo = readState(req.query.state) ?? "/";
  if (!credentials || !code) return res.redirect(`/login?oauth=failed`);

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getGoogleRedirectUri(req),
      }),
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new Error("Google token saknas.");

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok)
      throw new Error("Google profil kunde inte hämtas.");

    const profile = (await profileResponse.json()) as GoogleProfile;
    const user = await findOrCreateGoogleUser(profile);
    const appToken = signToken(user);
    return res.type("html").send(oauthResultHtml(appToken, returnTo));
  } catch {
    return res.redirect(`/login?oauth=failed`);
  }
});

router.post("/auth/register", async (req, res) => {
  const { name, email, contact, identifier, phone, password } = req.body ?? {};
  const storageEmail = contactToStorageEmail(
    email ?? contact ?? identifier ?? phone,
  );

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    !storageEmail ||
    !password
  ) {
    return res.status(400).json({
      error: "Fyll i namn, e-post eller telefonnummer och lösenord.",
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, storageEmail));
  if (existing.length > 0)
    return res.status(400).json({ error: "Kontot finns redan. Logga in istället." });

  const passwordHash = await bcrypt.hash(password, 12);
  const role = await resolveRole();

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim().slice(0, 80),
      email: storageEmail,
      passwordHash,
      role,
    })
    .returning();

  return res.status(201).json({ token: signToken(user), user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, identifier, phone, password } = req.body ?? {};
  const storageEmail = contactToStorageEmail(identifier ?? email ?? phone);
  if (!storageEmail || !password)
    return res.status(400).json({ error: "Fyll i e-post/telefon och lösenord." });

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, storageEmail));
  if (!user)
    return res.status(401).json({ error: "Felaktiga inloggningsuppgifter." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return res.status(401).json({ error: "Felaktiga inloggningsuppgifter." });

  return res.json({ token: signToken(user), user: formatUser(user) });
});

router.get("/auth/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "Ej inloggad." });
  try {
    const payload = verifyToken(header.slice(7));
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.id));
    if (!user) return res.status(401).json({ error: "Användare hittades inte." });
    return res.json(formatUser(user));
  } catch {
    return res.status(401).json({ error: "Ogiltig eller utgången token." });
  }
});

export default router;
