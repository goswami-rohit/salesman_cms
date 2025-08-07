// src/app/page.tsx
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import SignedInHomePage from '@/app/home/signedInHomePage'; 
import SignedOutHomePage from '@/app/home/signedOutHomePage'; 

export default async function LandingPage() {
  const claims = await getTokenClaims();

  // If the user is signed in, render the signed-in page.
  if (claims && claims.sub) {
    return <SignedInHomePage claims={claims} />;
  }

  // If the user is not signed in, render the signed-out page.
  return <SignedOutHomePage />;
}
