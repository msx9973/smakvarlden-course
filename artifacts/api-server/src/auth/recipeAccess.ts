import type { Request } from "express";
import { recipesTable } from "@workspace/db";
import { eq, isNull, or } from "drizzle-orm";

export function recipesAccessibleBy(req: Request) {
  const user = req.user!;
  return user.role === "admin"
    ? or(eq(recipesTable.userId, user.id), isNull(recipesTable.userId))!
    : eq(recipesTable.userId, user.id);
}
