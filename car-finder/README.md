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
```

Optional but recommended for role gating:
```
STAFF_EMAILS=ops@example.com,data@example.com
```

## Features in this starter
- Mobile‑first SRP with instant filters (make, model, year/price/miles).
- `/api/search` backed by Prisma queries.
- VIN decode + NHTSA recall helper (client lib ready to plug on detail page).
- Seed script with mock listings so UI isn’t empty.
- Clean data model with future‑proof tables (PriceHistory, SavedSearch).
- Dealer admin workspace with invitations, feed monitoring, and CSV/JSON ingestion endpoints.

## Roadmap (move to issues)
- [ ] Saved searches + email alerts (Resend/SMTP)
- [ ] Price history cron & deal score
- [ ] Map view + radius filter
- [ ] Dealer CSV/API import (ETL worker)
- [ ] SEO routes `/used/<state>/<city>/<make>/<model>`
- [ ] NextAuth (email/Google)

## Dealer ingestion workflow

### Roles & access control
- Staff users (emails listed in `STAFF_EMAILS` or the built-in demo account) can open `/dealers` to invite dealer partners and monitor their feeds.
- Inviting a dealer creates a `Dealer` record, optional linked user, and a membership that grants that dealer row-level access to their listings.
- Listing ingestion endpoints enforce that the authenticated user is either staff or a member of the dealer whose listings they are mutating.

### Upload formats
POST to `/api/dealers/{dealerId}/listings` with a JSON or CSV payload. Supported fields include:

| Field | Notes |
| --- | --- |
| `sourceId` | Optional stable identifier (stock number, DMS ID). Defaults to the dedupe signature if omitted. |
| `vin` | Used in dedupe signature and for display. |
| `title` | Listing title; required if no VIN provided. |
| `year`, `make`, `model`, `trim` | Parsed as integers/strings. |
| `price`, `mileage` | Accept numbers or strings with commas and currency symbols. |
| `city`, `state`, `lat`, `lon` | Location metadata. |
| `url`, `phone` | Contact details. |
| `images` | Comma/pipe separated string or array of URLs. |
| `postedAt`, `updatedAt` | ISO timestamps; `updatedAt` defaults to the upload time. |

See `scripts/samples/dealer-feed.csv` and `scripts/samples/dealer-feed.json` for end-to-end examples.

### Sample automation scripts
- **CLI uploader:** `npx tsx scripts/examples/upload-listings.ts scripts/samples/dealer-feed.csv` posts a CSV feed when `DEALER_FEED_ENDPOINT` and `SESSION_COOKIE` are set (grab the `next-auth.session-token` cookie from an authenticated browser session or service account).
- **Zapier:** Use the “Webhook by Zapier” action to POST JSON to the ingestion endpoint. Map DMS export fields to the JSON structure above and include a `Cookie` header with `next-auth.session-token=<token>` to authenticate. Zapier can schedule nightly pushes from popular CRMs/DMS exports.

### Error handling & dedupe
- Payloads are deduped by VIN/title/price/phone signature via `utils/dedupe.ts` before insertion.
- Responses include `created` and `updated` counts; HTTP 400 responses return descriptive validation errors.
- Listings retain row-level ownership; attempts to modify another dealer’s inventory are rejected.

## Legal
Prefer official feeds & partner APIs. Avoid scraping that violates ToS.
