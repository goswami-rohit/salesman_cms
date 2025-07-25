// src/app/setup-company/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import SetupCompanyForm from './setupCompanyForm';

export default async function SetupCompanyPage() {
  // Get the authenticated user from WorkOS (runs on the server)
  const { user } = await withAuth({ ensureSignedIn: true });

  // If no user is authenticated, this will be handled by withAuth with ensureSignedIn: true
  // But we can add a fallback just in case
  if (!user) {
    redirect('/login');
  }
  console.log('👤 Creating organization membership WITH admin role...');

  return <SetupCompanyForm />;
}