// src/app/api/dashboardPagesAPI/masonpc-side/bags-lift/[id]/route.ts
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { 
  calculateExtraBonusPoints, 
  checkReferralBonusTrigger 
} from '@/lib/pointsCalcLogic'; // Ensure this path matches your project structure

const allowedRoles = [
  'president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',
];

const bagLiftUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  memo: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const bagLiftId = resolvedParams.id;

    if (!bagLiftId) {
      return NextResponse.json({ error: 'Missing BagLift ID' }, { status: 400 });
    }

    // --- 1. Auth & Role Check ---
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true },
    });

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: `Forbidden: Role (${currentUser?.role}) not authorized.` },
        { status: 403 }
      );
    }

    // --- 2. Parse Input ---
    const body = await request.json();
    const parsed = bagLiftUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { status: newStatus, memo } = parsed.data;

    // --- 3. Fetch Existing Record & Validate Context ---
    // We need the mason's data to check company ownership and current state
    const existingRecord = await prisma.bagLift.findUnique({
      where: { id: bagLiftId },
      include: {
        mason: {
          select: {
            id: true,
            bagsLifted: true,
            isReferred: true,
            referredByUser: true,
            user: { select: { companyId: true } }
          }
        }
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Bag Lift not found' }, { status: 404 });
    }

    // Company Security Guard
    const masonCompanyId = existingRecord.mason.user?.companyId;
    if (!masonCompanyId || masonCompanyId !== currentUser.companyId) {
      return NextResponse.json(
        { error: 'Forbidden: Record belongs to another company.' },
        { status: 403 }
      );
    }

    const currentStatus = existingRecord.status;
    const points = existingRecord.pointsCredited; // Main points (Base + Bonanza)
    const masonId = existingRecord.masonId;

    // --- 4. Logic Gate Checks ---
    if (newStatus === currentStatus) {
       return NextResponse.json({ error: `Status is already '${currentStatus}'.` }, { status: 400 });
    }
    if (newStatus === 'approved' && currentStatus === 'rejected') {
       return NextResponse.json({ error: 'Cannot approve a previously rejected transaction.' }, { status: 400 });
    }

    // --- 5. THE TRANSACTION ---
    const result = await prisma.$transaction(async (tx) => {
      
      // === SCENARIO A: APPROVING A PENDING LIFT ===
      if (newStatus === 'approved' && currentStatus === 'pending') {
        
        // 1. Get Mason's state INSIDE transaction to ensure accuracy for slab calcs
        const masonBeforeUpdate = await tx.mason_PC_Side.findUniqueOrThrow({
          where: { id: masonId }
        });

        // 2. Update Bag Lift Status
        const updatedBagLift = await tx.bagLift.update({
          where: { id: bagLiftId },
          data: {
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date(),
          }
        });

        // 3. Insert Points Ledger (Main Credit)
        // Note: sourceId links to the BagLift. 
        await tx.pointsLedger.create({
          data: {
            masonId: masonId,
            sourceType: 'bag_lift',
            sourceId: updatedBagLift.id, // Links 1:1 with BagLift
            points: points,
            memo: memo || `Credit for ${updatedBagLift.bagCount} bags (Base+Bonanza).`
          }
        });

        // 4. Update Mason Balance (Atomic Increment)
        await tx.mason_PC_Side.update({
          where: { id: masonId },
          data: {
            pointsBalance: { increment: points },
            bagsLifted: { increment: updatedBagLift.bagCount }
          }
        });

        // 5. EXTRA BONUS LOGIC (Slab Check)
        const oldTotalBags = masonBeforeUpdate.bagsLifted ?? 0;
        const currentLiftBags = updatedBagLift.bagCount;
        
        const extraBonus = calculateExtraBonusPoints(
            oldTotalBags, 
            currentLiftBags, 
            existingRecord.purchaseDate // Use original purchase date
        );

        if (extraBonus > 0) {
            await tx.pointsLedger.create({
                data: {
                    masonId: masonId,
                    points: extraBonus,
                    sourceType: 'adjustment',
                    // sourceId: null, // Cannot link to BagLift ID again due to Unique constraint in schema
                    memo: `Extra Bonus: ${extraBonus} points for crossing bag slab via BagLift ${updatedBagLift.id}.`,
                }
            });

            await tx.mason_PC_Side.update({
                where: { id: masonId },
                data: { pointsBalance: { increment: extraBonus } }
            });
        }

        // 6. REFERRAL BONUS LOGIC
        if (masonBeforeUpdate.referredByUser) {
            const referralPoints = checkReferralBonusTrigger(oldTotalBags, currentLiftBags);
            
            if (referralPoints > 0) {
                const referrerId = masonBeforeUpdate.referredByUser;
                
                // Credit the Referrer
                await tx.pointsLedger.create({
                    data: {
                        masonId: referrerId,
                        points: referralPoints,
                        sourceType: 'referral_bonus',
                        // sourceId: null, 
                        memo: `Referral bonus for Mason ${masonId} hitting 200 bags.`,
                    }
                });

                await tx.mason_PC_Side.update({
                    where: { id: referrerId },
                    data: { pointsBalance: { increment: referralPoints } }
                });
            }
        }

        return updatedBagLift;
      }

      // === SCENARIO B: REJECTING AN ALREADY APPROVED LIFT ===
      else if (newStatus === 'rejected' && currentStatus === 'approved') {
        
        // 1. Update Bag Lift
        const updatedBagLift = await tx.bagLift.update({
            where: { id: bagLiftId },
            data: { status: 'rejected' }
        });

        // 2. Debit Ledger (Negative Points)
        await tx.pointsLedger.create({
            data: {
                masonId: masonId,
                sourceType: 'adjustment',
                // sourceId: null, // We cannot use bagLiftId here because the approval entry likely already uses it
                points: -points, // Negative
                memo: memo || `Debit adjustment: Bag Lift ${bagLiftId} rejected by User ${currentUser.id}. Reversing main points.`
            }
        });

        // 3. Deduct from Mason (Atomic Decrement)
        await tx.mason_PC_Side.update({
            where: { id: masonId },
            data: {
                pointsBalance: { decrement: points },
                bagsLifted: { decrement: existingRecord.bagCount }
            }
        });

        return updatedBagLift;
      }

      // === SCENARIO C: SIMPLE UPDATE (e.g. Pending -> Rejected) ===
      else {
        return await tx.bagLift.update({
            where: { id: bagLiftId },
            data: { status: newStatus }
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: `Bag Lift status updated to '${result.status}'.`,
        data: result,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating Bag Lift status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update Bag Lift status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}