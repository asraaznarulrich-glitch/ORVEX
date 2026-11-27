# ORVEX — Phase 0 foundation checklist

Phase 0 establishes a reliable application scaffold before database and business features are introduced.

## Implemented
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
- [x] Deployment instructions for separate Netlify and Render services.

## Verification
- [x] Frontend TypeScript check, production build and runtime smoke test pass in GitHub Actions.
- [x] Backend TypeScript check, production build and API smoke tests pass in GitHub Actions.
- [x] API startup tests reject missing production CORS origins, malformed CORS origins and invalid ports.
- [x] Quality workflow run #30 passed on the root-level `backend/` and `frontend/` structure.
- [x] Lockfile workflow run #2 passed on the same commit.
- A green CI run does not replace external production deployment checks, security review or end-to-end tests against real services.

## Remaining before Phase 0 can be signed off
- [ ] Review deployment configuration against actual Netlify and Render service settings once created.
- [ ] Complete a live deployment smoke test after hosting, domains and environment variables are configured.

## Next phase
Phase 1 covers PostgreSQL, Prisma, authentication, organizations, roles and tenant isolation. These are not implemented yet. Do not treat the API or dashboard as production-ready or as supporting real user data.
