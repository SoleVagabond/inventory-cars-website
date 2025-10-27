'use client';

import { signIn, signOut } from 'next-auth/react';
import { useTransition } from 'react';

type AuthControlsProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id: string;
  } | null;
};

export function AuthControls({ user }: AuthControlsProps) {
  const [isPending, startTransition] = useTransition();

  if (user) {
    const label = user.name ?? user.email ?? 'Account';

    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-gray-600 sm:inline">{label}</span>
        <button
          type="button"
          className="rounded border border-gray-300 px-3 py-1 text-sm font-medium transition hover:bg-gray-100"
          disabled={isPending}
          onClick={() => startTransition(() => signOut())}
        >
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="rounded border border-gray-300 px-3 py-1 text-sm font-medium transition hover:bg-gray-100"
      disabled={isPending}
      onClick={() => startTransition(() => signIn())}
    >
      {isPending ? 'Redirecting…' : 'Sign in'}
    </button>
  );
}
