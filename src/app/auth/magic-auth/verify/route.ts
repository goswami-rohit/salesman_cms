// src/app/api/auth/magic-auth/verify/route.ts
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// --- START: IP UTILITY ---
function getIpAddress(request: NextRequest): string | undefined {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return undefined;
}
// --- END: IP UTILITY ---

// --- FIX: Define the required constant locally ---
const WORKOS_SESSION_COOKIE_NAME = 'wos-session';

// Initialize the WorkOS client.
if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID) {
    throw new Error('WorkOS environment variables are not set');
}
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const CLIENT_ID = process.env.WORKOS_CLIENT_ID;

/**
 * Handles the POST request for Magic Auth Code Verification.
 * This is the route: /api/auth/magic-auth/verify
 */
export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { email, code, invitationToken } = body;

        if (!email || !code) {
            return NextResponse.json({ error: 'Email and 6-digit code are required.' }, { status: 400 });
        }
        if (typeof code !== 'string') {
            return NextResponse.json({ error: 'Code must be a string.' }, { status: 400 });
        }

        const ipAddress = getIpAddress(request);
        const userAgent = request.headers.get('user-agent') ?? undefined;

        console.log('🔄 Magic Auth: Attempting code verification...');

        // 1. Authenticate the user with the Magic Auth code (Code validation/Login attempt)
        const { user, sealedSession } = await workos.userManagement.authenticateWithMagicAuth({
            clientId: CLIENT_ID,
            code: code,
            email: email,
            // DO NOT include invitationToken here to avoid the NotFoundException/state conflict
            ipAddress: ipAddress,
            userAgent: userAgent,
        });

        let userLinked = false;

        if (user && invitationToken) {
            console.log('🔄 Invitation token detected. Attempting to accept invitation on WorkOS...');

            // 2. CRITICAL FIX: Manually accept the invitation using ONLY the token string.
            // This satisfies the TS compiler and forces WorkOS to mark the invite accepted.
            try {
                // Change: Passing only the invitationToken string.
                await workos.userManagement.acceptInvitation(invitationToken);
                console.log(`✅ WorkOS Invitation accepted and user provisioned to org.`);
            } catch (acceptError: any) {
                // If the invite is already accepted or expired, this will fail. Log and proceed.
                if (acceptError.code === 'entity_not_found') {
                    console.warn('⚠️ Invitation already accepted or expired on WorkOS. Proceeding with local DB update.');
                } else {
                    console.error('❌ Failed to explicitly accept WorkOS invitation:', acceptError);
                }
            }

            // 3. MANUAL LOCAL DB LINKING (Your existing logic)
            const pendingUser = await prisma.user.findFirst({
                where: {
                    email: user.email,
                    status: 'pending',
                    inviteToken: invitationToken
                }
            });

            if (pendingUser) {
                await prisma.user.update({
                    where: { id: pendingUser.id },
                    data: {
                        workosUserId: user.id,
                        status: 'active',
                        inviteToken: null,
                    }
                });
                console.log(`✅ Successfully accepted invitation for local user ID ${pendingUser.id} and linked WorkOS ID ${user.id}`);
                userLinked = true;
            }
        }
        // --- END: MANUAL INVITATION ACCEPTANCE & DB LINKING ---


        // --- SESSION CHECK ---
        if (sealedSession) {
            const cookieManager: any = cookies();
            cookieManager.set(WORKOS_SESSION_COOKIE_NAME, sealedSession, {
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });

            console.log(`✅ User authenticated via Magic Auth: ${user!.email}. Session cookie set.`);

            // Redirect the user to the protected dashboard
            const response = NextResponse.redirect(new URL('/dashboard', request.url));
            return response;
        }

        // --- FAILURE/RECOVERY PATH ---
        else {
            console.error('Authentication Failed: No sealedSession returned from WorkOS. Forcing clean redirect.');

            if (userLinked) {
                // Account is now active and provisioned, force standard login attempt.
                return NextResponse.json({
                    success: true,
                    redirectUrl: '/login?account_activated=true'
                }, { status: 200 });
            }

            // Fallback for generic session failure or if user wasn't linked
            return NextResponse.json({
                error: 'Authentication failed. Please try again or use the Google Sign In option.'
            }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Magic Auth Verify Handler Failed:', error);

        // Handle WorkOS specific authentication failure errors
        if (error.response?.data?.error === 'invalid_grant' || error.status === 401) {
            return NextResponse.json({
                error: 'Invalid code or email. Please check your inbox and try again.'
            }, { status: 401 });
        }
        if (error.code === 'not_authorized') {
            return NextResponse.json({ error: 'Authentication is not authorized for this user.' }, { status: 403 });
        }

        // Handle invitation not found error gracefully, as the user might be fine
        if (error.code === 'entity_not_found') {
            return NextResponse.json({
                error: 'Authentication failed. Please use Google Sign In to accept your invitation.',
            }, { status: 401 });
        }

        return NextResponse.json({
            error: 'An unexpected server error occurred during login.'
        }, { status: 500 });
    }
};

// Disable all other HTTP methods
export const GET = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });