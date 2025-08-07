// This file, src/app/home/page.tsx, is the landing page for authenticated users.
// It will be rendered when a user navigates to the "/home" route.

import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import SignedInHomePage from '@/app/home/signedInHomePage/page';

export default async function AuthenticatedHomePage() {
  // Get the token claims from the user's session.
  const claims = await getTokenClaims();

  // If there are no claims, the user is not authenticated.
  // Redirect them to the main signed-out landing page.
  if (!claims || !claims.sub) {
    redirect('/');
  }

  // If the user is signed in, render the SignedInHomePage component.
  // This page is a transition or landing page for the authenticated user.
  return (
    <SignedInHomePage claims={claims} />
  );
}
