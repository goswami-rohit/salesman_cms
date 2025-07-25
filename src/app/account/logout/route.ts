// src/app/account/logout/route.ts
import { signOut } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export async function POST() {
  // Call WorkOS AuthKit's signOut function.
  // This will clear the local session cookie and internally handle
  // the communication with WorkOS's logout endpoint.
  await signOut();

  // Your app's final redirect. After WorkOS completes its external redirect
  // (to the "Logout redirect" URI you set in their dashboard),
  // the browser will eventually land on this path in your app.
  // Ensure this matches the page you expect to see after successful logout.
  redirect('/home'); // Or redirect('/'); based on your choice for the landing page.
}