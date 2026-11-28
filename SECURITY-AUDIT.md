# ORVEX security audit

Last reviewed: 2026-11-28

## Scope

Repository-level review of the Next.js frontend, NestJS API, npm dependency trees, authentication and authorization code, database schema and migrations, HTTP configuration, and GitHub Actions workflows.

This is an engineering review, not a penetration test or a certification.

## Findings addressed

- The backend development dependency tree contained three moderate npm audit findings associated with vulnerable `glob` and `minimatch` versions pulled by the NestJS CLI toolchain. The backend now overrides `glob` to the patched 14.x line; the regenerated lockfile resolves `glob@14.0.6` and `minimatch@11.0.9`.
- The API now rejects malformed, non-JWT and oversized bearer credentials (over 8 KB) before signature verification. The organization guard validates the organization UUID before making a database query.
- Supabase JWT verification validates the signature against the project's JWKS, issuer, audience, allowed algorithms, expiry, issued-at, subject UUID and authenticated role. Tokens issued too far in the future are rejected.
- Automated cryptographic tests use a temporary local JWKS server and generated signing keys. They verify a valid token and reject a forged signature, wrong issuer, wrong audience, expired token, future-issued token, wrong role, invalid subject and missing issued-at claim. They do not require production Supabase credentials.
- Cross-origin credentialed requests are disabled while ORVEX uses bearer tokens and has no cookie-based session flow.
- GitHub Actions are pinned to immutable commit SHAs, use read-only repository permissions for build/audit jobs, and disable persisted checkout credentials.
- Lockfile maintenance is isolated in a dedicated workflow. It uses `--ignore-scripts`, does not run builds or tests while the write-scoped token is present, and only commits lockfiles.
- Dependabot is configured for weekly npm and GitHub Actions updates.
- The API applies baseline rate limiting, Helmet response headers, strict CORS origin parsing, DTO validation, and production configuration checks.

## Verification status

The full `npm audit` runs now pass for both frontend and backend, including development dependencies. The backend findings were three moderate alerts associated with `glob` and `minimatch`; the lockfile now resolves `glob@14.0.6` and `minimatch@11.0.9`.

GitHub Actions workflow #116 passed on commit `29f7a6ea`: clean installs, full dependency audits, TypeScript checks, production builds, all automated tests, Prisma schema validation and initial migration-file checks. Both frontend and backend jobs passed.

## Remaining risks and work

- No production Supabase migration has been applied.
- PostgreSQL row-level security (RLS) and transaction-scoped tenant context are not implemented.
- Organization authorization has unit tests, but cross-tenant isolation still needs integration tests against PostgreSQL.
- The organization access route is a security foundation; future tenant-owned endpoints must consistently apply membership and role checks.
- The current rate limiter is process-local. A shared Redis-backed store is needed before horizontal scaling.
- Authentication UI, signup/sign-in flows, account recovery and email verification are not connected yet.
- Production Supabase, Render and Netlify configuration has not been tested.
- No real `.env` file is present in the tracked repository tree; only placeholder `.env.example` files are present. A full historical secret scan and GitHub secret-scanning alert review were not verified.
- No GitHub rulesets were returned by the repository rulesets endpoint; classic branch protection could not be verified with the available repository permissions. Check `Settings → Branches` manually and protect `main`.
- Deployment hardening and external penetration testing remain separate checks.

## Operational rule

Do not use ORVEX with real customer data until the remaining tenant-isolation, RLS, production configuration and integration-test work is complete.
