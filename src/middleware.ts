// src/middleware.ts
import { authkitMiddleware, withAuth } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      '/',
      '/login',
      '/login/signup',
      '/login/reset-password',
      '/auth/callback',
      '/joinNewUser',
      //'/setup-company', // Keep this path as unauthenticated, as a new user without a company needs to access it.
    ],
  },
  // The 'afterAuth' hook is removed as it's not part of AuthkitMiddlewareOptions.
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

