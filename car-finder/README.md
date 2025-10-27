# Car Finder (Starter)

A fast, privacy‑respecting car search app. Smart filters, VIN decode/recalls, de‑dupe across sources, saved searches (scaffolded), and price tracking (hooked up for later).

**Stack**: Next.js 14 (App Router) • TypeScript • Tailwind • Prisma • Postgres • (optional) Redis later

## Quick Start

```bash
npm i
cp .env.example .env
npx prisma db push
npm run seed
npm run dev
```

Open http://localhost:3000

## .env

See `.env.example`. Minimum:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate OAuth credentials in the Google Cloud Console (Web client) and add the callback URL `http://localhost:3000/api/auth/callback/google`.

The app uses NextAuth with the Prisma adapter; sessions are stored in Postgres. Sign-in/out controls are available in the global header once the environment variables above are set.

## Features in this starter
- Mobile‑first SRP with instant filters (make, model, year/price/miles).
- `/api/search` backed by Prisma queries.
- VIN decode + NHTSA recall helper (client lib ready to plug on detail page).
- Seed script with mock listings so UI isn’t empty.
- Clean data model with future‑proof tables (PriceHistory, SavedSearch).

## Roadmap (move to issues)
- [ ] Saved searches + email alerts (Resend/SMTP)
- [ ] Price history cron & deal score
- [ ] Map view + radius filter
- [ ] Dealer CSV/API import (ETL worker)
- [ ] SEO routes `/used/<state>/<city>/<make>/<model>`
- [ ] NextAuth (email/Google)

## Legal
Prefer official feeds & partner APIs. Avoid scraping that violates ToS.
