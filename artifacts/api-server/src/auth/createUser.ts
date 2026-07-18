import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
};

/**
 * Serializes initial account creation so an empty database can promote exactly
 * one user to admin. The shared PostgreSQL lock also coordinates Express and
 * direct Lambda registration paths running in separate processes.
 */
export async function createUserWithInitialRole(values: NewUser) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1936549234, 1718185572)`);

    const [existingUser] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .limit(1);
    const [user] = await tx
      .insert(usersTable)
      .values({ ...values, role: existingUser ? "user" : "admin" })
      .returning();

    return user;
  });
}
