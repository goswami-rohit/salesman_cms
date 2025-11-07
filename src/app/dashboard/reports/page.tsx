// src/app/dashboard/reports/page.tsx
// --- NO 'use client' --- This is the Server Component.

// Import the new client component from 'tabsLoader.tsx'
import { ReportsTabs } from './tabsLoader';

// Server-side imports for permissions
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { hasPermission, WorkOSRole } from '@/lib/permissions';

/**
 * Fetches the current user's role from the database.
 * Runs only on the server.
 */
async function getCurrentUserRole(): Promise<WorkOSRole | null> {
  try {
    const claims = await getTokenClaims();
    if (!claims?.sub) {
      return null; // Not logged in
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

// The page component is now an 'async' function
export default async function ReportsPage() {
  // 1. Get the user's role on the server
  const userRole = await getCurrentUserRole();

  // 2. Check permissions for each tab
  const roleToCheck = userRole ?? 'junior-executive'; // Default to lowest role

  const canSeeDVR = hasPermission(roleToCheck, 'reports.dailyVisitReports');
  const canSeeTVR = hasPermission(roleToCheck, 'reports.technicalVisitReports');
  const canSeeSalesOrders = hasPermission(roleToCheck, 'reports.salesOrders');
  const canSeeCompetition = hasPermission(roleToCheck, 'reports.competitionReports');
  const canSeeDvrVpjp = hasPermission(roleToCheck, 'reports.dvrVpjp');
  const canSeeSalesVdvr = hasPermission(roleToCheck, 'reports.salesVdvr');

  const canSeeAnyReport = canSeeDVR || canSeeTVR || canSeeSalesOrders || canSeeCompetition || canSeeDvrVpjp || canSeeSalesVdvr;

  // 3. Handle users who can't see anything
  if (!canSeeAnyReport) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <h2 className="text-3xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-neutral-500">
          You do not have permission to view this section.
        </p>
      </div>
    );
  }

  // 4. Render the page, passing permissions to the client component
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Reports Page
        </h2>
      </div>
      
      {/* Render the CLIENT component and pass the
        server-side permissions as props.
      */}
      <ReportsTabs
        canSeeDVR={canSeeDVR}
        canSeeTVR={canSeeTVR}
        canSeeSalesOrders={canSeeSalesOrders}
        canSeeCompetition={canSeeCompetition}
        canSeeDvrVpjp={canSeeDvrVpjp}
        canSeeSalesVdvr={canSeeSalesVdvr}
      />
    </div>
  );
}