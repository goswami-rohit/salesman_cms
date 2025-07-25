// Create: src/app/api/debug-claims/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';

export async function GET() {
    try {
        const claims = await getTokenClaims();
        return NextResponse.json({ 
            claims,
            hasOrgId: !!claims?.org_id,
            orgId: claims?.org_id,
            role: claims?.role,
            sub: claims?.sub
        });
    } catch (error) {
        return NextResponse.json({ error: error.message });
    }
}