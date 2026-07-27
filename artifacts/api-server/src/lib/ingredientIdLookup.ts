import { inArray, SQL } from "drizzle-orm";
import { ingredientsTable } from "@workspace/db";

/**
 * Build a WHERE condition that matches ingredient rows by id.
 *
 * Prefer this over `sql\`id = ANY(${ids})\``: drizzle expands a JS array in
 * `sql` templates to a row constructor `(1,2,3)`, which Postgres rejects for
 * ANY/ALL (those require a real array on the right-hand side).
 */
export function ingredientIdsIn(ids: number[]): SQL {
  return inArray(ingredientsTable.id, ids);
}
