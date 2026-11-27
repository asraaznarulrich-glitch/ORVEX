# ORVEX — Phase 1 completion checklist

Phase 1 establishes a reliable application scaffold before database and business features are introduced.

## Implemented
- [x] Separate Next.js frontend and NestJS API applications.
- [x] TypeScript strict checks configured for both applications.
- [x] Versioned API prefix: `/api/v1`.
- [x] Global request validation configured in the API.
- [x] CORS allowlist with a local-development fallback and production startup guard.
- [x] Startup validation for CORS origins and the API port.
- [x] Graceful shutdown hooks enabled.
- [x] Safe environment examples for frontend and backend.
- [x] GitHub Actions workflow for frontend and backend typechecks and production builds.
- [x] Deployment instructions for separate Netlify and Render services.

## Verification
- GitHub Actions has reported successful frontend and backend typechecks and builds on the previously checked commits.
- Every new code or dependency change must pass the same workflow before it is considered verified.
- A green build does not replace runtime, integration, security, or end-to-end tests.

## Remaining before Phase 1 can be signed off
- [ ] Confirm the latest workflow run is green after the most recent API startup changes.
- [ ] Add and commit reproducible npm lockfiles, then switch CI from `npm install` to `npm ci`.
- [ ] Add automated API smoke tests for health and startup configuration.
- [ ] Perform a real runtime smoke test of the frontend and API.
- [ ] Review the final environment and deployment configuration.

## Explicitly out of scope for Phase 1
PostgreSQL provisioning, Prisma schema and migrations, authentication, tenant data, payment processing and the 20 business modules belong to later phases. None should be represented as operational until implemented and tested.
