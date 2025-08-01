// src/app/dashboard/layout.tsx
import { withAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardShell from './dashboardShell';

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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();
  const claims = await getTokenClaims();

  if (!user) {
    redirect('/login');
  }

  // Ensure the user is in the local database before proceeding.
  let dbUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  // If the user doesn't exist in the database by workosUserId,
  // try to find them by email and link their account.
  if (!dbUser) {
    const userByEmail = await prisma.user.findFirst({
        where: { email: user.email },
    });
    if (userByEmail) {
        console.log(`🔗 Linking existing user account ${userByEmail.email} with WorkOS ID ${user.id}`);
        dbUser = await prisma.user.update({
            where: { id: userByEmail.id },
            data: {
                workosUserId: user.id,
                status: 'active',
                inviteToken: null,
                role: claims?.role as string || userByEmail.role,
            },
            include: { company: true }
        });
    } else {
        // If they are not in the DB at all, this is a critical issue.
        console.error('❌ User exists in WorkOS but not in the local database.');
        redirect('/setup-company');
    }
  }

  // All subsequent logic now assumes `dbUser` is valid.
  const workosRole = claims?.role as string | undefined;
  const permissions = (claims?.permissions as string[]) || [];

  const refreshCheck = await refreshUserJWTIfNeeded(user, claims);
  if (refreshCheck.needsRefresh) {
    redirect('/auth/refresh?returnTo=/dashboard');
  }
  
  // Check if the user's role is out of sync and update it
  if (workosRole && dbUser.role !== workosRole) {
    console.log(`🔄 Updating user role from ${dbUser.role} to ${workosRole}`);
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: workosRole },
      include: { company: true }
    });
  }

  // Check for company access
  const company = dbUser.company;
  if (!company) {
    console.error('User has no company access');
    redirect('/setup-company');
  }

  const finalRole = dbUser.role || 'admin';
  console.log('🎯 Final role being used:', finalRole);

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