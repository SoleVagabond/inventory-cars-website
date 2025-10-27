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

## Scheduled saved-search alerts

- Run alerts locally with `npx tsx scripts/send-saved-search-alerts.ts` once your `.env` is configured with Resend keys.
- Deployments can hit `GET /api/cron/saved-searches` (optionally guarded by `CRON_SECRET`) from a scheduler like Vercel Cron or GitHub Actions.

## .env

See `.env.example`. Minimum:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

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
