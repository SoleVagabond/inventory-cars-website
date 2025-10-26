import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make') || undefined;
  const model = searchParams.get('model') || undefined;
  const minYear = Number(searchParams.get('minYear') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 99999999);
  const maxMiles = Number(searchParams.get('maxMiles') || 99999999);

  const listings = await prisma.listing.findMany({
    where: {
      ...(make ? { make: { contains: make, mode: 'insensitive' } } : {}),
      ...(model ? { model: { contains: model, mode: 'insensitive' } } : {}),
      ...(minYear ? { year: { gte: minYear } } : {}),
      ...(maxPrice ? { price: { lte: maxPrice } } : {}),
      ...(maxMiles ? { mileage: { lte: maxMiles } } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 60,
    select: { id: true, year: true, make: true, model: true, price: true, mileage: true, city: true, state: true, images: true, url: true, title: true }
  });

  return NextResponse.json(listings);
}
