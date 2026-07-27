import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sql } from "drizzle-orm";
import { ingredientsTable } from "@workspace/db";
import { ingredientIdsIn } from "./ingredientIdLookup.ts";

describe("ingredientIdsIn", () => {
  it("emits an IN-list predicate (not a broken ANY(row) constructor)", () => {
    const broken = sql`${ingredientsTable.id} = ANY(${[1, 2, 3]})`;
    const fixed = ingredientIdsIn([1, 2, 3]);

    // Drizzle expands JS arrays in sql`` to row constructors: ANY(($1, $2, $3)).
    // Postgres then errors: "op ANY/ALL (array) requires array on right side".
    const brokenSql = broken.toSQL().sql;
    assert.match(brokenSql, /ANY/i);
    assert.match(brokenSql, /\(/);
    assert.doesNotMatch(brokenSql, /IN\s*\(/i);

    const fixedSql = fixed.toSQL().sql;
    assert.match(fixedSql, /in/i);
    assert.doesNotMatch(fixedSql, /ANY/i);
  });

  it("passes each id as a bound parameter", () => {
    const { params } = ingredientIdsIn([10, 20, 30]).toSQL();
    assert.deepEqual(params, [10, 20, 30]);
  });
});
