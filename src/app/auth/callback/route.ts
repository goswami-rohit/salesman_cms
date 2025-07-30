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

  // IMPORTANT: Ensure your WorkOS_CLIENT_ID and WORKOS_API_KEY are also set correctly as ENV vars on Render.
  // The handleAuth function uses these internally.

  return handleAuth({
    returnPathname: '/home', // This is correct for the internal app path
    // No 'authkit' property here, as per the TypeScript error.
  })(request);
};