'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SearchFiltersForm } from '@/components/SearchFiltersForm';
import { SavedSearchList, type SavedSearchItem } from '@/components/SavedSearchList';
import { useSearchFilters } from './hooks/useSearchFilters';

type Listing = {
  id: string;
  year?: number;
  make?: string;
  model?: string;
  price?: number;
  mileage?: number;
  city?: string;
  state?: string;
  images?: string[];
  url?: string;
  title?: string;
  updatedAt?: string;
};

const SORT_LABELS = {
  updatedAt_desc: 'Recently updated',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  mileage_asc: 'Mileage: Low to High',
  year_desc: 'Year: New to Old',
} as const;

type SortOption = keyof typeof SORT_LABELS;

const PAGE_SIZE_OPTIONS = [20, 40, 60] as const;

type SearchResponse = {
  data: Listing[];
  meta: {
    totalCount: number;
    page: number;
    pageSize: number;
    sort: SortOption;
    hasNextPage: boolean;
    nextCursor: {
      page: number;
      pageSize: number;
      sort: SortOption;
    } | null;
  };
};

export default function Home() {
  const { filters, updateFilter, setFilters, params } = useSearchFilters();
  const [data, setData] = useState<Listing[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchResponse['meta'] | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [sort, setSort] = useState<SortOption>('updatedAt_desc');
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'unknown' | 'authenticated' | 'unauthenticated'>('unknown');
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPage(1);
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setIsPageLoading(true);
      setSearchError(null);

      const query = new URLSearchParams(params);
      query.set('page', String(page));
      query.set('pageSize', String(pageSize));
      query.set('sort', sort);

      try {
        const response = await fetch(`/api/search?${query.toString()}`, {
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? 'Unable to load results');
        }

        const typedPayload = payload as SearchResponse;
        if (cancelled) {
          return;
        }
        setData(typedPayload.data);
        setSearchMeta(typedPayload.meta);

        if (typedPayload.meta.page !== page) {
          setPage(typedPayload.meta.page);
        }
        if (typedPayload.meta.pageSize !== pageSize) {
          setPageSize(typedPayload.meta.pageSize);
        }
        setHasFetched(true);
      } catch (error) {
        if (cancelled || (error instanceof Error && error.name === 'AbortError')) {
          return;
        }
        setData([]);
        setSearchMeta(null);
        setSearchError(error instanceof Error ? error.message : 'Unable to load results');
        setHasFetched(true);
      } finally {
        if (!cancelled) {
          setIsPageLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [params, page, pageSize, sort]);

  const fetchSavedSearches = useCallback(async () => {
    setSavedLoading(true);
    try {
      const response = await fetch('/api/saved-searches');
      if (response.status === 401) {
        setAuthState('unauthenticated');
        setSavedSearches([]);
        setSavedError('Sign in to manage saved searches.');
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Unable to load saved searches');
      }
      const payload: SavedSearchItem[] = await response.json();
      setSavedSearches(payload);
      setSavedError(null);
      setAuthState('authenticated');
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Unable to load saved searches');
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedSearches();
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
    };
  }, [fetchSavedSearches]);

  const handleSaveSearch = useCallback(async () => {
    setIsSaving(true);
    setSavedError(null);
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        setAuthState('unauthenticated');
        setSavedError(payload?.error ?? 'Please sign in to save searches.');
        return;
      }

      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? 'Unable to save search');
      }

      const saved = payload as SavedSearchItem;
      setSavedSearches((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = saved;
          return next;
        }
        return [saved, ...prev];
      });

      setSavedError(null);
      setAuthState('authenticated');
      setFeedback('Search saved!');
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
      feedbackTimeout.current = setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Unable to save search');
    } finally {
      setIsSaving(false);
    }
  }, [filters]);

  const handleSelectSavedSearch = useCallback((item: SavedSearchItem) => {
    setFilters({ ...item.filters });
  }, [setFilters]);

  const handleDeleteSavedSearch = useCallback(async (item: SavedSearchItem) => {
    try {
      const response = await fetch(`/api/saved-searches/${item.id}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        setAuthState('unauthenticated');
        setSavedError(payload?.error ?? 'Please sign in to manage saved searches.');
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to delete saved search');
      }

      setSavedSearches((prev) => prev.filter((candidate) => candidate.id !== item.id));
      setSavedError(null);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Unable to delete saved search');
    }
  }, []);

  const canSave = authState !== 'unauthenticated';

  const totalPages = useMemo(() => {
    if (!searchMeta || searchMeta.pageSize <= 0) {
      return 0;
    }
    return Math.max(1, Math.ceil(searchMeta.totalCount / searchMeta.pageSize));
  }, [searchMeta]);

  const pageSizeChoices = useMemo(() => {
    return Array.from(new Set([...PAGE_SIZE_OPTIONS, pageSize])).sort((a, b) => a - b);
  }, [pageSize]);

  const resultsSummary = useMemo(() => {
    if (!searchMeta || searchMeta.totalCount === 0) {
      return 'No vehicles found';
    }
    const start = (searchMeta.page - 1) * searchMeta.pageSize + 1;
    const end = Math.min(searchMeta.page * searchMeta.pageSize, searchMeta.totalCount);
    return `Showing ${start.toLocaleString()} – ${end.toLocaleString()} of ${searchMeta.totalCount.toLocaleString()} vehicles`;
  }, [searchMeta]);

  const showInitialLoading = !hasFetched && isPageLoading;
  const showResultsLoading = hasFetched && isPageLoading;

  return (
    <main className="grid gap-6 md:grid-cols-[minmax(0,240px)_1fr]">
      <SavedSearchList
        items={savedSearches}
        loading={savedLoading}
        error={savedError}
        onSelect={handleSelectSavedSearch}
        onDelete={handleDeleteSavedSearch}
      />

      <section className="space-y-4">
        <SearchFiltersForm
          filters={filters}
          onChange={updateFilter}
          onSave={canSave ? handleSaveSearch : undefined}
          isSaving={isSaving}
          canSave={canSave}
        />
        {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
        {savedError && canSave ? <p className="text-sm text-red-600">{savedError}</p> : null}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              {showInitialLoading ? 'Loading results…' : resultsSummary}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                Sort by
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortOption);
                    setPage(1);
                  }}
                  disabled={showInitialLoading}
                >
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                Per page
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setPageSize(nextSize);
                    setPage(1);
                  }}
                  disabled={showInitialLoading}
                >
                  {pageSizeChoices.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {searchError ? <p className="text-sm text-red-600">{searchError}</p> : null}

          <ul className="grid md:grid-cols-3 gap-4">
            {data.map((listing) => (
              <li key={listing.id} className="border rounded-lg p-3 space-y-2">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title ?? ''} className="w-full h-40 object-cover rounded" />
                ) : null}
                <h3 className="font-semibold">
                  {listing.year} {listing.make} {listing.model}
                </h3>
                <p className="text-sm opacity-80">
                  {listing.city}
                  {listing.state ? `, ${listing.state}` : ''}
                </p>
                <p className="font-bold">
                  {typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : ''}
                </p>
                <a href={listing.url ?? '#'} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  View
                </a>
              </li>
            ))}
          </ul>

          {showResultsLoading ? <p className="text-sm text-slate-500">Loading page…</p> : null}

          {!showInitialLoading && !isPageLoading && data.length === 0 && !searchError ? (
            <p className="text-sm text-slate-500">No vehicles match these filters yet.</p>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              {totalPages > 0 ? `Page ${searchMeta?.page ?? page} of ${totalPages}` : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={showInitialLoading || isPageLoading || (searchMeta?.page ?? page) <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                onClick={() => {
                  if (searchMeta?.nextCursor?.page) {
                    setPage(searchMeta.nextCursor.page);
                  } else {
                    setPage((prev) => prev + 1);
                  }
                }}
                disabled={
                  showInitialLoading ||
                  isPageLoading ||
                  !searchMeta?.hasNextPage ||
                  (totalPages > 0 && (searchMeta?.page ?? page) >= totalPages)
                }
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
