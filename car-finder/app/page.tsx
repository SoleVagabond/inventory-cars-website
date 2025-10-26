'use client';
import { useEffect, useMemo, useState } from 'react';

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
  priceHistory?: { price: number; capturedAt: string }[];
};

export default function Home() {
  const [q, setQ] = useState({ make: '', model: '', minYear: 2015, maxPrice: 25000, maxMiles: 120000 });
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => new URLSearchParams({
    make: q.make, model: q.model,
    minYear: String(q.minYear), maxPrice: String(q.maxPrice), maxMiles: String(q.maxMiles)
  }).toString(), [q]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/search?${params}`).then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [params]);

  return (
    <main className="space-y-4">
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input className="border p-2 rounded" placeholder="Make (e.g. Toyota)" value={q.make} onChange={e => setQ({ ...q, make: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Model (e.g. Camry)" value={q.model} onChange={e => setQ({ ...q, model: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Min Year" value={q.minYear} onChange={e => setQ({ ...q, minYear: Number(e.target.value) })} />
        <input className="border p-2 rounded" type="number" placeholder="Max Price" value={q.maxPrice} onChange={e => setQ({ ...q, maxPrice: Number(e.target.value) })} />
        <input className="border p-2 rounded" type="number" placeholder="Max Miles" value={q.maxMiles} onChange={e => setQ({ ...q, maxMiles: Number(e.target.value) })} />
      </section>

      {loading && <p>Loading…</p>}

      <ul className="grid md:grid-cols-3 gap-4">
        {data.map(l => (
          <li key={l.id} className="border rounded-lg p-3">
            {l.images?.[0] && <img src={l.images[0]} alt={l.title ?? ''} className="w-full h-40 object-cover rounded" />}
            <h3 className="font-semibold mt-2">{l.year} {l.make} {l.model}</h3>
            <p className="text-sm opacity-80">{l.city}{l.state ? `, ${l.state}` : ''}</p>
            <p className="font-bold">{typeof l.price === 'number' ? `$${l.price.toLocaleString()}` : ''}</p>
            {l.priceHistory?.length ? (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-blue-600">Price history</summary>
                <ul className="mt-2 space-y-1">
                  {l.priceHistory.map((ph, idx) => (
                    <li key={`${ph.capturedAt}-${idx}`} className="flex justify-between text-xs text-gray-700">
                      <span>{new Date(ph.capturedAt).toLocaleDateString()}</span>
                      <span>${ph.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            <a href={l.url ?? '#'} target="_blank" className="text-blue-600 underline">View</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
