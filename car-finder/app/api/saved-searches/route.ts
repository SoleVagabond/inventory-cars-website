import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { saveSearchPayloadSchema, searchFiltersSchema } from '@/lib/search-schemas';
import { Notify } from '@prisma/client';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const saved = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
    });

    const payload = saved.map((entry) => ({
      id: entry.id,
      filters: searchFiltersSchema.parse(entry.queryJson),
      zip: entry.zip,
      radiusMiles: entry.radiusMiles,
      notify: entry.notify,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load saved searches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parseResult = saveSearchPayloadSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid request', details: parseResult.error.flatten() }, { status: 400 });
  }

  const { filters, zip, radiusMiles = 50, notify = Notify.daily } = parseResult.data;
  const normalizedZip = zip?.trim();

  const created = await prisma.savedSearch.create({
    data: {
      userId: user.id,
      queryJson: filters,
      zip: normalizedZip ? normalizedZip : null,
      radiusMiles,
      notify,
    },
  });

  return NextResponse.json({
    id: created.id,
    filters,
    zip: created.zip,
    radiusMiles: created.radiusMiles,
    notify: created.notify,
  });
}
