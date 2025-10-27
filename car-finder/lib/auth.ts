import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { getServerSession as nextGetServerSession, type NextAuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const demoUser = {
  id: 'demo-user',
  email: 'designer@example.com',
  name: 'Demo User',
  role: UserRole.staff,
};

const staffEmails = new Set(
  (process.env.STAFF_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function determineRole(email: string): UserRole {
  return staffEmails.has(email.toLowerCase()) ? UserRole.staff : UserRole.dealer;
}

type UserWithMemberships = Prisma.UserGetPayload<{ include: { memberships: true } }>;

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
        if (session.user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { memberships: true },
          });
          if (dbUser) {
            session.user.role = dbUser.role;
            session.user.memberships = dbUser.memberships.map((membership) => ({
              dealerId: membership.dealerId,
              role: membership.role,
            }));
          }
        }
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

export async function getAuthenticatedUser(): Promise<UserWithMemberships | null> {
  const session = await getSessionOrDemo();
  const email = session?.user?.email;

  if (!session || !email) {
    return null;
  }

  const name = session.user?.name ?? undefined;
  const requestedId = session.user?.id;
  const role = 'role' in session.user && session.user.role ? session.user.role : determineRole(email);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: role === UserRole.staff ? UserRole.staff : undefined },
    create: {
      email,
      name,
      ...(requestedId ? { id: requestedId } : {}),
      role,
    },
  });

  return prisma.user.findUnique({
    where: { id: user.id },
    include: { memberships: true },
  });
}

export type AuthenticatedUser = Awaited<ReturnType<typeof getAuthenticatedUser>>;
