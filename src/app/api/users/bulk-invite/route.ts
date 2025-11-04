// src/app/api/users/bulk-invite/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { WorkOS } from '@workos-inc/node';
import { 
    sendInvitationEmailGmail, 
    generateRandomPassword, 
} from '@/app/api/users/route';

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

// Define the expected structure for a single user in the request body
interface SingleUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string;
    region?: string;
    area?: string;
}
interface AdminUserWithCompany {
    id: number;
    companyId: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    company: {
        companyName: string;
        // Include any other Company fields accessed (e.g., region, area, id)
    } | null;
}

// Reusable Core Logic for Invitation (Extracted from your original POST handler)
async function processSingleInvitation(
    userPayload: SingleUserPayload,
    adminUser: AdminUserWithCompany,
    organizationId: string
) {
    // NOTE: In a real app, move all imports/setup logic (WorkOS, nodemailer, etc.) 
    // into this function or import them from a utility file to ensure they are available.
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);
    const { email, firstName, lastName, phoneNumber, role, region, area } = userPayload;

    if (!email || !firstName || !lastName || !role) {
        throw new Error('Missing required fields for one or more users');
    }

    const workosRole = role.toLowerCase();
    const companyId = adminUser!.companyId;
    const companyName = adminUser!.company!?.companyName;
    const adminName = `${adminUser!.firstName} ${adminUser!.lastName}`;

    // 1. Check for existing user in DB (using unique constraint on email/companyId)
    const existingUser = await prisma.user.findUnique({
        where: { companyId_email: { companyId, email: email } },
    });

    if (existingUser && existingUser.workosUserId) {
        throw new Error(`User ${email} already exists and is active`);
    }

    // 2. Generate Salesman Credentials (if applicable)
    let salesmanLoginId: string | null = null;
    let tempPasswordPlaintext: string | null = null;
    let hashedPassword = null;

    if (['senior-executive', 'executive', 'junior-executive'].includes(workosRole)) {
        let isUnique = false;
        while (!isUnique) {
            const generatedId = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const existingSalesman = await prisma.user.findUnique({ where: { salesmanLoginId: generatedId } });
            if (!existingSalesman) {
                salesmanLoginId = generatedId;
                isUnique = true;
            }
        }
        tempPasswordPlaintext = generateRandomPassword();
        // In production, use bcrypt here:
        // hashedPassword = await bcrypt.hash(tempPasswordPlaintext, await bcrypt.genSalt(10));
        hashedPassword = tempPasswordPlaintext; // Placeholder for non-bcrypt hashing
    }

    // 3. Create WorkOS invitation
    let workosInvitation;
    try {
        workosInvitation = await workos.userManagement.sendInvitation({
            email: email,
            organizationId: organizationId,
            roleSlug: workosRole
        });
    } catch (workosError: any) {
        throw new Error(`WorkOS invitation failed for ${email}: ${workosError.message}`);
    }

    // 4. Create/Update user in your database
    const userData = {
        firstName, 
        lastName, 
        phoneNumber, 
        role: workosRole, 
        region, 
        area,
        status: 'pending',
        inviteToken: workosInvitation.id,
        salesmanLoginId,
        hashedPassword,
    };

    let newUser;
    if (existingUser) {
        newUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: userData,
        });
    } else {
        newUser = await prisma.user.create({
            data: { ...userData, email, workosUserId: null, companyId },
        });
    }

    // 5. Send custom invitation email
    try {
        await sendInvitationEmailGmail({
            to: email,
            firstName, 
            lastName, 
            companyName, 
            adminName,
            inviteUrl: workosInvitation.acceptInvitationUrl,
            role: workosRole,
            fromEmail: process.env.GMAIL_USER || 'noreply@yourcompany.com',
            salesmanLoginId: salesmanLoginId,
            tempPassword: tempPasswordPlaintext
        });
    } catch (emailError) {
        console.error(`❌ Failed to send invitation email to ${email}:`, emailError);
        // Do not throw; log the failure and allow the bulk operation to continue
    }

    return {
        success: true,
        email,
        message: 'Invitation sent and email delivered successfully',
        salesmanLoginId,
    };
}


export async function POST(request: NextRequest) {
    try {
        const claims = await getTokenClaims();
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = claims.sub;
        const organizationId = claims.org_id as string;
        const body = await request.json();

        const usersToProcess: SingleUserPayload[] = Array.isArray(body) ? body : [];

        if (usersToProcess.length === 0) {
            return NextResponse.json({ error: 'No user data provided' }, { status: 400 });
        }
        
        // --- ADMIN & ORGANIZATION CHECK ---
        const adminUser = await prisma.user.findUnique({
            where: { workosUserId: userId },
            include: { company: true }
        });

        if (!adminUser || !allowedAdminRoles.includes(adminUser.role)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No WorkOS Organization ID found' }, { status: 400 });
        }

        // --- BULK PROCESSING LOOP ---
        const results = [];
        let hasErrors = false;

        for (const userPayload of usersToProcess) {
            try {
                const result = await processSingleInvitation(userPayload, adminUser, organizationId);
                results.push(result);
            } catch (error: any) {
                console.error(`Failed to process invitation for ${userPayload.email || 'N/A'}:`, error.message);
                hasErrors = true;
                results.push({
                    success: false,
                    email: userPayload.email,
                    error: error.message.split(': ')[1] || error.message, // Clean up error message
                });
            }
        }
        
        // Return a summary response
        const successfulCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: `Bulk invitation completed: ${successfulCount} successful, ${failedCount} failed.`,
            successfulCount,
            failedCount,
            results,
        }, { status: hasErrors ? 207 : 201 }); // 207 Multi-Status if some failed, 201 if all succeeded

    } catch (error: any) {
        console.error('Error in bulk-invite handler:', error);
        return NextResponse.json({ error: 'An unexpected server error occurred during bulk processing' }, { status: 500 });
    }
}
