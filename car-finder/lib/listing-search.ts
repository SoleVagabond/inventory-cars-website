import { prisma } from '@/lib/db';
import { type SearchFilters } from '@/lib/search-schemas';

type ListingSelection = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  price: number | null;
  mileage: number | null;
  city: string | null;
  state: string | null;
  images: string[];
  url: string | null;
  title: string | null;
};

export async function findListingsByFilters(
  filters: SearchFilters,
  options: { take?: number } = {},
): Promise<ListingSelection[]> {
  const take = options.take ?? 60;
  const make = filters.make?.trim() ? filters.make.trim() : undefined;
  const model = filters.model?.trim() ? filters.model.trim() : undefined;

  return prisma.listing.findMany({
    where: {
      ...(make ? { make: { contains: make, mode: 'insensitive' } } : {}),
      ...(model ? { model: { contains: model, mode: 'insensitive' } } : {}),
      ...(filters.minYear ? { year: { gte: filters.minYear } } : {}),
      ...(filters.maxPrice ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters.maxMiles ? { mileage: { lte: filters.maxMiles } } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }],
    take,
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
    },
  });
}
