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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000/api/auth
NEXTAUTH_SECRET=generate-a-long-random-string
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM="Car Finder" <no-reply@example.com>
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Authentication setup

This starter now uses NextAuth with email magic links plus Google OAuth.

1. Create an SMTP account (Resend, Mailtrap, Postmark, etc.) and add the connection string to `EMAIL_SERVER` plus a friendly `EMAIL_FROM` value.
2. Generate OAuth credentials in the Google Cloud Console (`https://console.cloud.google.com/apis/credentials`). Use the authorized redirect `http://localhost:3000/api/auth/callback/google` in development.
3. Set a strong `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`).
4. Once the variables are in place, run `npx prisma db push` to apply the new NextAuth tables.
5. Restart `npm run dev` so NextAuth picks up the updated environment variables.

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
