import serverless from "serverless-http";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "./app";
import {
  PHONE_EMAIL_DOMAIN,
  assertSupabaseIdentityVerified,
  contactToStorageEmail,
  normalizeEmail,
  shouldClaimUnverifiedPasswordAccount,
} from "./lib/accountIdentity";

const expressHandler = serverless(app, { basePath: "/.netlify/functions/api" });

type LambdaEvent = {
  path?: string;
  rawPath?: string;
  httpMethod?: string;
  requestContext?: { http?: { method?: string } };
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
};

type LambdaContext = unknown;

type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is required but was not set.");
  return secret;
}

function signToken(user: { id: number; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, getSecret(), {
    expiresIn: "14d",
    issuer: "smakvarlden",
    audience: "smakvarlden-app",
  });
}

function verifyToken(token: string) {
  return jwt.verify(token, getSecret(), {
    issuer: "smakvarlden",
    audience: "smakvarlden-app",
  }) as { id: number };
}

function publicContact(email: string) {
  if (!email.endsWith(`@${PHONE_EMAIL_DOMAIN}`)) return email;
  const digits = email.slice("phone.".length, -(`@${PHONE_EMAIL_DOMAIN}`.length));
  return `+${digits}`;
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: publicContact(u.email), role: u.role, plan: u.plan, createdAt: u.createdAt.toISOString() };
}

function validatePassword(password: unknown) {
  if (typeof password !== "string") return "Fyll i lösenord.";
  if (password.length < 8) return "Lösenordet måste vara minst 8 tecken.";
  if (!/[A-Za-zÅÄÖåäö]/.test(password) || !/\d/.test(password)) {
    return "Lösenordet måste innehålla både bokstäver och siffror.";
  }
  return null;
}

function getHeader(event: LambdaEvent, name: string) {
  const headers = event.headers ?? {};
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return value;
  }
  return undefined;
}

function parseBody(event: LambdaEvent) {
  const encodedPayload = getHeader(event, "x-smakvarlden-payload");
  if (encodedPayload) {
    try {
      return JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf8"));
    } catch {
      return {};
    }
  }

  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

function requestPath(event: LambdaEvent) {
  const path = event.rawPath ?? event.path ?? "/";
  if (path.startsWith("/.netlify/functions/api")) {
    return path.slice("/.netlify/functions/api".length) || "/";
  }
  return path;
}

function requestMethod(event: LambdaEvent) {
  return (event.httpMethod ?? event.requestContext?.http?.method ?? "GET").toUpperCase();
}

function getSupabaseCredentials() {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

async function randomPasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("base64url"), 12);
}

async function claimUnverifiedAccount(
  existing: typeof usersTable.$inferSelect,
  name: string,
) {
  const passwordHash = await randomPasswordHash();
  const [updated] = await db.update(usersTable).set({
    passwordHash,
    emailVerified: true,
    name: name.trim().slice(0, 80) || existing.name,
  }).where(eq(usersTable.id, existing.id)).returning();
  return updated;
}

async function findOrCreateSupabaseUser(profile: SupabaseUser) {
  assertSupabaseIdentityVerified(profile);
  const normalizedEmail = profile.email ? normalizeEmail(profile.email) : null;
  const storageEmail = normalizedEmail ?? contactToStorageEmail(profile.phone) ?? `supabase.${profile.id}@${PHONE_EMAIL_DOMAIN}`;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, storageEmail));
  const fallbackName = normalizedEmail?.split("@")[0] ?? profile.phone ?? "Smakvärlden användare";
  const oauthName = (profile.user_metadata?.full_name ?? profile.user_metadata?.name ?? fallbackName).trim().slice(0, 80);

  if (existing) {
    if (shouldClaimUnverifiedPasswordAccount(existing)) {
      return claimUnverifiedAccount(existing, oauthName);
    }
    return existing;
  }

  const isFirstUser = (await db.select().from(usersTable).limit(1)).length === 0;
  const passwordHash = await randomPasswordHash();
  const [user] = await db.insert(usersTable).values({
    name: oauthName,
    email: storageEmail,
    passwordHash,
    role: isFirstUser ? "admin" : "user",
    emailVerified: true,
  }).returning();
  return user;
}

async function login(body: Record<string, unknown>) {
  const { email, identifier, phone, password } = body;
  const storageEmail = contactToStorageEmail(identifier ?? email ?? phone);
  if (!storageEmail || !password) return json(400, { error: "Fyll i e-post/telefon och lösenord." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, storageEmail));
  if (!user) return json(401, { error: "Felaktiga inloggningsuppgifter." });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return json(401, { error: "Felaktiga inloggningsuppgifter." });

  return json(200, { token: signToken(user), user: formatUser(user) });
}

async function register(body: Record<string, unknown>) {
  const { name, email, contact, identifier, phone, password } = body;
  const storageEmail = contactToStorageEmail(email ?? contact ?? identifier ?? phone);

  if (typeof name !== "string" || name.trim().length < 2 || !storageEmail || !password) {
    return json(400, { error: "Fyll i namn, e-post eller telefonnummer och lösenord." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return json(400, { error: passwordError });

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, storageEmail));
  if (existing.length > 0) return json(400, { error: "Kontot finns redan. Logga in istället." });

  const passwordHash = await bcrypt.hash(String(password), 12);
  const isFirstUser = (await db.select().from(usersTable).limit(1)).length === 0;
  const [user] = await db.insert(usersTable).values({
    name: name.trim().slice(0, 80),
    email: storageEmail,
    passwordHash,
    role: isFirstUser ? "admin" : "user",
    emailVerified: false,
  }).returning();

  return json(201, { token: signToken(user), user: formatUser(user) });
}

async function me(event: LambdaEvent) {
  const header = getHeader(event, "authorization");
  if (!header?.startsWith("Bearer ")) return json(401, { error: "Ej inloggad." });

  try {
    const payload = verifyToken(header.slice(7));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) return json(401, { error: "Användare hittades inte." });
    return json(200, formatUser(user));
  } catch {
    return json(401, { error: "Ogiltig eller utgången token." });
  }
}

async function supabase(body: Record<string, unknown>) {
  const credentials = getSupabaseCredentials();
  const { accessToken } = body;
  if (!credentials) return json(503, { error: "Supabase Auth är inte konfigurerat." });
  if (typeof accessToken !== "string" || accessToken.length < 20) return json(400, { error: "Supabase-session saknas." });

  try {
    const userResponse = await fetch(`${credentials.url}/auth/v1/user`, {
      headers: {
        apikey: credentials.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userResponse.ok) return json(401, { error: "Ogiltig Supabase-session." });

    const profile = await userResponse.json() as SupabaseUser;
    const user = await findOrCreateSupabaseUser(profile);
    return json(200, { token: signToken(user), user: formatUser(user) });
  } catch (err) {
    if (err instanceof Error && /verifierad|verifierat/i.test(err.message)) {
      return json(403, { error: err.message });
    }
    return json(500, { error: "Kunde inte verifiera Supabase-session." });
  }
}

export async function handler(event: LambdaEvent, context: LambdaContext) {
  const method = requestMethod(event);
  const path = requestPath(event);
  const body = parseBody(event);

  if (method === "POST" && path === "/api/auth/login") return login(body);
  if (method === "POST" && path === "/api/auth/register") return register(body);
  if (method === "POST" && path === "/api/auth/supabase") return supabase(body);
  if (method === "GET" && path === "/api/auth/me") return me(event);

  return expressHandler(event, context);
}
