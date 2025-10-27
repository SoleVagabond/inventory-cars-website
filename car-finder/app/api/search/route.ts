import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 60;
const MAX_PAGE = 1000;

const SORT_OPTIONS: Record<string, { orderBy: Prisma.ListingOrderByWithRelationInput[] }> = {
  updatedAt_desc: {
    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
  },
  price_asc: {
    orderBy: [{ price: 'asc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  },
  price_desc: {
    orderBy: [{ price: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  },
  mileage_asc: {
    orderBy: [{ mileage: 'asc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  },
  year_desc: {
    orderBy: [{ year: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  },
};

function parsePositiveInt(
  value: string | null,
  { defaultValue, min, max }: { defaultValue: number; min: number; max?: number },
) {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  const intValue = Math.floor(parsed);
  if (intValue < min) {
    return min;
  }
  if (typeof max === 'number' && intValue > max) {
    return max;
  }
  return intValue;
}

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make') || undefined;
  const model = searchParams.get('model') || undefined;
  const minYear = parseNumber(searchParams.get('minYear'));
  const maxPrice = parseNumber(searchParams.get('maxPrice'));
  const maxMiles = parseNumber(searchParams.get('maxMiles'));

  const page = parsePositiveInt(searchParams.get('page'), {
    defaultValue: DEFAULT_PAGE,
    min: 1,
    max: MAX_PAGE,
  });
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), {
    defaultValue: DEFAULT_PAGE_SIZE,
    min: 1,
    max: MAX_PAGE_SIZE,
  });

  const sortParam = searchParams.get('sort') ?? 'updatedAt_desc';
  const sort = SORT_OPTIONS[sortParam] ? sortParam : 'updatedAt_desc';
  const orderBy = SORT_OPTIONS[sort].orderBy;

  const where: Prisma.ListingWhereInput = {
    ...(make ? { make: { contains: make, mode: 'insensitive' } } : {}),
    ...(model ? { model: { contains: model, mode: 'insensitive' } } : {}),
    ...(typeof minYear === 'number' ? { year: { gte: minYear } } : {}),
    ...(typeof maxPrice === 'number' ? { price: { lte: maxPrice } } : {}),
    ...(typeof maxMiles === 'number' ? { mileage: { lte: maxMiles } } : {}),
  };

  const skip = (page - 1) * pageSize;

  const [totalCount, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        price: true,
        mileage: true,
        city: true,
        state: true,
        images: true,
        url: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  const hasNextPage = skip + listings.length < totalCount;
  const nextCursor = hasNextPage
    ? {
        page: page + 1,
        pageSize,
        sort,
      }
    : null;

  return NextResponse.json({
    data: listings,
    meta: {
      totalCount,
      page,
      pageSize,
      sort,
      hasNextPage,
      nextCursor,
    },
  });
}
