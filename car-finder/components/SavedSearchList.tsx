'use client';

import { type SearchFilters } from '@/lib/search-schemas';

export type SavedSearchItem = {
  id: string;
  filters: SearchFilters;
  zip?: string | null;
  radiusMiles: number;
  notify: 'daily' | 'weekly' | 'off';
};

interface SavedSearchListProps {
  items: SavedSearchItem[];
  loading?: boolean;
  error?: string | null;
  onSelect: (item: SavedSearchItem) => void;
  onDelete: (item: SavedSearchItem) => void;
}

function formatFilters(filters: SearchFilters) {
  const parts: string[] = [];
  const makeModel = [filters.make, filters.model].filter(Boolean).join(' ');
  if (makeModel) parts.push(makeModel);
  parts.push(`≥${filters.minYear}`);
  parts.push(`≤$${filters.maxPrice.toLocaleString()}`);
  parts.push(`≤${filters.maxMiles.toLocaleString()} mi`);
  return parts.join(' • ');
}

export function SavedSearchList({ items, loading = false, error, onSelect, onDelete }: SavedSearchListProps) {
  const notifyLabel: Record<SavedSearchItem['notify'], string> = {
    daily: 'Alerts: Daily',
    weekly: 'Alerts: Weekly',
    off: 'Alerts off',
  };

  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Saved searches</h2>
        <p className="text-sm text-slate-500">Reuse your favorite filters in one click.</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No saved searches yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border rounded-md p-3 space-y-2">
              <div className="text-sm font-medium">{formatFilters(item.filters)}</div>
              <div className="text-xs text-slate-500">
                {item.zip ? `Zip ${item.zip} • ` : ''}{item.radiusMiles} mi radius • {notifyLabel[item.notify]}
              </div>
              {item.notify !== 'off' ? (
                <div className="text-xs text-green-600">Alerts active</div>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 border rounded px-3 py-1 text-sm font-medium hover:bg-slate-50"
                  onClick={() => onSelect(item)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="border rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(item)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
