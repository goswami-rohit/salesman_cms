// src/app/dashboard/technicalSites/page.tsx
export const dynamic = 'force-dynamic';

import { TechnicalSitesTabs } from './tabsLoader';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { hasPermission, WorkOSRole } from '@/lib/permissions';

/**
 * Fetches the current user's role from the database.
 */
async function getCurrentUserRole(): Promise<WorkOSRole | null> {
  try {
    const claims = await getTokenClaims();
    if (!claims?.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { role: true },
    });
    
    return (user?.role as WorkOSRole) ?? null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export default async function TechnicalSitesPage() {
  const userRole = await getCurrentUserRole();
  const roleToCheck = userRole ?? 'junior-executive'; 

  const canViewSites = hasPermission(roleToCheck, 'technicalSites.listSites');

  if (!canViewSites) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-neutral-500">
          You do not have permission to view this section.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Technical Sites
        </h2>
      </div>

      <TechnicalSitesTabs
        canViewSites={canViewSites}
      />
    </div>
  );
}