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

  // Determine the correct public host from headers provided by Render
  const publicHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  // Render always serves over HTTPS, so ensure the protocol is set correctly
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  // Construct the correct public origin (e.g., "https://salesmancms-dashboard.onrender.com")
  const correctBaseUrl = `${protocol}://${publicHost}`;

  // Combine the pathname and search query from the original request URL
  // This ensures no accidental global variables or functions are concatenated.
  const correctedPathAndQuery = '/auth/callback' + request.url.search;

  // Create a new URL object with the corrected public origin
  // This effectively overrides the 'localhost:10000' origin seen by Next.js internally
  const correctedUrlObject = new URL(correctedPathAndQuery, correctBaseUrl);

  // Create a new NextRequest instance using the correctly formed public-facing URL
  const correctedRequest = new NextRequest(correctedUrlObject.toString(), {
    headers: request.headers, // Important: Preserve all original headers
    method: request.method,   // Preserve the original method (GET for this route)
    body: request.body, 
  });

  // Log the string representation of the corrected URL to verify its format
  console.log('Corrected Request URL toString():', correctedRequest.url.toString());

  // Pass the corrected request to the handleAuth function
  return handleAuth({
    returnPathname: '/home', // Still redirect to /home within your application
  })(correctedRequest); // Use the corrected request object here
};