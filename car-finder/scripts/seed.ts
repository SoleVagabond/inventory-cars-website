import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

function sig(x: any) { return crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'); }

async function main() {
  const cars = [
    { vin: '1HGCM82633A004352', year: 2018, make: 'Toyota', model: 'Camry', trim: 'SE', price: 16900, mileage: 78000, city: 'Toledo', state: 'OH', images: ['https://picsum.photos/seed/camry/800/400'], source: 'mock', sourceId: '1', url: '#' },
    { vin: '1FTFW1ET4EFA12345', year: 2017, make: 'Ford', model: 'F-150', trim: 'XLT', price: 21900, mileage: 102000, city: 'Detroit', state: 'MI', images: ['https://picsum.photos/seed/f150/800/400'], source: 'mock', sourceId: '2', url: '#' },
    { vin: 'WBA8E9G57GNT12345', year: 2016, make: 'BMW', model: '328i', trim: 'Sport', price: 14950, mileage: 90000, city: 'Chicago', state: 'IL', images: ['https://picsum.photos/seed/bmw/800/400'], source: 'mock', sourceId: '3', url: '#' }
  ];

  for (const c of cars) {
    await prisma.listing.upsert({
      where: { source_sourceId: { source: c.source, sourceId: c.sourceId! } },
      update: { ...c, hashSignature: sig({ vin: c.vin, price: c.price }) },
      create: { ...c, sellerType: 'dealer', hashSignature: sig({ vin: c.vin, price: c.price }) }
    });
  }

  console.log('Seeded listings:', cars.length);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
