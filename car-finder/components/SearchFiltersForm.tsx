'use client';

import { type SearchFilters } from '@/lib/search-schemas';

type NotifyCadence = 'daily' | 'weekly' | 'off';

interface SearchFiltersFormProps {
  filters: SearchFilters;
  onChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  canSave?: boolean;
  notifyValue?: NotifyCadence;
  onNotifyChange?: (value: NotifyCadence) => void;
}

const notifyDescriptions: Record<NotifyCadence, string> = {
  daily: 'every day',
  weekly: 'once a week',
  off: 'never',
};

export function SearchFiltersForm({
  filters,
  onChange,
  onSave,
  isSaving,
  canSave = true,
  notifyValue = 'off',
  onNotifyChange,
}: SearchFiltersFormProps) {
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
      {onNotifyChange ? (
        <div className="col-span-2 md:col-span-5 border rounded p-3 space-y-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <label htmlFor="notify-cadence" className="text-sm font-medium">
              Email alerts
            </label>
            <select
              id="notify-cadence"
              className="border rounded px-3 py-2 text-sm"
              value={notifyValue}
              onChange={(event) => onNotifyChange(event.target.value as NotifyCadence)}
              disabled={!canSave}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="off">Off</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            {notifyValue === 'off'
              ? 'Alerts are off. Choose daily or weekly to receive saved-search emails.'
              : `Alerts active: We’ll email you ${notifyDescriptions[notifyValue]}.`}
          </p>
        </div>
      ) : null}
    </section>
  );
}
