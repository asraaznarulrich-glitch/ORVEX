# ORVEX

**Tout votre business. Un seul espace.**  
**Your Entire Business. One Space.**

ORVEX is an independent, bilingual (French/English), modular business platform designed to bring essential business operations into one workspace.

## Product principles
- International from the start; French and English are official languages.
- Freemium access: the 20 planned modules will have free-tier quotas and paid upgrades.
- Secure multi-tenant architecture with clear organization and role boundaries.
- Modular monolith first: build a coherent product before splitting services.
- Frontend and backend are deployed independently.

## Repository layout
```
backend/    # NestJS API — deploy independently to Render
frontend/  # Next.js app — deploy independently to Netlify
.github/
  workflows/ # Automated frontend and backend quality checks
```

## Hosting model
| Component | Platform | Root directory |
|---|---|---|
| Frontend | Netlify | `frontend` |
| Backend API | Render | `backend` |
| Database | Managed PostgreSQL | Separate managed database |

The frontend calls the backend through a public HTTPS API URL configured with `NEXT_PUBLIC_API_URL`. Secrets and database credentials belong only in the backend environment.

## Planned product modules
Customer management, payments, payment reminders, digital product delivery, lead tracking, dashboard, learning management, events, quizzes and certificates, AI learning assistant, post-training follow-up, AI business audit, quotes and proposals, private workspaces, demo builder, AI knowledge base, editorial assistant, email/WhatsApp assistant, guide studio and video workspace.

## Development status
The initial frontend and backend scaffold is in place. Automated TypeScript checks, production builds and runtime smoke tests have passed in GitHub Actions. The dashboard is still a demonstration interface; the API currently exposes a health endpoint and a small planned-module catalogue.

Hosting services, database, authentication, payments and production deployments are **not yet configured**.

See [ROADMAP.md](ROADMAP.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DEPLOYMENT.md](DEPLOYMENT.md) and [BRAND.md](BRAND.md).
