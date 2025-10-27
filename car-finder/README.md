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

## Features in this starter
- Mobile‑first SRP with instant filters (make, model, year/price/miles).
- `/api/search` backed by Prisma queries.
- VIN decode + NHTSA recall helper (client lib ready to plug on detail page).
- Seed script with mock listings so UI isn’t empty.
- Clean data model with future‑proof tables (PriceHistory, SavedSearch).

## `/api/search` contract

Third‑party clients can call `/api/search` with the following query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `make` | string | `''` | Case‑insensitive partial match. |
| `model` | string | `''` | Case‑insensitive partial match. |
| `minYear` | number | none | Filters results with `year >= minYear`. |
| `maxPrice` | number | none | Filters results with `price <= maxPrice`. |
| `maxMiles` | number | none | Filters results with `mileage <= maxMiles`. |
| `page` | number | `1` | 1‑indexed, capped at 1000. |
| `pageSize` | number | `20` | Page size is clamped to the range 1‑60. |
| `sort` | enum | `updatedAt_desc` | One of `updatedAt_desc`, `price_asc`, `price_desc`, `mileage_asc`, `year_desc`. |

Response payload:

```jsonc
{
  "data": [/* listings matching the requested filters */],
  "meta": {
    "totalCount": 1204,
    "page": 2,
    "pageSize": 40,
    "sort": "updatedAt_desc",
    "hasNextPage": true,
    "nextCursor": {
      "page": 3,
      "pageSize": 40,
      "sort": "updatedAt_desc"
    }
  }
}
```

Clients can use `meta.totalCount` and `meta.nextCursor` to render pagination controls or build infinite scroll experiences. All parameters are sanitized on the server with strict caps to protect the database.

### Performance considerations

The Prisma schema includes indexes on `price`, `mileage`, `year`, and `updatedAt` to support the available sort orders. For heavier traffic, consider materialized views or read replicas tailored to the most common filter combinations.

## Roadmap (move to issues)
- [ ] Saved searches + email alerts (Resend/SMTP)
- [ ] Price history cron & deal score
- [ ] Map view + radius filter
- [ ] Dealer CSV/API import (ETL worker)
- [ ] SEO routes `/used/<state>/<city>/<make>/<model>`
- [ ] NextAuth (email/Google)

## Legal
Prefer official feeds & partner APIs. Avoid scraping that violates ToS.
