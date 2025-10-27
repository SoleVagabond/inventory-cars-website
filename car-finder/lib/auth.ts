import { prisma } from '@/lib/db';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { User } from '@prisma/client';
import { getServerSession as nextGetServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    const message = `${key} must be set to use NextAuth providers.`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(message);
    return `missing-${key}`;
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: requiredEnv('EMAIL_SERVER'),
      from: requiredEnv('EMAIL_FROM'),
      maxAge: 24 * 60 * 60,
    }),
    GoogleProvider({
      clientId: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
    }),
  ],
  secret: requiredEnv('NEXTAUTH_SECRET'),
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? null;
        session.user.dealerId = user.dealerId ?? null;
      }
      return session;
    },
  },
};

export async function getServerSession() {
  return nextGetServerSession(authOptions);
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getServerSession();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
  });
}

export type AuthenticatedUser = Awaited<ReturnType<typeof getAuthenticatedUser>>;
