import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { supabase } from "../lib/supabase";

const router = Router();

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "smakvarlden-dev-secret-2025";
}

function signToken(user: { id: number; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, getSecret(), { expiresIn: "30d" });
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() };
}

function formatSupabaseUser(user: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: Record<string, string | undefined>;
}) {
  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    role: user.user_metadata?.role ?? "user",
    createdAt: user.created_at,
    provider: "supabase",
  };
}

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) return res.status(400).json({ error: "Fyll i namn, e-post och losenord." });
  if (password.length < 6) return res.status(400).json({ error: "Losenordet maste vara minst 6 tecken." });

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (existing.length > 0) return res.status(400).json({ error: "E-postadressen anvands redan." });

  const passwordHash = await bcrypt.hash(password, 12);
  const isFirstUser = (await db.select().from(usersTable).limit(1)).length === 0;

  const [user] = await db.insert(usersTable).values({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: isFirstUser ? "admin" : "user",
  }).returning();

  return res.status(201).json({ token: signToken(user), user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Fyll i e-post och losenord." });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) return res.status(401).json({ error: "Felaktig e-post eller losenord." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Felaktig e-post eller losenord." });

  return res.json({ token: signToken(user), user: formatUser(user) });
});

router.get("/auth/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Ej inloggad." });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getSecret()) as { id: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) return res.status(401).json({ error: "Anvandare hittades inte." });
    return res.json(formatUser(user));
  } catch {
    if (supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) return res.json(formatSupabaseUser(data.user));
    }
    return res.status(401).json({ error: "Ogiltig eller utgangen token." });
  }
});

export default router;
