// src/app/auth/callback/route.ts
import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  return handleAuth({
    returnPathname: '/dashboard',
  })(request);
};