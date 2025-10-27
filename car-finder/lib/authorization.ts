import type { AuthenticatedUser } from '@/lib/auth';
import { DealerMembershipRole, UserRole } from '@prisma/client';

export function isStaff(user: AuthenticatedUser | null | undefined): user is AuthenticatedUser & { role: UserRole.staff } {
  return Boolean(user && user.role === UserRole.staff);
}

export function canManageDealer(user: AuthenticatedUser | null | undefined, dealerId: string) {
  if (!user) {
    return false;
  }
  if (user.role === UserRole.staff) {
    return true;
  }
  return user.memberships.some((membership) => membership.dealerId === dealerId);
}

export function membershipLabel(role: DealerMembershipRole) {
  switch (role) {
    case DealerMembershipRole.owner:
      return 'Owner';
    case DealerMembershipRole.member:
      return 'Member';
    case DealerMembershipRole.viewer:
      return 'Viewer';
    default:
      return role;
  }
}
