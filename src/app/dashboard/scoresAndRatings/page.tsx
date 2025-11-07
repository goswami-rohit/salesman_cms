// src/app/dashboard/scoresAndRatings/page.tsx
// --- NO 'use client' --- This is the Server Component.

// Import the new client component from 'tabsLoader.tsx'
import { ScoresAndRatingsTabs } from './tabsLoader';

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
export default async function ScoresAndRatingsPage() {
  // 1. Get the user's role on the server
  const userRole = await getCurrentUserRole();

  // 2. Check permissions for each tab
  const roleToCheck = userRole ?? 'junior-executive'; // Default to lowest role
  
  const canSeeSalesmanRatings = hasPermission(roleToCheck, 'scoresAndRatings.salesmanRatings');
  const canSeeDealerScores = hasPermission(roleToCheck, 'scoresAndRatings.dealerScores');

  // 3. Handle users who can't see anything
  if (!canSeeSalesmanRatings && !canSeeDealerScores) {
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
          Scores and Ratings
        </h2>
      </div>
      <p className="text-neutral-500">
        View detailed ratings for salesmen and scores for dealers.
      </p>
      
      {/* Render the CLIENT component and pass the
        server-side permissions as props.
      */}
      <ScoresAndRatingsTabs 
        canSeeSalesmanRatings={canSeeSalesmanRatings}
        canSeeDealerScores={canSeeDealerScores}
      />
    </div>
  );
}