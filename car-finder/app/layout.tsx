import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Car Finder',
  description: 'Find your next car fast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl p-4">
          <header className="flex items-center justify-between py-3">
            <h1 className="text-xl font-bold">Car Finder</h1>
            <nav className="text-sm opacity-80">MVP</nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
