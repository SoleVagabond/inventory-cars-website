import { prisma } from '@/lib/db';
import { sendSavedSearchAlerts } from '@/lib/saved-search-alerts';

async function main() {
  try {
    const summary = await sendSavedSearchAlerts();
    console.log('Saved search alerts processed:', summary);
  } catch (error) {
    console.error('Failed to send saved search alerts');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
