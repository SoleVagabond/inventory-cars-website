import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(_: Request, context: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parseResult = paramsSchema.safeParse(context.params);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid search id' }, { status: 400 });
  }

  const { id } = parseResult.data;
  const result = await prisma.savedSearch.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Search not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
