// src/app/dashboard/layout.tsx
import { withAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardShell from './dashboardShell';
//import { WorkOS } from '@workos-inc/node';

async function refreshUserJWTIfNeeded(user: any, claims: any) {
  // Check if JWT needs refresh (missing org data but user should have it)
  if (!claims?.org_id) {
    console.log('⚠️ JWT missing organization data, checking database...');
    
    const dbUser = await prisma.user.findUnique({
      where: { workosUserId: user.id },
      include: { company: true }
    });

    if (dbUser && dbUser.role === 'admin') {
      console.log('🔄 Admin user detected without org_id - JWT needs refresh');
      // Return a flag to indicate refresh is needed
      return { needsRefresh: true };
    }
  }
  return { needsRefresh: false };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the authenticated user from WorkOS
  const { user } = await withAuth();

  // 2. If no user is authenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  // 3. Get token claims to extract role information
  const claims = await getTokenClaims();
  const workosRole = claims?.role as string | undefined;
  const permissions = (claims?.permissions as string[]) || [];
  const organizationId = claims?.org_id as string | undefined;

  console.log('🔍 WorkOS Claims:', {
    role: workosRole,
    permissions,
    organizationId,
    userEmail: user.email
  });

  // 4. Check if JWT needs refresh
  const refreshCheck = await refreshUserJWTIfNeeded(user, claims);
  if (refreshCheck.needsRefresh) {
    // Redirect to a refresh page that will handle the JWT refresh
    redirect('/auth/refresh?returnTo=/dashboard');
  }

  // 5. Find user in database by WorkOS ID
  const dbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  // 6. If user is not in database after WorkOS authentication, something is wrong
  // This case should be handled by the /auth/callback route.
  if (!dbUser) {
    console.log('❌ User not found by WorkOS ID. This should have been handled by the callback route.');
    // A user with a WorkOS ID should always have a local record.
    // Redirect to a landing page or an error page.
    redirect('/');
  }

  // 7. Update user role if it changed in WorkOS
  if (workosRole && dbUser.role !== workosRole) {
    console.log(`🔄 Updating user role from ${dbUser.role} to ${workosRole}`);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: workosRole },
    });
  }
  
  // 8. Re-fetch the user to get the updated role for the layout
  const updatedDbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  if (!updatedDbUser) {
    console.error('User not found after update.');
    redirect('/');
  }

  const company = updatedDbUser.company;

  if (!company) {
    console.error('User has no company access');
    redirect('/');
  }

  // 9. Use the updated role from the database
  const finalRole = updatedDbUser.role || 'admin';

  console.log('🎯 Final role being used:', finalRole);

  return (
    <DashboardShell
      user={updatedDbUser}
      company={company}
      workosRole={finalRole}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}