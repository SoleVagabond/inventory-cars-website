import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id?: string;
      role?: string | null;
      dealerId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
    dealerId?: string | null;
  }
}
