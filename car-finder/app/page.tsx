'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [saveOptions, setSaveOptions] = useState({ zip: '', radiusMiles: 50, notify: 'daily' as SavedSearchItem['notify'] });
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        body: JSON.stringify({
          filters,
          zip: saveOptions.zip ? saveOptions.zip : undefined,
          radiusMiles: saveOptions.radiusMiles,
          notify: saveOptions.notify,
        }),
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

      setSaveOptions({
        zip: saved.zip ?? '',
        radiusMiles: saved.radiusMiles,
        notify: saved.notify,
      });

      setSavedError(null);
      setAuthState('authenticated');
      const message =
        saved.notify === 'off'
          ? 'Search saved. Alerts are off.'
          : saved.notify === 'daily'
            ? 'Search saved. Daily alerts active.'
            : 'Search saved. Weekly alerts active.';
      setFeedback(message);
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
      feedbackTimeout.current = setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Unable to save search');
    } finally {
      setIsSaving(false);
    }
  }, [filters, saveOptions]);

  const handleSelectSavedSearch = useCallback((item: SavedSearchItem) => {
    setFilters({ ...item.filters });
    setSaveOptions({
      zip: item.zip ?? '',
      radiusMiles: item.radiusMiles,
      notify: item.notify,
    });
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

  const handleNotifyChange = useCallback((value: SavedSearchItem['notify']) => {
    setSaveOptions((prev) => ({
      ...prev,
      notify: value,
    }));
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
          notifyValue={saveOptions.notify}
          onNotifyChange={handleNotifyChange}
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
              <a href={listing.url ?? '#'} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                View
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
