'use client';

import { useMemo } from 'react';

type PricePoint = {
  price: number;
  capturedAt: string;
};

type PriceHistoryChartProps = {
  points: PricePoint[];
};

const WIDTH = 360;
const HEIGHT = 200;
const PADDING = 32;

export function PriceHistoryChart({ points }: PriceHistoryChartProps) {
  const chartState = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const timestamps = points.map((point) => new Date(point.capturedAt).getTime());
    const prices = points.map((point) => point.price);

    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const timeRange = maxTimestamp - minTimestamp || 1;
    const priceRange = maxPrice - minPrice || 1;

    const coordinates = points.map((point, index) => {
      const timeOffset = new Date(point.capturedAt).getTime() - minTimestamp;
      const relativeTime = timeOffset / timeRange;
      const x = PADDING + relativeTime * (WIDTH - PADDING * 2);

      const priceOffset = point.price - minPrice;
      const relativePrice = priceOffset / priceRange;
      const y = HEIGHT - PADDING - relativePrice * (HEIGHT - PADDING * 2);

      const command = index === 0 ? 'M' : 'L';
      return {
        command,
        x,
        y
      };
    });

    const pathData = coordinates
      .map((coordinate) => `${coordinate.command}${coordinate.x.toFixed(2)},${coordinate.y.toFixed(2)}`)
      .join(' ');

    const sorted = [...points].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );

    return {
      pathData,
      coordinates,
      priceLabels: {
        min: `$${minPrice.toLocaleString()}`,
        max: `$${maxPrice.toLocaleString()}`
      },
      timeLabels: {
        start: new Date(sorted[0].capturedAt).toLocaleDateString(),
        end: new Date(sorted[sorted.length - 1].capturedAt).toLocaleDateString()
      }
    };
  }, [points]);

  if (!chartState) {
    return <p className="text-sm text-gray-500">No price history captured yet.</p>;
  }

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Price history chart">
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="none" stroke="#e5e7eb" />
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke="#e5e7eb"
        />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#e5e7eb" />
        <path d={chartState.pathData} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
        {chartState.coordinates.map(({ x, y }, index) => (
          <circle key={index} cx={x} cy={y} r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{chartState.timeLabels.start}</span>
        <span>{chartState.timeLabels.end}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Low: {chartState.priceLabels.min}</span>
        <span>High: {chartState.priceLabels.max}</span>
      </div>
    </div>
  );
}
