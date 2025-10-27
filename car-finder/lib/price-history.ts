import { prisma } from './db';
import { signature } from '../utils/dedupe';

const toSignatureInput = (listing: {
  vin: string | null;
  title: string | null;
  phone: string | null;
}, price: number | null) => ({
  vin: listing.vin ?? undefined,
  title: listing.title ?? undefined,
  price: price ?? undefined,
  phone: listing.phone ?? undefined
});

export async function recordPriceHistory() {
  const listings = await prisma.listing.findMany({
    where: { price: { not: null } },
    select: {
      id: true,
      price: true,
      vin: true,
      title: true,
      phone: true,
      priceHistory: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
        select: { id: true, price: true }
      }
    }
  });

  let created = 0;

  for (const listing of listings) {
    const currentPrice = listing.price;
    if (currentPrice == null) continue;

    const latest = listing.priceHistory[0];
    const currentSignature = signature(toSignatureInput(listing, currentPrice));
    const latestSignature = latest ? signature(toSignatureInput(listing, latest.price)) : null;

    if (!latest || currentSignature !== latestSignature) {
      await prisma.priceHistory.create({ data: { listingId: listing.id, price: currentPrice } });
      created += 1;
    }
  }

  return { listingsProcessed: listings.length, recordsCreated: created };
}
