import { NextResponse } from 'next/server';
import { recordPriceHistory } from '@/scripts/record-price-history';

export async function GET() {
  try {
    const result = await recordPriceHistory();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('record-price-history cron failed', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
