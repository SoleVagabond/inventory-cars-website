import './globals.css';
import type { Metadata } from 'next';

import { AuthControls } from '@/components/auth-controls';
import { getAuthSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Car Finder',
  description: 'Find your next car fast',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-4">
          <header className="flex items-center justify-between gap-3 py-3">
            <h1 className="text-xl font-bold">Car Finder</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-gray-500 md:inline">MVP</span>
              <AuthControls user={session?.user ?? null} />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
