// src/app/login/route.ts
import { getSignInUrl } from '@workos-inc/authkit-nextjs';
//import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const inviteToken = searchParams.get('inviteToken');
    
    console.log('🔍 Login route - invite token:', inviteToken);

    // --- WorkOS Magic Auth - Session Check & Redirect ---
    // Check for the recovery flag from the Magic Auth flow
    const accountActivated = searchParams.get('account_activated');

    if (accountActivated === 'true') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
    }
    // --- END WorkOS Magic Auth ---
    
    // Create response first
    const signInUrl = await getSignInUrl();
    const response = NextResponse.redirect(signInUrl);
    
    // Store invite token in cookie if present
    if (inviteToken) {
        console.log('🍪 Setting invite token cookie:', inviteToken);
        response.cookies.set('inviteToken', inviteToken, { 
            maxAge: 60 * 10, // 10 minutes
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }
    
    return response;
};