'use client';

import { type SearchFilters } from '@/lib/search-schemas';

interface SearchFiltersFormProps {
  filters: SearchFilters;
  onChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  canSave?: boolean;
}

export function SearchFiltersForm({ filters, onChange, onSave, isSaving, canSave = true }: SearchFiltersFormProps) {
  const toNumber = (value: string, fallback: number) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <input
        className="border p-2 rounded"
        placeholder="Make (e.g. Toyota)"
        value={filters.make}
        onChange={(event) => onChange('make', event.target.value)}
      />
      <input
        className="border p-2 rounded"
        placeholder="Model (e.g. Camry)"
        value={filters.model}
        onChange={(event) => onChange('model', event.target.value)}
      />
      <input
        className="border p-2 rounded"
        type="number"
        placeholder="Min Year"
        value={filters.minYear}
        onChange={(event) => onChange('minYear', toNumber(event.target.value, filters.minYear))}
        min={1900}
        max={2100}
      />
      <input
        className="border p-2 rounded"
        type="number"
        placeholder="Max Price"
        value={filters.maxPrice}
        onChange={(event) => onChange('maxPrice', toNumber(event.target.value, filters.maxPrice))}
        min={0}
      />
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          type="number"
          placeholder="Max Miles"
          value={filters.maxMiles}
          onChange={(event) => onChange('maxMiles', toNumber(event.target.value, filters.maxMiles))}
          min={0}
        />
        {onSave ? (
          <button
            type="button"
            className="border rounded px-3 text-sm font-medium disabled:opacity-50"
            onClick={onSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
