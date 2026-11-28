# ORVEX PostgreSQL RLS implementation decision

Status: proposed implementation design; not yet deployed or enabled.

Last reviewed: 2026-11-28

## Objective

Enforce organization-level data isolation in PostgreSQL as a second layer behind API authentication and membership authorization. RLS must fail closed when no verified user context is present.

## Critical connection-role constraint

The backend currently creates one Prisma connection pool from `DATABASE_URL`. If that connection authenticates as the Supabase `postgres` role (or another table owner / BYPASSRLS role), merely enabling RLS policies does **not** protect queries made through that privileged connection.

Therefore, do not claim RLS protection until all of the following are true:

1. Backend database connections use a controlled role that is not a table owner and does not have `BYPASSRLS`, or explicitly switch into the Supabase `authenticated` role for each user-scoped transaction.
2. Each user-scoped transaction sets verified JWT claims transaction-locally (never with session-persistent `SET` / `set_config(..., false)`).
3. Every tenant-owned query executes inside that transaction and cannot fall back to an unscoped Prisma client.
4. Tests prove that a user cannot read or mutate another organization's rows, including after pooled connections are reused.

## Candidate transaction model

The current Supabase JWT guard verifies the access token signature, issuer, audience, expiry and subject. The API may pass only the verified `request.user.id` into a database-context helper.

For each user-scoped operation, the helper should:

- open a Prisma interactive transaction;
- set the database role to a non-owner role with RLS enforcement (validate the exact role and grants in the target Supabase project before use);
- set `request.jwt.claim.sub` and any required `request.jwt.claims` values with transaction-local scope;
- execute all related reads/writes through the transaction client;
- commit or roll back before returning the connection to the pool.

Never accept a user ID, role, organization membership or JWT claims from request body/query/header as the source of database identity. Identity must come from the verified Supabase token.

## RLS policy design

The initial schema contains `User`, `Organization`, `Membership`, `Invitation` and `AuditEvent`.

Before enabling policies, define and test table-specific rules:

- `User`: user can read/update only their own profile; privileged profile changes remain server-controlled.
- `Membership`: user can read their own memberships; membership creation, role changes and removal require dedicated server-authorized workflows.
- `Organization`: only current members can read; organization creation and administrative changes require explicit ownership checks.
- `Invitation`: only authorized organization administrators can read/create/revoke; invitation tokens are never exposed in audit metadata.
- `AuditEvent`: members may read only events for their organization subject to product policy; inserts are server-controlled and immutable to ordinary members.

Use both `USING` and `WITH CHECK` where applicable. Avoid broad `TO authenticated USING (true)` policies. Do not rely on a policy on one table to implicitly secure related tables.

## Required verification before deployment

- Apply migrations only to a non-production test project first.
- Inspect effective table grants and role attributes in Supabase; confirm the backend's effective role cannot bypass RLS.
- Add PostgreSQL integration tests with at least two users and two organizations.
- Test cross-tenant SELECT, INSERT, UPDATE and DELETE attempts.
- Test missing claims, malformed subject claims and connection-pool reuse between different users.
- Verify administrative workflows separately; never introduce a general-purpose service-role bypass into ordinary request handling.
- Run migration status and schema drift checks before production rollout.

## Current state

- Supabase JWT verification exists in the API.
- Organization membership checks exist at the application layer.
- Prisma currently uses a shared connection pool configured by `DATABASE_URL`.
- No RLS policies or transaction-scoped user context have been deployed.
- The initial schema migration has been generated but has not been applied to the user's Supabase project.
- Cross-tenant PostgreSQL integration tests do not yet exist.

## Release gate

Do not store real customer or tenant data until the database role strategy, RLS policies, transaction context and cross-tenant integration tests have been implemented and verified against PostgreSQL.
