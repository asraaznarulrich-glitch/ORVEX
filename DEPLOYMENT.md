# ORVEX — Separate deployment guide

The frontend and backend are intentionally hosted separately and deployed from this repository.

## 1. Frontend — Netlify
- Connect the ORVEX GitHub repository.
- Base directory: `apps/web`.
- Build command: `npm run build`.
- Configure the Next.js runtime/adapter supported by the selected Netlify setup; do not publish the raw source directory as a static site.
- Environment variable: `NEXT_PUBLIC_API_URL` = public HTTPS API base URL, ending in `/api/v1`.
- Local example: copy `apps/web/.env.example` to `apps/web/.env.local`.

## 2. Backend — Render
- Create a separate Web Service from the same GitHub repository.
- Root directory: `apps/api`.
- Runtime: Node.js 22.
- Build command: `npm ci && npm run build`.
- Start command: `npm run start:prod`.
- Set `NODE_ENV=production` and use the `PORT` assigned by Render.
- Set `CORS_ORIGINS` to the exact frontend origin(s), comma-separated, without paths.
- Local example: copy `apps/api/.env.example` to `apps/api/.env`.

## 3. Database
Provision managed PostgreSQL separately. Store its connection string only in Render as the private `DATABASE_URL` environment variable. Never commit real credentials or copy them into frontend variables. Apply schema migrations through a controlled deployment/release process.

## 4. Deployment order
1. Provision PostgreSQL and configure the private database URL.
2. Deploy the API and confirm its health endpoint responds over HTTPS.
3. Set the API URL in Netlify.
4. Deploy the frontend.
5. Test CORS, authentication flows and key user journeys from the public frontend.

## Current status
This is a deployment plan only. No Netlify site, Render service, PostgreSQL instance, environment variables or production domain has been created/configured yet. The `.env.example` files contain placeholders and local development values only; they are not production secrets.
