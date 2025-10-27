'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchFiltersForm } from '@/components/SearchFiltersForm';
import { SavedSearchList, type SavedSearchItem } from '@/components/SavedSearchList';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
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
};

type PricePoint = {
  price: number;
  capturedAt: string;
};

export default function Home() {
  const { filters, updateFilter, setFilters, params } = useSearchFilters();
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'unknown' | 'authenticated' | 'unauthenticated'>('unknown');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedListingId = selectedListing?.id;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/search?${params}`)
      .then((response) => response.json())
      .then((payload: Listing[]) => setData(payload))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [params]);

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

  useEffect(() => {
    if (!selectedListingId) {
      setPriceHistory([]);
      setPriceHistoryError(null);
      setPriceHistoryLoading(false);
      return;
    }

    let isCancelled = false;
    setPriceHistory([]);
    setPriceHistoryError(null);
    setPriceHistoryLoading(true);

    fetch(`/api/listings/${selectedListingId}/price-history`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load price history');
        }
        return response.json();
      })
      .then((payload: { history: PricePoint[] }) => {
        if (isCancelled) return;
        setPriceHistory(payload.history);
      })
      .catch((error) => {
        if (isCancelled) return;
        setPriceHistoryError(error instanceof Error ? error.message : 'Unable to load price history');
      })
      .finally(() => {
        if (isCancelled) return;
        setPriceHistoryLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedListingId]);

  const closeDrawer = useCallback(() => {
    setSelectedListing(null);
    setPriceHistory([]);
    setPriceHistoryError(null);
    setPriceHistoryLoading(false);
  }, []);

  const canSave = authState !== 'unauthenticated';

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
        {loading && <p>Loading…</p>}
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
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setSelectedListing(listing)}
                  className="text-blue-600 underline"
                >
                  View details
                </button>
                {listing.url ? (
                  <a href={listing.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Open listing
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      {selectedListing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute right-4 top-4 text-sm text-blue-600 underline"
            >
              Close
            </button>
            <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
              <div className="space-y-3">
                {selectedListing.images?.[0] ? (
                  <img
                    src={selectedListing.images[0]}
                    alt={selectedListing.title ?? ''}
                    className="w-full rounded"
                  />
                ) : null}
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {selectedListing.year} {selectedListing.make} {selectedListing.model}
                  </p>
                  <p className="text-gray-500">
                    {selectedListing.city}
                    {selectedListing.state ? `, ${selectedListing.state}` : ''}
                  </p>
                  {typeof selectedListing.price === 'number' ? (
                    <p className="text-base font-semibold">
                      Current price: ${selectedListing.price.toLocaleString()}
                    </p>
                  ) : null}
                  {selectedListing.url ? (
                    <a
                      href={selectedListing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View original listing
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price history</h3>
                {priceHistoryLoading ? <p className="text-sm">Loading price history…</p> : null}
                {priceHistoryError ? (
                  <p className="text-sm text-red-600">{priceHistoryError}</p>
                ) : null}
                {!priceHistoryLoading && !priceHistoryError ? (
                  priceHistory.length > 0 ? (
                    <PriceHistoryChart points={priceHistory} />
                  ) : (
                    <p className="text-sm text-gray-500">No price history captured yet.</p>
                  )
                ) : null}
                {priceHistory.length > 0 ? (
                  <ul className="space-y-1 text-sm text-gray-500">
                    {priceHistory
                      .slice()
                      .reverse()
                      .map((point, index) => (
                        <li key={`${point.capturedAt}-${index}`}>
                          {new Date(point.capturedAt).toLocaleString()}: ${point.price.toLocaleString()}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
