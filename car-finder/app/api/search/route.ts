import { NextRequest, NextResponse } from 'next/server';
import { findListingsByFilters } from '@/lib/listing-search';
import { defaultSearchFilters } from '@/lib/search-schemas';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const toNumber = (value: string | null, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const listings = await findListingsByFilters({
    make: searchParams.get('make') ?? defaultSearchFilters.make,
    model: searchParams.get('model') ?? defaultSearchFilters.model,
    minYear: toNumber(searchParams.get('minYear'), defaultSearchFilters.minYear),
    maxPrice: toNumber(searchParams.get('maxPrice'), defaultSearchFilters.maxPrice),
    maxMiles: toNumber(searchParams.get('maxMiles'), defaultSearchFilters.maxMiles),
  });

  return NextResponse.json(listings);
}
