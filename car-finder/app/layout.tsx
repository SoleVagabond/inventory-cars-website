import './globals.css';
import type { Metadata } from 'next';
import { getServerSession } from '@/lib/auth';

import { AuthControls } from '@/components/auth-controls';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Car Finder',
  description: 'Find your next car fast',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const callbackUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '/';

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-4">
          <header className="flex items-center justify-between gap-3 py-3">
            <h1 className="text-xl font-bold">Car Finder</h1>
            <nav className="flex items-center gap-3 text-sm text-slate-600">
              {session?.user ? (
                <>
                  <span className="hidden sm:inline">{session.user.name ?? session.user.email}</span>
                  <span className="sm:hidden">Account</span>
                  <form action="/api/auth/signout" method="post">
                    <input name="callbackUrl" type="hidden" value={callbackUrl} />
                    <button className="rounded border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-100">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <a
                  className="rounded border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-100"
                  href="/api/auth/signin"
                >
                  Sign in
                </a>
              )}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
