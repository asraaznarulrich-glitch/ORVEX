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
- [x] GitHub Actions workflow for frontend and backend typechecks, production builds and smoke tests.
- [x] Deployment instructions for separate Netlify and Render services.

## Verification
- [x] Frontend TypeScript check and production build pass in GitHub Actions.
- [x] Frontend production server starts and serves the ORVEX workspace (runtime smoke test).
- [x] Backend TypeScript check and production build pass in GitHub Actions.
- [x] API runtime smoke test verifies health and module catalogue endpoints.
- [x] API startup tests reject missing production CORS origins, malformed CORS origins and invalid ports.
- [x] Latest checked workflow run #25 completed successfully for both frontend and backend. The lockfile workflow also completed successfully, including clean `npm ci` installs, builds, typechecks and smoke tests.
- A green CI run does not replace external production deployment checks, security review or end-to-end tests against real services.

## Remaining before Phase 1 can be signed off
- [x] Generate and commit reproducible npm lockfiles for both applications; CI and deployment install commands use `npm ci`.
- [ ] Review the deployment configuration against the actual Netlify and Render service settings once those services are created.
- [ ] Complete a live deployment smoke test after hosting, domains and environment variables are configured.

## Explicitly out of scope for Phase 1
PostgreSQL provisioning, Prisma schema and migrations, authentication, tenant data, payment processing and the 20 business modules belong to later phases. None should be represented as operational until implemented and tested.
