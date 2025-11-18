// src/app/api/auth/magic-auth/verify/route.ts
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';
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

// --- Define the required constant locally ---
const WORKOS_SESSION_COOKIE_NAME = 'wos-session';

// Initialize the WorkOS client.
if (!process.env.WORKOS_API_KEY || !process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_COOKIE_PASSWORD) { // <-- ADDED COOKIE PASSWORD CHECK
    throw new Error('WorkOS environment variables are not set');
}
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const CLIENT_ID = process.env.WORKOS_CLIENT_ID;
const COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD; // <-- ADDED THIS

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
        //    --- THIS IS THE FIX ---
        //    We are asking for the session AND providing the cookie password.
        const { user, sealedSession } = await workos.userManagement.authenticateWithMagicAuth({
            clientId: CLIENT_ID,
            code: code,
            email: email,
            session: {
                sealSession: true,
                cookiePassword: COOKIE_PASSWORD
            },
            // DO NOT include invitationToken here, as we know this fails.
            ipAddress: ipAddress,
            userAgent: userAgent,
        });

        // --- SESSION CHECK (This should now work!) ---
        if (sealedSession) {
            console.log(`User authenticated via Magic Auth: ${user!.email}. Session cookie set.`);

            // --- Now, run the invitation logic separately ---
            if (user && invitationToken) {
                console.log('Invitation token detected. Attempting to accept invitation on WorkOS...');
                try {
                    await workos.userManagement.acceptInvitation(invitationToken);
                    console.log(`WorkOS Invitation accepted and user provisioned to org.`);
                } catch (acceptError: any) {
                    if (acceptError.code === 'entity_not_found') {
                        console.warn('Invitation already accepted or expired on WorkOS. Proceeding.');
                    } else {
                        console.error('Failed to explicitly accept WorkOS invitation:', acceptError);
                    }
                }

                // 3. MANUAL LOCAL DB LINKING
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
                    console.log(`Successfully accepted invitation for local user ID ${pendingUser.id} and linked WorkOS ID ${user.id}`);
                }
            }
            // --- END: INVITATION LOGIC ---

            // --- THIS IS THE FIX ---
            // 1. Create the JSON response that the client is expecting.
            const response = NextResponse.json({ success: true, redirectUrl: '/dashboard' });

            // 2. Set the cookie *on the response object*.
            response.cookies.set(WORKOS_SESSION_COOKIE_NAME, sealedSession, {
                path: '/',
                maxAge: 7 * 24 * 60 * 60,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });

            // 3. Return the response with both JSON and cookie.
            return response;
            // --- END OF FIX ---
        }

        // --- FAILURE/RECOVERY PATH ---
        // This is your original, correct "two-login" flow.
        else {
            console.error('Authentication Failed: No sealedSession returned from WorkOS. Forcing clean redirect.');

            // We can still try to link the user even if we didn't get a session
            let userLinked = false;
            if (user && invitationToken) {
                // (We'll just re-run the logic here for simplicity)
                console.log('🔄 (Fallback) Invitation token detected. Attempting to accept invitation on WorkOS...');
                try {
                    await workos.userManagement.acceptInvitation(invitationToken);
                    console.log(`(Fallback) WorkOS Invitation accepted.`);
                } catch (acceptError: any) {
                    console.warn('(Fallback) Invitation already accepted or expired.');
                }

                const pendingUser = await prisma.user.findFirst({
                    where: { email: user.email, status: 'pending', inviteToken: invitationToken }
                });
                if (pendingUser) {
                    await prisma.user.update({
                        where: { id: pendingUser.id },
                        data: { workosUserId: user.id, status: 'active', inviteToken: null }
                    });
                    console.log(`(Fallback) Successfully linked local user ID ${pendingUser.id}`);
                    userLinked = true;
                }
            }

            if (userLinked) {
                // Account is now active and provisioned, force standard login attempt.
                return NextResponse.json({
                    success: true,
                    redirectUrl: '/login?account_activated=true'
                }, { status: 200 });
            }

            return NextResponse.json({
                error: 'Authentication failed. Please try again.'
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
        if (error.code === 'entity_not_found') {
            return NextResponse.json({
                error: 'Authentication failed. Your invitation token may be invalid.',
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