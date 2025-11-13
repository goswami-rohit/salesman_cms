// src/app/dashboard/users/page.tsx
export const dynamic = 'force-dynamic';
import { withAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import UsersManagement from './userManagement';
import prisma from '@/lib/prisma';

const allowedAdminRoles = [
    'president',
    'senior-general-manager',
    'general-manager',
    'regional-sales-manager',
    'area-sales-manager',
    'senior-manager',
    'manager',
    'assistant-manager',
    // Add other roles here as needed
];

export default async function UsersPage() {
  // We still need to get the user data for the UsersManagement component
  const { user } = await withAuth({ ensureSignedIn: true });
  const claims = await getTokenClaims();

  if (!user) {
    redirect('/login');
  }

  // Get the admin user data that UsersManagement expects
  const adminUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  // Now, we check if the user exists AND if their role is in the allowed list.
  const userRole = claims.role as string;
  if (!adminUser || !allowedAdminRoles.includes(userRole)) {
    // Redirect to dashboard if not an allowed admin role
    console.log('❌ Unauthorized access to /dashboard/users. Redirecting...');
    redirect('/dashboard');
  }

  return <UsersManagement adminUser={adminUser} />;
}