import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const listingId = params.id;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true }
  });

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const history = await prisma.priceHistory.findMany({
    where: { listingId },
    orderBy: { capturedAt: 'asc' },
    select: { price: true, capturedAt: true }
  });

  return NextResponse.json({ history });
}
