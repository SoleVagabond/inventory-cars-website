import { NextResponse } from 'next/server';
import { recordPriceHistory } from '@/lib/price-history';

export const runtime = 'nodejs';

export async function GET() {
  const result = await recordPriceHistory();
  return NextResponse.json({ ok: true, ...result });
}
