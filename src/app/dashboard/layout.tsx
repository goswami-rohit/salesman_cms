// src/app/dashboard/layout.tsx
import { withAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardShell from './dashboardShell';
import { WorkOS } from '@workos-inc/node';

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

  // 5. Try to find user in database by WorkOS ID
  let dbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  // 6. If user not found, check if they have a pending invitation
  if (!dbUser) {
    console.log('🔍 User not found by WorkOS ID, checking for pending invitation...');

    const pendingUser = await prisma.user.findFirst({
      where: {
        email: user.email,
        status: 'pending'
      },
      include: { company: true }
    });

    if (pendingUser) {
      console.log('✅ Found pending user, activating...');

      // Check if they need to be added to WorkOS organization (backup check)
      if (!workosRole && organizationId) {
        console.log('🔄 No role found, trying to add to WorkOS organization...');
        try {
          const workos = new WorkOS(process.env.WORKOS_API_KEY!);
          await workos.userManagement.createOrganizationMembership({
            userId: user.id,
            organizationId: organizationId,
            roleSlug: pendingUser.role.toLowerCase(),
          });
          console.log('✅ Added user to WorkOS organization');
        } catch (error) {
          console.error('❌ Error adding to WorkOS org:', error);
        }
      }

      // Activate the invited user
      dbUser = await prisma.user.update({
        where: { id: pendingUser.id },
        data: {
          workosUserId: user.id,
          status: 'active',
          inviteToken: null,
          role: workosRole || pendingUser.role,
        },
        include: { company: true }
      });

      console.log('🎉 Invited user activated successfully');
    } else {
      console.log('❌ No pending invitation found - new user needs company setup');
      redirect('/setup-company');
    }
  }

  // 7. Fallback to database role if WorkOS role is not available
  const finalRole = workosRole || dbUser.role || 'admin';

  console.log('🎯 Final role being used:', finalRole);

  // 8. Update user role if it changed in WorkOS
  if (dbUser && workosRole && dbUser.role !== workosRole) {
    console.log(`🔄 Updating user role from ${dbUser.role} to ${workosRole}`);
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: workosRole },
      include: { company: true }
    });
  }

  const company = dbUser.company;

  if (!company) {
    console.error('User has no company access');
    redirect('/');
  }

  return (
    <DashboardShell
      user={dbUser}
      company={company}
      workosRole={finalRole}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}