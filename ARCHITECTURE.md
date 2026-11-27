# ORVEX — Technical architecture

## Deployment boundary
One GitHub repository, two independently deployed applications:
- `frontend/`: Next.js + TypeScript frontend, deployed on Netlify.
- `backend/`: NestJS + TypeScript REST API, deployed on Render.
- PostgreSQL: managed database, accessed only by the API.

The frontend must never connect directly to PostgreSQL or contain private server credentials.

## Initial architecture
Start with a modular monolith in the API. Keep domain boundaries clear without introducing microservices prematurely.

Suggested backend modules:
- identity and access
- organizations and memberships
- customers and leads
- billing and payments
- learning and content
- notifications
- AI gateway and usage
- administration and audit

## API conventions
- Version routes under `/api/v1`.
- JSON over HTTPS.
- Validate all incoming data on the server.
- Use explicit DTOs and consistent error responses.
- Configure CORS for approved frontend origins only.
- Add rate limits to authentication and sensitive endpoints.
- Expose a minimal health endpoint; never expose secrets or internal diagnostics.

## Security requirements
- Hash passwords with a modern password hashing algorithm; never store plaintext.
- Enforce authorization on the server for every protected resource.
- Scope organization-owned records by tenant on every query.
- Keep secrets in hosting environment variables.
- Verify payment events server-side and make webhook processing idempotent.
- Use secure cookies or carefully designed token rotation for sessions.
- Add audit logs for security-sensitive administrative actions.
- Backups, retention and data deletion policies must be defined before production.

## Data and integrations
PostgreSQL is the source of truth. Object storage will hold uploaded/private files. Redis and background jobs may be introduced when asynchronous workload requires them. AI, email, messaging and payment providers must be replaceable behind adapters.

## Frontend
- Next.js App Router and TypeScript.
- Responsive accessible components.
- French/English internationalization from the start.
- API base URL supplied through `NEXT_PUBLIC_API_URL`.
- Do not put secrets in variables prefixed with `NEXT_PUBLIC_`.
