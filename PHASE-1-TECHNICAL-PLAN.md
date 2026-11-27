# ORVEX — Phase 1 technical plan

**Status:** Proposed architecture; implementation has not started.  
**Scope:** PostgreSQL, Prisma, identity, organizations and tenant isolation.

## 1. Database and hosting
- Use managed PostgreSQL (Supabase PostgreSQL is the current preferred option).
- The NestJS backend is the only application allowed to connect to the database.
- Store `DATABASE_URL` only in the backend hosting environment (Render), never in frontend variables or Git.
- Use TLS for remote database connections and least-privilege credentials.
- Keep schema changes in versioned Prisma migrations; never rely on ad-hoc production schema edits.
- Separate local/development and production databases.

## 2. Initial relational model
Proposed entities:
- `User`: account identity, normalized unique email, password hash (if using local credentials), status and timestamps.
- `Organization`: tenant/company workspace, name, slug and timestamps.
- `Membership`: user-to-organization relationship, role, status and timestamps.
- `Invitation`: organization invitation, hashed token, expiry, accepted/revoked timestamps.
- `Session` or refresh-token records: hashed credentials, expiry, revocation and rotation metadata.
- `AuditEvent`: actor, organization scope, action, target type/id, safe metadata and timestamp.

Use stable UUID identifiers. Define indexes and uniqueness constraints explicitly (including normalized email and organization slug). Finalize exact fields after the user and organization flows are specified.

## 3. Tenant isolation — non-negotiable
- Every tenant-owned record must carry an `organizationId`.
- Every read, update and delete must be scoped by the authenticated user's active organization and verified membership.
- Never trust an organization ID supplied by the browser without checking membership and role.
- Authorization must be enforced in backend services, not only hidden in the UI.
- Add negative tests proving that a user in organization A cannot read or mutate organization B data.
- Consider PostgreSQL row-level security as defense in depth after the application-level model is tested; do not treat it as a substitute for authorization.

## 4. Authentication baseline
- Decide whether ORVEX owns password authentication or delegates identity to a trusted provider before implementation.
- If passwords are stored, use Argon2id (or an equivalently strong maintained password hashing implementation); never encrypt or store plaintext passwords.
- Require verified email before sensitive account actions.
- Password reset and invitation tokens must be random, single-use, stored hashed and expire.
- Prefer secure, HttpOnly, SameSite cookies for browser sessions; set Secure in production and define CSRF protections for cookie-authenticated state changes.
- Rotate and revoke sessions on password change, logout and security events.
- Rate-limit login, registration, verification and password-reset endpoints; avoid account-enumeration responses.
- Add tests for expiry, replay, revocation, brute-force throttling and unauthorized access.

## 5. Roles and permissions
Initial organization roles: `owner`, `admin`, `member`. Define explicit permission checks per action. A user's platform role (if any) must remain distinct from their organization role. Do not rely on frontend role flags.

## 6. Implementation sequence
1. User confirms/provisions the managed PostgreSQL project and keeps credentials private.
2. Add Prisma to the backend, configure schema and migration commands.
3. Implement health/readiness checks without leaking database details.
4. Add User, Organization, Membership and AuditEvent schema/migrations.
5. Implement authentication and session lifecycle.
6. Implement organization membership and role guards.
7. Add tenant-isolation integration tests and security tests.
8. Only then start customer, payment and other business modules.

## 7. Not included yet
No database has been provisioned, no Prisma dependency/schema/migration exists, no authentication or tenant isolation is implemented, and no production secrets are configured. This document is a design baseline, not a claim of completed functionality.
