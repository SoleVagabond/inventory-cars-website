import { Notify } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getResendClient } from '@/lib/resend';
import { findListingsByFilters } from '@/lib/listing-search';
import { searchFiltersSchema, type SearchFilters } from '@/lib/search-schemas';

type AlertSummary = {
  processed: number;
  emailsSent: number;
  skipped: number;
  errors: { searchId: string; message: string }[];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const cadenceWindow: Record<Exclude<Notify, 'off'>, number> = {
  daily: ONE_DAY_MS,
  weekly: ONE_WEEK_MS,
};

function describeFilters(filters: SearchFilters) {
  const parts: string[] = [];
  const makeModel = [filters.make, filters.model].filter(Boolean).join(' ').trim();
  if (makeModel) {
    parts.push(makeModel);
  }
  parts.push(`≥${filters.minYear}`);
  parts.push(`≤$${filters.maxPrice.toLocaleString()}`);
  parts.push(`≤${filters.maxMiles.toLocaleString()} mi`);
  return parts.join(' • ');
}

function renderHtmlEmail(filters: SearchFilters, listings: Awaited<ReturnType<typeof findListingsByFilters>>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const header = `<h1 style="font-family:Arial,sans-serif;font-size:18px;margin-bottom:12px;">Saved search update</h1>`;
  const intro = `<p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 12px 0;">Here are the latest matches for <strong>${describeFilters(filters)}</strong>.</p>`;

  const listingsHtml = listings.length
    ? `<ul style="padding-left:16px;font-family:Arial,sans-serif;font-size:14px;">${listings
        .map((listing) => {
          const title = [listing.year, listing.make, listing.model].filter(Boolean).join(' ').trim() || 'Listing';
          const price = typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : 'Price on request';
          const location = [listing.city, listing.state].filter(Boolean).join(', ');
          const url = listing.url ?? siteUrl;
          return `<li style=\"margin-bottom:10px;\"><strong>${title}</strong><br/>${price}${
            location ? ` • ${location}` : ''
          }<br/><a href="${url}" target="_blank">View listing</a></li>`;
        })
        .join('')}</ul>`
    : `<p style="font-family:Arial,sans-serif;font-size:14px;margin:0 0 12px 0;">No new matches right now. We'll keep checking for you.</p>`;

  const footer = `<p style="font-family:Arial,sans-serif;font-size:12px;color:#555;">Manage alerts at <a href="${siteUrl}">${siteUrl}</a>.</p>`;

  return `${header}${intro}${listingsHtml}${footer}`;
}

function renderTextEmail(filters: SearchFilters, listings: Awaited<ReturnType<typeof findListingsByFilters>>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const header = `Saved search update for ${describeFilters(filters)}`;
  const body = listings.length
    ? listings
        .map((listing) => {
          const title = [listing.year, listing.make, listing.model].filter(Boolean).join(' ').trim() || 'Listing';
          const price = typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : 'Price on request';
          const location = [listing.city, listing.state].filter(Boolean).join(', ');
          const url = listing.url ?? siteUrl;
          return `${title}\n${price}${location ? ` • ${location}` : ''}\n${url}`;
        })
        .join('\n\n')
    : 'No new matches right now. We will keep checking for you.';

  return `${header}\n\n${body}\n\nManage alerts: ${siteUrl}`;
}

export async function sendSavedSearchAlerts(): Promise<AlertSummary> {
  const now = new Date();
  const dailyCutoff = new Date(now.getTime() - cadenceWindow.daily);
  const weeklyCutoff = new Date(now.getTime() - cadenceWindow.weekly);

  const dueSearches = await prisma.savedSearch.findMany({
    where: {
      notify: { not: Notify.off },
      OR: [
        { lastNotifiedAt: null },
        { notify: Notify.daily, lastNotifiedAt: { lte: dailyCutoff } },
        { notify: Notify.weekly, lastNotifiedAt: { lte: weeklyCutoff } },
      ],
    },
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: [{ lastNotifiedAt: 'asc' }],
  });

  const summary: AlertSummary = { processed: dueSearches.length, emailsSent: 0, skipped: 0, errors: [] };
  if (dueSearches.length === 0) {
    return summary;
  }

  const resend = getResendClient();

  for (const search of dueSearches) {
    try {
      if (!search.user?.email) {
        summary.skipped += 1;
        continue;
      }

      const filters = searchFiltersSchema.parse(search.queryJson);
      const listings = await findListingsByFilters(filters, { take: 10 });
      const html = renderHtmlEmail(filters, listings);
      const text = renderTextEmail(filters, listings);
      const subject = listings.length
        ? `${listings.length} new matches for ${describeFilters(filters)}`
        : `Saved search update for ${describeFilters(filters)}`;

      await resend.send({
        to: search.user.email,
        subject,
        html,
        text,
      });

      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: now },
      });

      summary.emailsSent += 1;
    } catch (error) {
      summary.errors.push({
        searchId: search.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return summary;
}
