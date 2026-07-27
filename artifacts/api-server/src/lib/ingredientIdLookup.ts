import { type SQL, inArray } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

/**
 * Match rows whose column value is in `ids`.
 *
 * Prefer this over `sql\`\${col} = ANY(\${ids})\``: drizzle expands a JS array in
 * `sql` templates to a row constructor `(1,2,3)`, which Postgres rejects for
 * ANY/ALL (those require a real array on the right-hand side).
 */
export function idsIn(column: AnyColumn, ids: number[]): SQL {
  return inArray(column, ids);
}
