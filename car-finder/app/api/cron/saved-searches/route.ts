import { NextRequest, NextResponse } from 'next/server';
import { sendSavedSearchAlerts } from '@/lib/saved-search-alerts';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const summary = await sendSavedSearchAlerts();
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
