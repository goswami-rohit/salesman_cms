// src/app/auth/callback/route.ts
import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server'; // Make sure these are imported

export const GET = async (request: NextRequest) => { // Ensure GET is async
  console.log('--- Auth Callback Debugging ---');
  console.log('Request URL:', request.url);
  console.log('process.env.WORKOS_REDIRECT_URI:', process.env.WORKOS_REDIRECT_URI);
  console.log('process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI:', process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI);
  console.log('process.env.NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('Request Headers Host:', request.headers.get('host'));
  console.log('Request Headers X-Forwarded-Host:', request.headers.get('x-forwarded-host'));
  console.log('--- End Auth Callback Debugging ---');

  // Determine the correct public host from headers
  const publicHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http'; // Render uses HTTPS

  // Construct the correct public origin
  const correctOrigin = `${protocol}://${publicHost}`;

  // Reconstruct the request URL with the correct origin
  // This creates a new URL object based on the correct origin and the original pathname/search
  const correctUrl = new URL(request.url + request.url.search, correctOrigin);

  // Create a new NextRequest with the corrected URL
  const correctedRequest = new NextRequest(correctUrl.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.body,
    // Add other properties if necessary, though headers/method/body are usually sufficient
  });

  console.log('Corrected Request URL Origin:', correctedRequest.url); // Log the corrected URL

  // Pass the corrected request to handleAuth
  return handleAuth({
    returnPathname: '/home',
  })(correctedRequest); // Pass the correctedRequest here
};