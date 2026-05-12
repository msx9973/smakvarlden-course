import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const PHONE_EMAIL_DOMAIN = "phone.smakvarlden.local";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "smakvarlden-dev-secret-2025";
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
  return { id: u.id, name: u.name, email: publicContact(u.email), role: u.role, plan: u.plan, createdAt: u.createdAt.toISOString() };
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
  const decoded = jwt.decode(token) as { iss?: string; aud?: string } | null;
  if (!decoded?.iss && !decoded?.aud) return jwt.verify(token, getSecret()) as { id: number };
  return jwt.verify(token, getSecret(), {
    issuer: "smakvarlden",
    audience: "smakvarlden-app",
  }) as { id: number };
}

router.post("/auth/register", async (req, res) => {
  const { name, email, contact, identifier, phone, password } = req.body ?? {};
  const storageEmail = contactToStorageEmail(email ?? contact ?? identifier ?? phone);

  if (typeof name !== "string" || name.trim().length < 2 || !storageEmail || !password) {
    return res.status(400).json({ error: "Fyll i namn, e-post eller telefonnummer och lösenord." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, storageEmail));
  if (existing.length > 0) return res.status(400).json({ error: "Kontot finns redan. Logga in istället." });

  const passwordHash = await bcrypt.hash(password, 12);
  const isFirstUser = (await db.select().from(usersTable).limit(1)).length === 0;

  const [user] = await db.insert(usersTable).values({
    name: name.trim().slice(0, 80),
    email: storageEmail,
    passwordHash,
    role: isFirstUser ? "admin" : "user",
  }).returning();

  return res.status(201).json({ token: signToken(user), user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, identifier, phone, password } = req.body ?? {};
  const storageEmail = contactToStorageEmail(identifier ?? email ?? phone);
  if (!storageEmail || !password) return res.status(400).json({ error: "Fyll i e-post/telefon och lösenord." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, storageEmail));
  if (!user) return res.status(401).json({ error: "Felaktiga inloggningsuppgifter." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Felaktiga inloggningsuppgifter." });

  return res.json({ token: signToken(user), user: formatUser(user) });
});

router.get("/auth/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Ej inloggad." });
  try {
    const payload = verifyToken(header.slice(7));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) return res.status(401).json({ error: "Användare hittades inte." });
    return res.json(formatUser(user));
  } catch {
    return res.status(401).json({ error: "Ogiltig eller utgången token." });
  }
});

export default router;
