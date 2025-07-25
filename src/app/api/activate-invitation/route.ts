// src/app/api/activate-invitation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const claims = await getTokenClaims();
        
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get invite token from request cookies
        const inviteToken = req.cookies.get('inviteToken')?.value;
        
        if (!inviteToken) {
            return NextResponse.json({ message: 'No pending invitation found' });
        }

        console.log('🔍 Activating invitation with token:', inviteToken);

        // Find user by invitation token
        const pendingUser = await prisma.user.findFirst({
            where: {
                inviteToken: inviteToken,
                status: 'pending'
            }
        });

        if (!pendingUser) {
            // Create response to clear invalid cookie
            const response = NextResponse.json({ message: 'Invalid or expired invitation' });
            response.cookies.delete('inviteToken');
            return response;
        }

        // Update user with WorkOS ID and activate
        const activatedUser = await prisma.user.update({
            where: { id: pendingUser.id },
            data: {
                workosUserId: claims.sub,
                status: 'active',
                inviteToken: null,
            }
        });

        console.log('✅ User activated:', activatedUser.email);

        // Create success response and clear cookie
        const response = NextResponse.json({ 
            success: true, 
            user: activatedUser 
        });
        response.cookies.delete('inviteToken');
        
        return response;

    } catch (error) {
        console.error('❌ Error activating invitation:', error);
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}