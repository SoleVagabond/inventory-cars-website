import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { isStaff, membershipLabel } from '@/lib/authorization';
import { InviteDealerForm } from './InviteDealerForm';

export const dynamic = 'force-dynamic';

export default async function DealersAdminPage() {
  const user = await getAuthenticatedUser();
  if (!isStaff(user)) {
    redirect('/');
  }

  const dealers = await prisma.dealer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        include: { user: true },
      },
      _count: { select: { listings: true } },
      listings: {
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  });

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dealer administration</h1>
        <p className="text-sm text-gray-600">
          Invite dealer partners, track their membership status, and monitor listing ingestion recency.
        </p>
      </div>

      <InviteDealerForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active dealers</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Dealer</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Last feed update</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {dealers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-500" colSpan={4}>
                    No dealers yet. Invite your first partner above.
                  </td>
                </tr>
              ) : (
                dealers.map((dealer) => {
                  const latest = dealer.listings[0]?.updatedAt;
                  return (
                    <tr key={dealer.id}>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">{dealer.name}</div>
                        <div className="text-xs text-gray-500">
                          {[dealer.email, dealer.phone, dealer.website].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ul className="space-y-1">
                          {dealer.memberships.length === 0 ? (
                            <li className="text-xs text-gray-500">No linked users</li>
                          ) : (
                            dealer.memberships.map((membership) => (
                              <li key={membership.id}>
                                <span className="font-medium">{membership.user?.email ?? membership.userId}</span>
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  {membershipLabel(membership.role)}
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      </td>
                      <td className="px-4 py-3 align-top font-medium">{dealer._count.listings}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-600">
                        {latest ? new Date(latest).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
