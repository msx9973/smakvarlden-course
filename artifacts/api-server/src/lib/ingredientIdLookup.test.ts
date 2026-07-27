import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { integer, pgTable, PgDialect } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { idsIn } from "./ingredientIdLookup.ts";

const stub = pgTable("ingredients", {
  id: integer("id").primaryKey(),
});

const dialect = new PgDialect();

describe("idsIn", () => {
  it("emits an IN-list predicate (not a broken ANY(row) constructor)", () => {
    const broken = dialect.sqlToQuery(sql`${stub.id} = ANY(${[1, 2, 3]})`);
    const fixed = dialect.sqlToQuery(idsIn(stub.id, [1, 2, 3]));

    // Drizzle expands JS arrays in sql`` to row constructors: ANY(($1, $2, $3)).
    // Postgres then errors: "op ANY/ALL (array) requires array on right side".
    assert.equal(broken.sql, '"ingredients"."id" = ANY(($1, $2, $3))');
    assert.equal(fixed.sql, '"ingredients"."id" in ($1, $2, $3)');
  });

  it("passes each id as a bound parameter", () => {
    const { params } = dialect.sqlToQuery(idsIn(stub.id, [10, 20, 30]));
    assert.deepEqual(params, [10, 20, 30]);
  });
});
