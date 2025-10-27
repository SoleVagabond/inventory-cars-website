'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth';
import { isStaff } from '@/lib/authorization';
import { prisma } from '@/lib/db';
import { DealerMembershipRole, UserRole } from '@prisma/client';

function toOptionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

export async function inviteDealer(prevState: { error?: string } | undefined, formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!isStaff(user)) {
    return { error: 'You do not have permission to invite dealers.' } as const;
  }

  const name = toOptionalString(formData.get('dealerName'));
  const email = toOptionalString(formData.get('dealerEmail'));
  const phone = toOptionalString(formData.get('dealerPhone'));
  const website = toOptionalString(formData.get('dealerWebsite'));

  if (!name) {
    return { error: 'Dealer name is required.' } as const;
  }

  const dealerFilters = [
    { name: { equals: name, mode: 'insensitive' } },
    ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
  ];

  const existingDealer = await prisma.dealer.findFirst({
    where: {
      OR: dealerFilters,
    },
  });

  if (existingDealer) {
    return { error: 'A dealer with that name or email already exists.' } as const;
  }

  const dealer = await prisma.dealer.create({
    data: {
      name,
      email,
      phone,
      website,
    },
  });

  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let dealerUser = existingUser;
    if (existingUser) {
      if (existingUser.role !== UserRole.staff) {
        dealerUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.dealer,
            ...(name ? { name } : {}),
          },
        });
      }
    } else {
      dealerUser = await prisma.user.create({
        data: { email, name, role: UserRole.dealer },
      });
    }

    if (!dealerUser) {
      throw new Error('Unable to resolve dealer user');
    }

    await prisma.dealerMembership.upsert({
      where: { dealerId_userId: { dealerId: dealer.id, userId: dealerUser.id } },
      update: { role: DealerMembershipRole.owner },
      create: { dealerId: dealer.id, userId: dealerUser.id, role: DealerMembershipRole.owner },
    });
  }

  revalidatePath('/dealers');
  return {};
}
