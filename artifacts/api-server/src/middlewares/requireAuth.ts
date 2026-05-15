import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Extend Express Request so downstream routes can access req.user safely
declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
    }
  }
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Crash loudly at startup — never use a hardcoded fallback in production
    throw new Error("SESSION_SECRET environment variable is required but was not set.");
  }
  return secret;
}

/**
 * Middleware that requires a valid Bearer JWT.
 * Attaches the full user record to req.user.
 * Returns 401 if the token is missing, malformed, expired, or the user no longer exists.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Ej inloggad." });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, getSecret(), {
      issuer: "smakvarlden",
      audience: "smakvarlden-app",
    }) as { id: number };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) return res.status(401).json({ error: "Användare hittades inte." });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Ogiltig eller utgången token." });
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present,
 * but does NOT block requests without one. Use for public pages
 * that show extra info when logged in (e.g. community).
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, getSecret(), {
      issuer: "smakvarlden",
      audience: "smakvarlden-app",
    }) as { id: number };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (user) req.user = user;
  } catch {
    // Ignore invalid tokens on optional routes
  }
  return next();
}

/**
 * Middleware that requires the authenticated user to have the "admin" role.
 * Must be used AFTER requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Åtkomst nekad." });
  }
  return next();
}
