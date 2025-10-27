'use client';

import { useFormState } from 'react-dom';
import { inviteDealer } from './actions';

const initialState: { error?: string } = {};

export function InviteDealerForm() {
  const [state, formAction] = useFormState(inviteDealer, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-semibold">Invite a dealer</h2>
        <p className="text-sm text-gray-600">Create a dealer profile and optionally link it to an email address.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Dealer name
          <input
            type="text"
            name="dealerName"
            required
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="Acme Motors"
          />
        </label>
        <label className="text-sm font-medium">
          Dealer email
          <input
            type="email"
            name="dealerEmail"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="sales@example.com"
          />
        </label>
        <label className="text-sm font-medium">
          Dealer phone
          <input
            type="tel"
            name="dealerPhone"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="555-555-5555"
          />
        </label>
        <label className="text-sm font-medium">
          Website
          <input
            type="url"
            name="dealerWebsite"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="https://dealer-site.com"
          />
        </label>
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Send invitation
      </button>
    </form>
  );
}
