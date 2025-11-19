// src/app/api/dashboardPagesAPI/masonpc-side/mason-pc/[id]/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// --- IMPORT BONUS LOGIC ---
import { calculateJoiningBonusPoints } from '@/lib/pointsCalcLogic';

const kycUpdateSchema = z.object({
    verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
    adminRemarks: z.string().nullable().optional(),
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

const allowedRoles = [
    'president', 'senior-general-manager', 'general-manager',
    'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
    'senior-manager', 'manager', 'assistant-manager',
    'senior-executive',
];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const masonPcId = resolvedParams.id;

        if (!masonPcId) {
            return NextResponse.json({ error: 'Missing Mason/PC ID in request URL' }, { status: 400 });
        }

        // --- 1. Auth & Role Check ---
        const claims = await getTokenClaims();
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true }
        });

        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({ error: `Forbidden: Role (${currentUser?.role}) not authorized.` }, { status: 403 });
        }

        // --- 2. Validate Body ---
        const body = await request.json();
        const parsed = kycUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { verificationStatus, adminRemarks } = parsed.data;

        const masonNextStatus = masonStatusMap[verificationStatus];
        const submissionNextStatus = submissionStatusMap[verificationStatus];

        // --- 3. Fetch Existing Record ---
        const masonPcToUpdate = await prisma.mason_PC_Side.findUnique({
            where: { id: masonPcId },
            include: { 
                user: true, 
                // Fetch the specific pending submission we are acting on
                kycSubmissions: { 
                    where: { status: 'pending' }, 
                    orderBy: { createdAt: 'desc' }, 
                    take: 1 
                } 
            }
        });

        if (!masonPcToUpdate) {
            return NextResponse.json({ error: 'Mason/PC record not found' }, { status: 404 });
        }

        if (!masonPcToUpdate.user || masonPcToUpdate.user.companyId !== currentUser.companyId) {
            return NextResponse.json({ error: 'Forbidden: External company record.' }, { status: 403 });
        }

        const latestSubmission = masonPcToUpdate.kycSubmissions?.[0];

        // --- 4. BONUS CALCULATION LOGIC ---
        const joiningBonus = calculateJoiningBonusPoints(); // Currently 250
        
        // Check if we should apply the bonus:
        // 1. Action must be 'VERIFIED'
        // 2. User must NOT already be 'verified' (prevent double-clicking or re-verifying for points)
        // 3. Bonus amount must be > 0 (within date range)
        // 4. Must have a valid submission record to link the transaction to
        const alreadyVerified = masonPcToUpdate.kycStatus === 'verified';
        const shouldApplyBonus = 
            verificationStatus === 'VERIFIED' && 
            !alreadyVerified && 
            joiningBonus > 0 &&
            !!latestSubmission;


        // --- 5. TRANSACTION ---
        const updatedRecord = await prisma.$transaction(async (tx) => {
            
            // A. Update Mason Status (and Balance if applicable)
            const updatedMason = await tx.mason_PC_Side.update({
                where: { id: masonPcId },
                data: {
                    kycStatus: masonNextStatus,
                    // Atomic increment if bonus applies
                    pointsBalance: shouldApplyBonus 
                        ? { increment: joiningBonus } 
                        : undefined 
                },
            });

            // B. Update KYC Submission Status
            if (latestSubmission) {
                await tx.kYCSubmission.update({
                    where: { id: latestSubmission.id },
                    data: {
                        status: submissionNextStatus,
                        remark: adminRemarks ?? null,
                    },
                });
            }

            // C. Insert Ledger Entry (Only if Bonus Applies)
            if (shouldApplyBonus && latestSubmission) {
                await tx.pointsLedger.create({
                    data: {
                        masonId: masonPcId,
                        sourceType: 'joining_bonus',
                        // We link the bonus to the specific KYC Submission ID. 
                        // Since sourceId is @unique, this mathematically prevents duplicate bonuses for the same document.
                        sourceId: latestSubmission.id, 
                        points: joiningBonus,
                        memo: `Joining Bonus: KYC Verified on ${new Date().toLocaleDateString()}`
                    }
                });
            }

            return updatedMason;
        });

        // --- 6. Return Success ---
        return NextResponse.json({
            message: `Mason/PC KYC updated to ${verificationStatus}. ${shouldApplyBonus ? `Joining Bonus of ${joiningBonus} points applied.` : ''}`,
            record: updatedRecord
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating KYC:', error);
        // Handle specific Prisma unique constraint violations gracefully if they happen
        if ((error as any).code === 'P2002') {
             return NextResponse.json({ error: 'Transaction failed: Bonus already applied for this submission.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update KYC status', details: (error as Error).message }, { status: 500 });
    }
}