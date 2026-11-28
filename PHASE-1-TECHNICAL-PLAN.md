# ORVEX — Phase 1 technical plan

**Status:** In progress. The database schema and first authorization building block are in the repository; production dependency audits and CI pass. Authentication, enforced tenant isolation and migrations remain incomplete.

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
- `User`: email, normalized unique email, optional password hash, status and timestamps.
- `Organization`: tenant workspace, name, unique slug and timestamps.
- `Membership`: user-to-organization relation, role and timestamps; unique user/organization pair.
- `Invitation`: organization invitation with hashed token, expiry and revocation/acceptance timestamps.
- `Session`: hashed session token, expiry and revocation timestamp.
- `AuditEvent`: optional organization and actor references, action, target metadata and timestamp.

The schema is a first foundation and must be reviewed before its first migration is applied to Supabase. Production dependency overrides currently resolve PostCSS to 8.5.34 and Effect to 3.22.5; `npm audit --omit=dev` passes for both applications.

## 3. Tenant isolation — non-negotiable
- Every tenant-owned record must carry an `organizationId`.
- Every read, update and delete must be scoped by the authenticated user's active organization and verified membership.
- Never trust an organization ID supplied by the browser without checking membership and role.
- Authorization must be enforced in backend services, not only hidden in the UI.
- The first `OrganizationAccessService` now checks membership using the composite `userId + organizationId` key and enforces OWNER/ADMIN/MEMBER role requirements.
- This helper is not yet wired to authenticated routes and does not by itself complete tenant isolation.
- Add negative integration tests proving that a user in organization A cannot read or mutate organization B data.
- Add PostgreSQL Row-Level Security as defense in depth, using transaction-scoped tenant context; never rely on a session-level setting that can leak across pooled connections.

## 4. Authentication baseline
- Decide whether ORVEX owns password authentication or delegates identity to a trusted provider before implementing login.
- If passwords are stored, use Argon2id (or an equivalently strong maintained password hashing implementation); never encrypt or store plaintext passwords.
- Require verified email before sensitive account actions.
- Password reset and invitation tokens must be random, single-use, stored hashed and expire.
- Prefer secure, HttpOnly, SameSite cookies for browser sessions; set Secure in production and define CSRF protections for cookie-authenticated state changes.
- Rotate and revoke sessions on password change, logout and security events.
- Rate-limit login, registration, verification and password-reset endpoints; avoid account-enumeration responses.
- Add tests for expiry, replay, revocation, brute-force throttling and unauthorized access.

## 5. Roles and permissions
Initial organization roles: `OWNER`, `ADMIN`, `MEMBER`. Define explicit permission checks per action. A platform-level role (if introduced) must remain distinct from organization roles. Never rely on frontend role flags.

## 6. Implementation sequence
1. Prisma 7, PostgreSQL adapter and initial schema — integrated; CI build, tests and production dependency audits pass (workflow #52).
2. Generate and review the initial SQL migration without connecting to or modifying the production database — generated and committed in `backend/prisma/migrations/20261128000000_initial/`; not applied to Supabase.
3. Add a readiness check that reports database availability without exposing credentials or internal error details.
4. Apply the reviewed migration to Supabase only after explicit owner approval and private credential configuration.
5. Choose and implement the authentication provider and secure session lifecycle.
6. Add authenticated request context and organization membership/role guards.
7. Implement transaction-safe tenant context and PostgreSQL RLS policies.
8. Add cross-tenant integration tests and security tests.
9. Only then start customer, payment and other business modules.

## 7. Current environment and safety
The owner has a Supabase project and has located its Session Pooler connection URI. The password and full connection string must remain private and have not been added to the repository. No migration has been applied to Supabase. No production hosting secrets are configured. The dashboard and module catalogue remain demo/planned features, not production functionality.
