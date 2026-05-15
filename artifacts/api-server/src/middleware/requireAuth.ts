import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request { user?: typeof usersTable.$inferSelect; }
  }
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is required but was not set.");
  return s;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Ej inloggad." });
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, getSecret(), { issuer: "smakvarlden", audience: "smakvarlden-app" }) as { id: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) return res.status(401).json({ error: "Användare hittades inte." });
    req.user = user;
    return next();
  } catch { return res.status(401).json({ error: "Ogiltig eller utgången token." }); }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, getSecret(), { issuer: "smakvarlden", audience: "smakvarlden-app" }) as { id: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (user) req.user = user;
  } catch {}
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Åtkomst nekad." });
  return next();
}
