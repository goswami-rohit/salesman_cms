// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { withAuth } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import DashboardGraphs from './dashboardGraphs';
import SimpleWelcomePage from '@/app/dashboard/welcome/page';

// We need to redefine this here to check inside the page
const allowedNonAdminRoles = [
  'senior-executive',
  'executive',
  'junior-executive',
];

export default async function DashboardPage() {
  // 1. Fetch user again to check role for this specific page
  const { user } = await withAuth();
  
  if (!user) return null; // Should be handled by layout, but safe to return null

  const dbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    select: { role: true, firstName: true }
  });

  const userRole = dbUser?.role || '';

  // 2. CONDITIONAL RENDER
  // If they are an Executive, show the Welcome View (instead of failing graphs)
  if (allowedNonAdminRoles.includes(userRole)) {
    return <SimpleWelcomePage firstName={dbUser?.firstName || 'Team Member'} />;
  }

  // 3. If Admin, show the actual Dashboard
  console.log('DashboardPage: Rendering DashboardGraphs for Admin...');
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <Suspense fallback={<div>Loading dashboard data...</div>}>
        <DashboardGraphs />
      </Suspense>
    </div>
  );
}