// src/app/api/delete-user/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';

const allowedAdminRoles = [
    'president',
    'senior-general-manager',
    'general-manager',
    'regional-sales-manager',
    'area-sales-manager',
    'senior-manager',
    'manager',
    'assistant-manager',
];
export async function POST(request: Request) {
    try {
        const workos = new WorkOS(process.env.WORKOS_API_KEY!);
        const claims = await getTokenClaims();

        // Ensure the request is authenticated and the user has an allowed admin role
        if (!claims || !claims.sub || !allowedAdminRoles.includes(claims.role as string)) {
            return NextResponse.json({ error: 'Unauthorized or insufficient role to delete user' }, { status: 403 });
        }

        const body = await request.json();
        const { workosUserId } = body;

        if (!workosUserId) {
            return NextResponse.json({ error: 'WorkOS User ID is required' }, { status: 400 });
        }

        // Call WorkOS API to delete the user
        await workos.userManagement.deleteUser(workosUserId);

        //console.log(`✅ WorkOS user ${workosUserId} deleted successfully.`);
        return NextResponse.json({ message: 'User deleted from WorkOS' }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Error deleting user from WorkOS:', error);
        // Handle specific WorkOS errors if needed (e.g., user not found in WorkOS)
        if (error.status === 404) { // Assuming WorkOS returns 404 if user not found
            return NextResponse.json({ error: 'User not found in WorkOS' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to delete user from WorkOS' }, { status: 500 });
    }
}