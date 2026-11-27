# ORVEX — Separate deployment guide

The frontend and backend are intentionally hosted separately.

## 1. Frontend — Netlify
- Connect the ORVEX GitHub repository.
- Base directory: `apps/web`.
- Build command: `npm run build`.
- Publish directory: follow the Next.js Netlify adapter/build settings recommended by Netlify for the selected runtime.
- Environment variable: `NEXT_PUBLIC_API_URL` = public HTTPS URL of the Render API.

## 2. Backend — Render
- Create a separate Web Service from the same GitHub repository.
- Root directory: `apps/api`.
- Build/start commands will be finalized with the backend package scripts.
- Set `NODE_ENV=production`, `PORT` as provided by Render, and database credentials as private environment variables.
- Configure CORS with the exact production frontend origin(s).

## 3. Database
Provision managed PostgreSQL separately. Store its connection string only in Render as a secret. Apply migrations through a controlled deployment/release process.

## 4. Deployment order
1. Deploy the API and provision the database.
2. Confirm the API health endpoint responds over HTTPS.
3. Set the API URL in Netlify.
4. Deploy the frontend.
5. Test CORS, authentication flows and key user journeys from the public frontend.

## Current status
This is a deployment plan only. No Netlify site, Render service, PostgreSQL instance, environment variables or production domain has been created/configured yet.
