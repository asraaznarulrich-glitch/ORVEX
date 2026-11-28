# ORVEX — Phase 0 and Phase 1 checklist

## Phase 0 — application foundation

### Implemented
- [x] Separate root-level `frontend/` (Next.js) and `backend/` (NestJS API) applications.
- [x] TypeScript strict checks configured for both applications.
- [x] Versioned API prefix: `/api/v1`.
- [x] Global request validation configured in the API.
- [x] CORS allowlist with a local-development fallback and production startup guard.
- [x] Startup validation for CORS origins and the API port.
- [x] Graceful shutdown hooks enabled.
- [x] Safe environment examples for frontend and backend.
- [x] GitHub Actions workflows for frontend and backend typechecks, production builds and smoke tests.
- [x] Reproducible npm lockfiles and clean `npm ci` installs.
- [x] Production dependency audits pass for frontend and backend (`npm audit --omit=dev`).
- [x] Vulnerable PostCSS and Effect dependency versions are overridden and locked to patched releases.
- [x] Deployment instructions for separate Netlify and Render services.

### Verification
- [x] Frontend TypeScript check, production build and runtime smoke test passed in GitHub Actions.
- [x] Backend TypeScript check, production build and API smoke tests passed in GitHub Actions.
- [x] API startup tests reject missing production CORS origins, malformed CORS origins and invalid ports.
- [x] Latest quality workflow #75 passed on commit `063297b6` (frontend and backend).
- [x] Lockfile workflow #10 passed; the initial migration was generated without connecting to Supabase.
- [ ] Review actual Netlify and Render configuration after services are created.
- [ ] Complete live deployment smoke tests.

## Phase 1 — database, identity and tenant security

### Implemented in the repository
- [x] Prisma ORM 7 and PostgreSQL driver adapter added to the backend.
- [x] User profile IDs mirror Supabase Auth user UUIDs; local password hashes and duplicate session storage were removed from the schema.
- [x] Initial relational schema drafted for User, Organization, Membership, Invitation and AuditEvent.
- [x] Prisma client generation integrated into backend typecheck and build.
- [x] Prisma service manages database connection lifecycle; production startup requires `DATABASE_URL`.
- [x] Organization membership authorization service checks the user-and-organization composite key.
- [x] Organization role authorization supports OWNER, ADMIN and MEMBER roles.
- [x] Unit-level authorization tests added for tenant membership lookup and role enforcement.
- [x] Backend verifies Supabase JWTs against the project's public JWKS using ES256/RS256/EdDSA, with issuer, audience, expiry, issued-at, subject and role checks.
- [x] Global default-deny authentication guard added; only health and static module-catalogue routes are explicitly public.
- [x] Verified user context decorator and unit tests for bearer parsing, public bypass, missing credentials and verified identity attachment.

### Not yet implemented or verified
- [x] Confirm GitHub Actions verifies organization authorization tests, builds and production dependency audits.
- [x] Generate and review the initial Prisma SQL migration from the Prisma 7 schema; the SQL and PostgreSQL migration lock are committed.
- [ ] Apply the reviewed migration to the Supabase project only after a separate confirmation.
- [ ] Connect the frontend to Supabase Auth for sign-up, sign-in, sign-out, session refresh, email verification and password reset.
- [ ] Confirm Supabase is issuing ES256 or RS256 access tokens and configure `SUPABASE_URL` privately in Render.
- [ ] Synchronize verified Supabase Auth users into the ORVEX `User` profile table.
- [ ] Enforce organization checks on every tenant-owned route and add organization-scoped API endpoints.
- [ ] Add PostgreSQL Row-Level Security as defense in depth, with safe transaction-scoped tenant context.
- [ ] Add integration tests proving organization A cannot read or mutate organization B data.
- [ ] Add rate limiting, CSRF protection where cookie sessions are used, and security audit coverage.

A green CI run does not mean that authentication, tenant isolation or production security is complete. Do not use the current API for real customer data.
