import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth';
import { isStaff } from '@/lib/authorization';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Car Finder',
  description: 'Find your next car fast',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  const staff = isStaff(user);

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-4">
          <header className="flex items-center justify-between py-3">
            <h1 className="text-xl font-bold">Car Finder</h1>
            <nav className="flex items-center gap-4 text-sm opacity-80">
              {staff ? (
                <Link href="/dealers" className="hover:underline">
                  Dealer admin
                </Link>
              ) : null}
              {user ? (
                <span className="font-medium">{user.email}</span>
              ) : (
                <Link href="/api/auth/signin" className="hover:underline">
                  Sign in
                </Link>
              )}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
