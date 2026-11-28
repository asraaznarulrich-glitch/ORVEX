import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

test("PostgreSQL RLS isolates users and clears transaction-local identity", {
  skip: !databaseUrl,
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const userA = randomUUID();
  const userB = randomUUID();
  const orgA = randomUUID();
  const orgB = randomUUID();
  const membershipA = randomUUID();
  const membershipB = randomUUID();
  const slugA = `rls-test-a-${randomUUID()}`;
  const slugB = `rls-test-b-${randomUUID()}`;

  try {
    await pool.query(
      'INSERT INTO "User" (id, email, "emailNormalized", status) VALUES ($1, $2, $2, \'ACTIVE\'), ($3, $4, $4, \'ACTIVE\')',
      [userA, `${userA}@orvex.test`, userB, `${userB}@orvex.test`],
    );
    await pool.query(
      'INSERT INTO "Organization" (id, name, slug) VALUES ($1, \'RLS A\', $2), ($3, \'RLS B\', $4)',
      [orgA, slugA, orgB, slugB],
    );
    await pool.query(
      'INSERT INTO "Membership" (id, "userId", "organizationId", role) VALUES ($1, $2, $3, \'OWNER\'), ($4, $5, $6, \'MEMBER\')',
      [membershipA, userA, orgA, membershipB, userB, orgB],
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE authenticated");
      await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userA]);

      const visibleUsers = await client.query('SELECT id FROM "User" ORDER BY id');
      assert.deepEqual(visibleUsers.rows.map((row) => row.id), [userA]);

      const visibleOrganizations = await client.query('SELECT id FROM "Organization" ORDER BY id');
      assert.deepEqual(visibleOrganizations.rows.map((row) => row.id), [orgA]);

      const visibleMemberships = await client.query('SELECT id FROM "Membership" ORDER BY id');
      assert.deepEqual(visibleMemberships.rows.map((row) => row.id), [membershipA]);

      await assert.rejects(
        client.query('INSERT INTO "Organization" (name, slug) VALUES (\'Forbidden\', $1)', [`forbidden-${randomUUID()}`]),
        (error) => error.code === "42501",
      );
      await client.query("ROLLBACK");

      // A fresh transaction on a pooled connection must not inherit the previous identity.
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE authenticated");
      const withoutClaims = await client.query('SELECT id FROM "Membership"');
      assert.equal(withoutClaims.rowCount, 0);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  } finally {
    await pool.query('DELETE FROM "Membership" WHERE id = ANY($1::uuid[])', [[membershipA, membershipB]]);
    await pool.query('DELETE FROM "Organization" WHERE id = ANY($1::uuid[])', [[orgA, orgB]]);
    await pool.query('DELETE FROM "User" WHERE id = ANY($1::uuid[])', [[userA, userB]]);
    await pool.end();
  }
});
