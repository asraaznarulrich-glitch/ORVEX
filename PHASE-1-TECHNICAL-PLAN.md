# ORVEX — Phase 1 technical plan

**Status:** In progress. The database schema, Supabase JWT authentication guard and first organization authorization building block are in the repository; full dependency audits and CI pass. Profile synchronization, enforced tenant isolation and production migration remain incomplete.

## 1. Database and hosting
- Managed PostgreSQL via the existing Supabase project.
- The NestJS backend is the only application allowed to connect to PostgreSQL.
- Store `DATABASE_URL` only in the backend hosting environment (Render), never in frontend variables, source control or chat.
- Use TLS for remote database connections and least-privilege credentials.
- Keep schema changes in versioned Prisma migrations; never rely on ad-hoc production schema edits.
- Separate development and production databases.
- Prisma ORM 7 with the PostgreSQL driver adapter is integrated. The database connection is disabled in local/test mode when no URL is present; production startup fails closed without `DATABASE_URL`.

## 2. Initial relational model
The current Prisma schema contains:
- `User`: Supabase Auth UUID, email, normalized unique email, profile status and timestamps; no local password hash.
- `Organization`: tenant workspace, name, unique slug and timestamps.
- `Membership`: user-to-organization relation, role and timestamps; unique user/organization pair.
- `Invitation`: organization invitation with hashed token, expiry and revocation/acceptance timestamps.
- `AuditEvent`: optional organization and actor references, action, target metadata and timestamp. Supabase Auth owns passwords and authentication sessions; there is no duplicate ORVEX session table.

The schema is a first foundation and must be reviewed before its first migration is applied to Supabase. The full `npm audit` runs pass for both applications, including development dependencies. PostCSS, Effect, glob and minimatch are locked to patched dependency versions.

## 3. Tenant isolation — non-negotiable
- Every tenant-owned record must carry an `organizationId`.
- Every read, update and delete must be scoped by the authenticated user's active organization and verified membership.
- Never trust an organization ID supplied by the browser without checking membership and role.
- Authorization must be enforced in backend services, not only hidden in the UI.
- The first `OrganizationAccessService` now checks membership using the composite `userId + organizationId` key and enforces OWNER/ADMIN/MEMBER role requirements.
- The helper is wired to the authenticated `/organizations/:organizationId/access` endpoint; future tenant-owned data routes still need the same protection and integration tests.
- The authenticated `/organizations/:organizationId/access` endpoint now uses `OrganizationAccessGuard`; every future tenant-owned controller must use the same guard or equivalent service checks.
- Add negative integration tests proving that a user in organization A cannot read or mutate organization B data.
- Add PostgreSQL Row-Level Security as defense in depth, using transaction-scoped tenant context; never rely on a session-level setting that can leak across pooled connections.

## 4. Authentication baseline
- Supabase Auth is the selected identity provider. ORVEX does not store passwords or duplicate Supabase sessions; the profile `User.id` mirrors the UUID from `auth.users`.
- Configure Supabase Auth to require verified email before sensitive account actions; complete frontend signup, confirmation and password-reset flows.
- Password reset and invitation tokens must be random, single-use, stored hashed and expire.
- Let the Supabase client manage its supported browser session lifecycle; select the SSR/cookie integration before production and apply CSRF protections to cookie-authenticated state changes.
- Rotate and revoke sessions on password change, logout and security events.
- Rate-limit login, registration, verification and password-reset endpoints; avoid account-enumeration responses.
- The backend now verifies access-token signatures through the Supabase JWKS endpoint (ES256/RS256), and checks issuer, audience, expiry, issued-at, subject UUID, authenticated role and future-issued-token rejection. Malformed bearer tokens and tokens over 8 KB are rejected before verification. A global default-deny guard protects routes unless explicitly marked public.
- Configure `SUPABASE_URL` in Render and confirm an asymmetric ES256/RS256 signing key is active. The backend intentionally does not accept legacy HS256 tokens through JWKS.
- A global baseline rate limit (120 requests per minute per client IP) and Helmet security headers are enabled; production trusts one reverse-proxy hop for client IP detection. CORS credential sharing is disabled because the API currently uses bearer tokens, not cookies.
- Add stricter endpoint-specific limits for signup, sign-in, verification and password reset when those flows are implemented.
- Add tests for session expiry/revocation, brute-force throttling and unauthorized access.

## 5. Roles and permissions
Initial organization roles: `OWNER`, `ADMIN`, `MEMBER`. Define explicit permission checks per action. A platform-level role (if introduced) must remain distinct from organization roles. Never rely on frontend role flags.

## 6. Implementation sequence
1. Prisma 7, PostgreSQL adapter and initial schema — integrated; latest CI workflow #116 passes full dependency audits, TypeScript checks, builds, tests and Prisma validation.
2. Generate and review the initial SQL migration without connecting to or modifying the production database — generated and committed in `backend/prisma/migrations/20261128000000_initial/`; not applied to Supabase.
3. Add a readiness check that reports database availability without exposing credentials or internal error details.
4. Apply the reviewed migration to Supabase only after explicit owner approval and private credential configuration.
5. Connect the frontend to Supabase Auth and configure email confirmation, password reset and session refresh.
6. Synchronize verified Supabase identities into the ORVEX profile table; add authenticated request context and organization membership/role guards.
7. Implement transaction-safe tenant context and PostgreSQL RLS policies.
8. Add cross-tenant integration tests and security tests.
9. Only then start customer, payment and other business modules.

## 7. Current environment and safety
The owner has a Supabase project and has located its Session Pooler connection URI. The password and full connection string must remain private and have not been added to the repository. No migration has been applied to Supabase. No production hosting secrets are configured. The dashboard and module catalogue remain demo/planned features, not production functionality.
