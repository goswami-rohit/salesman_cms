// src/app/api/dashboardPagesAPI/masonpc-side/mason-pc/[id]/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// FIX: Replaced z.enum with z.string()
const kycUpdateSchema = z.object({
    verificationStatus: z.string(), // Expects "VERIFIED" or "REJECTED"
    adminRemarks: z.string().nullable().optional(), // String? in Prisma is nullable().optional()
});

// FE → Mason_PC_Side.kycStatus
const masonStatusMap: Record<'VERIFIED' | 'REJECTED', string> = {
  VERIFIED: 'verified',
  REJECTED: 'none',
};

// FE → KYCSubmission.status
const submissionStatusMap: Record<'VERIFIED' | 'REJECTED', string> = {
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};



const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
    'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
    'senior-manager', 'manager', 'assistant-manager',
    'senior-executive',];

/**
 * PUT: Update the kycStatus on Mason_PC_Side and the latest status/remark on KYCSubmission.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const masonPcId = resolvedParams.id;

        if (!masonPcId) {
            return NextResponse.json({ error: 'Missing Mason/PC ID in request URL' }, { status: 400 });
        }

        const claims = await getTokenClaims();

        // 1. Authentication & Authorization Check (unchanged)
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized: No claims found' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true }
        });

        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({ error: `Forbidden: Your role (${currentUser?.role || 'None'}) is not authorized for KYC verification.` }, { status: 403 });
        }

        // 2. Validate request body
        const body = await request.json();
        const validatedBody = kycUpdateSchema.safeParse(body);

        if (!validatedBody.success) {
            console.error("KYC PUT Request Body Validation Error:", validatedBody.error);
            return NextResponse.json({ error: 'Invalid verification status format or value.', details: validatedBody.error.issues }, { status: 400 });
        }

        const { verificationStatus, adminRemarks } = validatedBody.data;

        // Validation against accepted status values (now string-based)
        if (verificationStatus !== 'VERIFIED' && verificationStatus !== 'REJECTED') {
            return NextResponse.json({ error: 'Invalid verificationStatus value provided.' }, { status: 400 });
        }

        const masonNextStatus = masonStatusMap[verificationStatus];
        const submissionNextStatus = submissionStatusMap[verificationStatus];

        // 3. Verify Mason/PC ownership and existence
        const masonPcToUpdate = await prisma.mason_PC_Side.findUnique({
            where: { id: masonPcId },
            include: { user: true, kycSubmissions: { where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!masonPcToUpdate) {
            return NextResponse.json({ error: 'Mason/PC record not found' }, { status: 404 });
        }

        // Ensure the record belongs to the current user's company (unchanged)
        if (!masonPcToUpdate.user || masonPcToUpdate.user.companyId !== currentUser.companyId) {
            return NextResponse.json({ error: 'Forbidden: Cannot update a record from another company' }, { status: 403 });
        }

        const latestPendingSubmission = masonPcToUpdate.kycSubmissions?.[0];

        // Use a transaction to update both Mason_PC_Side and the latest KYCSubmission
        const [updatedMasonPc] = await prisma.$transaction([
            prisma.mason_PC_Side.update({
                where: { id: masonPcId },
                data: {
                    kycStatus: masonNextStatus, // "approved" or "none"
                },
            }),

            latestPendingSubmission
                ? prisma.kYCSubmission.update({
                    where: { id: latestPendingSubmission.id },
                    data: {
                        status: submissionNextStatus, // "verified" or "rejected"
                        remark: adminRemarks ?? null,
                    },
                })
                : prisma.$queryRaw`SELECT 1;`,
        ]);

        // 5. Success Response
        return NextResponse.json({
            message: `Mason/PC KYC status updated to ${verificationStatus} and submission record processed.`,
            record: updatedMasonPc
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating Mason/PC KYC status (PUT):', error);
        return NextResponse.json({ error: 'Failed to update KYC status', details: (error as Error).message }, { status: 500 });
    }
}