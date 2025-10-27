'use client';

import { useMemo, useState } from 'react';
import { defaultSearchFilters, type SearchFilters } from '@/lib/search-schemas';

export function useSearchFilters(initial?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultSearchFilters,
    ...(initial ?? {}),
  });

  const params = useMemo(() => {
    const qs = new URLSearchParams({
      make: filters.make ?? '',
      model: filters.model ?? '',
      minYear: String(filters.minYear),
      maxPrice: String(filters.maxPrice),
      maxMiles: String(filters.maxMiles),
    });
    return qs.toString();
  }, [filters]);

  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setFilters({ ...defaultSearchFilters, ...(initial ?? {}) });
  }

  return {
    filters,
    setFilters,
    updateFilter,
    params,
    reset,
  } as const;
}

export type { SearchFilters };
