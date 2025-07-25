// src/app/dashboard/users/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import UsersManagement from './userManagement';
import prisma from '@/lib/prisma';

export default async function UsersPage() {
  // We still need to get the user data for the UsersManagement component
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    redirect('/login');
  }

  // Get the admin user data that UsersManagement expects
  const adminUser = await prisma.user.findUnique({
    where: { workosUserId: user.id },
    include: { company: true }
  });

  if (!adminUser || adminUser.role !== 'admin') {
    redirect('/dashboard'); // Redirect to dashboard if not admin
  }

  return <UsersManagement adminUser={adminUser} />;
}