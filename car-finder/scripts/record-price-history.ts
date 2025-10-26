import { prisma } from '@/lib/db';
import { recordPriceHistory } from '@/lib/price-history';

async function main() {
  const result = await recordPriceHistory();
  console.log(`Processed ${result.listingsProcessed} listings; created ${result.recordsCreated} price records.`);
}

main()
  .catch(err => {
    console.error('Failed to record price history', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
