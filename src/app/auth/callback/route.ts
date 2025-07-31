// src/app/auth/callback/route.ts
import { handleAuth, getTokenClaims } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const GET = async (request: NextRequest) => {
    // --- Existing URL parsing logic to fix deployment issues ---
    const originalUrlObject = new URL(request.url);
    const publicHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https'; 
    const correctBaseUrl = `${protocol}://${publicHost}`;
    const urlSearchParams = originalUrlObject.searchParams; 
    const queryString = urlSearchParams.toString(); 
    const correctedPathAndQuery = '/auth/callback' + (queryString ? '?' + queryString : '');
    const correctedUrlObject = new URL(correctedPathAndQuery, correctBaseUrl);
    const correctedRequest = new NextRequest(correctedUrlObject.toString(), {
      headers: request.headers,
      method: request.method,
    });
    // --- End of existing logic ---
    
    // --- NEW ACTIVATION LOGIC ---
    try {
        // Get claims from the authenticated session. This can be done before handleAuth.
        const claims = await getTokenClaims();

        // Only proceed if claims exist and we have a user
        if (claims && claims.email && claims.sub) {
            const localUser = await prisma.user.findFirst({
                where: {
                    email: claims.email,
                },
            });
    
            // Activate the user if they are found and not yet linked to WorkOS
            if (localUser && !localUser.workosUserId) {
                console.log('🔄 Activating user account on first sign-in for:', localUser.email);
    
                const workosRole = claims.role as string;
                
                await prisma.user.update({
                    where: { id: localUser.id },
                    data: {
                        workosUserId: claims.sub,
                        status: 'active',
                        inviteToken: null,
                        role: workosRole || localUser.role,
                    },
                });
                console.log('✅ User account activated and linked successfully');
            } else if (!localUser) {
                console.error('❌ User from WorkOS not found in local database:', claims.email);
            }
        }
    } catch (error) {
        console.error('❌ Error during database activation in callback:', error);
    }
    
    // Continue with the standard AuthKit handler to set the session and redirect
    return handleAuth({
        returnPathname: '/home',
    })(correctedRequest);
};