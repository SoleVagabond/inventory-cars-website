import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';
import { getServerSession as nextGetServerSession, type NextAuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const demoUser = {
  id: 'demo-user',
  email: 'designer@example.com',
  name: 'Demo User',
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: demoUser.email },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) {
          return null;
        }
        return {
          id: email,
          email,
          name: email,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'development-secret',
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof (user as { id?: string }).id === 'string') {
        token.sub = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id ?? undefined;
      }
      return session;
    },
  },
};

export async function getServerSession() {
  return nextGetServerSession(authOptions);
}

async function getSessionOrDemo(): Promise<Session | null> {
  const session = await getServerSession();
  if (session) {
    return session;
  }

  if (process.env.NODE_ENV !== 'production') {
    return { user: demoUser } as Session;
  }

  return null;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getSessionOrDemo();
  const email = session?.user?.email;

  if (!session || !email) {
    return null;
  }

  const name = session.user?.name ?? undefined;
  const requestedId = session.user?.id;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      ...(requestedId ? { id: requestedId } : {}),
    },
  });

  return user;
}

export type AuthenticatedUser = Awaited<ReturnType<typeof getAuthenticatedUser>>;
