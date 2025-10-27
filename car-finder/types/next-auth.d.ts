import type { DefaultSession } from 'next-auth';
import type { DealerMembershipRole, UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & { id?: string; role?: UserRole; memberships?: Array<{ dealerId: string; role: DealerMembershipRole }> };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }
}
