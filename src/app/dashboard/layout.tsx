// src/app/dashboard/layout.tsx
import { withAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardShell from './dashboardShell';
//import { WorkOS } from '@workos-inc/node';

async function refreshUserJWTIfNeeded(user: any, claims: any) {
  if (!claims?.org_id) {
    console.log('⚠️ JWT missing organization data, checking database...');
    
    const dbUser = await prisma.user.findUnique({
      where: { workosUserId: user.id },
      include: { company: true }
    });

    if (dbUser && dbUser.role === 'admin') {
      console.log('🔄 Admin user detected without org_id - JWT needs refresh');
      return { needsRefresh: true };
    }
  }
  return { needsRefresh: false };
}

// THIS IS THE NEW ACTIVATION LOGIC BLOCK
async function activateUser(user: any, claims: any) {
  if (!user || !claims || !claims.email || !claims.sub) {
    console.log('User or claims are missing, cannot activate.');
    return; // Do nothing if there's no user to activate
  }
  
  try {
    const localUser = await prisma.user.findFirst({
        where: {
            email: claims.email,
        },
    });

    // If the user exists in our DB but doesn't have a workosUserId, activate them.
    if (localUser && !localUser.workosUserId) {
      console.log('🔄 Activating user account on first sign-in for:', localUser.email);
      const workosRole = claims.role as string;
      
      await prisma.user.update({
          where: { id: localUser.id },
          data: {
              workosUserId: claims.sub,
              status: 'active',
              inviteToken: null,
              role: workosRole || localUser.role,
          },
      });
      console.log('✅ User account activated and linked successfully');
    }

  } catch (error) {
    console.error('❌ Error during database activation in layout:', error);
    // Continue with the layout, but log the error
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the authenticated user and claims from WorkOS
  const { user } = await withAuth();
  const claims = await getTokenClaims();

  // 2. If no user is authenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  // 3. Perform the CRITICAL activation step here!
  await activateUser(user, claims);
  
  // 4. Proceed with existing logic
  const workosRole = claims?.role as string | undefined;
  const permissions = (claims?.permissions as string[]) || [];
  const organizationId = claims?.org_id as string | undefined;

  console.log('🔍 WorkOS Claims:', {
    role: workosRole,
    permissions,
    organizationId,
    userEmail: user.email
  });

  const refreshCheck = await refreshUserJWTIfNeeded(user, claims);
  if (refreshCheck.needsRefresh) {
    redirect('/auth/refresh?returnTo=/dashboard');
  }

  const dbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  if (!dbUser) {
    console.error('❌ User not found by WorkOS ID after activation attempt. Redirecting to home.');
    redirect('/');
  }

  if (workosRole && dbUser.role !== workosRole) {
    console.log(`🔄 Updating user role from ${dbUser.role} to ${workosRole}`);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: workosRole },
    });
  }
  
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
    redirect('/setup-company');
  }

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