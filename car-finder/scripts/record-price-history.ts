import { prisma } from '@/lib/db';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

export type RecordPriceHistoryResult = {
  processed: number;
  inserted: number;
  skipped: number;
  timestamp: string;
};

export async function recordPriceHistory(client: PrismaClient = prisma): Promise<RecordPriceHistoryResult> {
  const listings = await client.listing.findMany({
    select: {
      id: true,
      price: true,
      priceHistory: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
        select: { price: true }
      }
    }
  });

  let inserted = 0;
  let skipped = 0;

  for (const listing of listings) {
    const currentPrice = listing.price;
    if (typeof currentPrice !== 'number') {
      skipped += 1;
      continue;
    }

    const latest = listing.priceHistory[0];
    if (!latest || latest.price !== currentPrice) {
      await client.priceHistory.create({
        data: {
          listingId: listing.id,
          price: currentPrice
        }
      });
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    processed: listings.length,
    inserted,
    skipped,
    timestamp: new Date().toISOString()
  };
}

async function run() {
  const result = await recordPriceHistory();
  console.log(
    `record-price-history: processed ${result.processed}, inserted ${result.inserted}, skipped ${result.skipped}`
  );
  await prisma.$disconnect();
}

const isMainModule = (() => {
  if (!process.argv[1]) return false;
  const currentFile = fileURLToPath(import.meta.url);
  return resolve(process.argv[1]) === currentFile;
})();

if (isMainModule) {
  run().catch((error) => {
    console.error('Failed to record price history', error);
    prisma.$disconnect().finally(() => process.exit(1));
  });
}
