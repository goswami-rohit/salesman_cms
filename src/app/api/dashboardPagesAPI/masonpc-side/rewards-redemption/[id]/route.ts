// src/app/api/dashboardPagesAPI/masonpc-side/rewards-redemption/[id]/route.ts
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const allowedRoles = [
  'president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive', 'executive',
];

const redemptionUpdateSchema = z.object({
  status: z.enum(['approved', 'shipped', 'delivered', 'rejected']),
  fulfillmentNotes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const redemptionId = resolvedParams.id;

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- 2. Validate Input ---
    const body = await request.json();
    const parsed = redemptionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { status: newStatus, fulfillmentNotes } = parsed.data;

    // --- 3. Fetch Existing Record ---
    // We need the mason's ID, the cost, and the reward ID for stock checks
    const existingRecord = await prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        mason: { select: { id: true, user: { select: { companyId: true } } } },
        reward: { select: { id: true, stock: true } } // Fetch current stock
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Redemption record not found' }, { status: 404 });
    }

    // Company Security Guard
    const masonCompanyId = existingRecord.mason.user?.companyId;
    if (!masonCompanyId || masonCompanyId !== currentUser.companyId) {
        return NextResponse.json({ error: 'Forbidden: Record belongs to another company.' }, { status: 403 });
    }

    const currentStatus = existingRecord.status;
    const { masonId, pointsDebited, quantity, rewardId } = existingRecord;

    // --- 4. Flow Logic Gates ---
    if (currentStatus === 'delivered' && newStatus !== 'delivered') {
       return NextResponse.json({ error: 'Cannot change status of an already delivered item.' }, { status: 400 });
    }
    if (currentStatus === 'rejected') {
       return NextResponse.json({ error: 'Cannot update a rejected order.' }, { status: 400 });
    }

    // --- 5. THE TRANSACTION ---
    const result = await prisma.$transaction(async (tx) => {

        // ==================================================================
        // CASE A: APPROVING (Placed -> Approved)
        // Action: DEDUCT STOCK. (Points were already deducted on creation)
        // ==================================================================
        if (currentStatus === 'placed' && newStatus === 'approved') {
            
            // 1. Check Stock again (Concurrency safety)
            const rewardItem = await tx.rewards.findUniqueOrThrow({
                where: { id: rewardId }
            });

            if (rewardItem.stock < quantity) {
                throw new Error(`Insufficient stock. Available: ${rewardItem.stock}, Required: ${quantity}`);
            }

            // 2. Deduct Stock
            await tx.rewards.update({
                where: { id: rewardId },
                data: { stock: { decrement: quantity } }
            });

            // 3. Update Status
            return await tx.rewardRedemption.update({
                where: { id: redemptionId },
                data: { 
                    status: 'approved', 
                    updatedAt: new Date()
                    // You might want to add an 'approvedBy' field to your schema later
                }
            });
        }

        // ==================================================================
        // CASE B: REJECTING (Placed -> Rejected)
        // Action: REFUND POINTS (Stock was never taken)
        // ==================================================================
        else if (currentStatus === 'placed' && newStatus === 'rejected') {
            
            // 1. Refund Points (Ledger)
            await tx.pointsLedger.create({
                data: {
                    id: randomUUID(),
                    masonId: masonId,
                    sourceType: 'adjustment',
                    sourceId: redemptionId, // Link back to the order
                    points: pointsDebited, // Positive value adds back to balance
                    memo: `Refund: Order ${redemptionId.substring(0,8)} rejected by Admin. ${fulfillmentNotes || ''}`
                }
            });

            // 2. Update Balance
            await tx.mason_PC_Side.update({
                where: { id: masonId },
                data: { pointsBalance: { increment: pointsDebited } }
            });

            // 3. Update Status
            return await tx.rewardRedemption.update({
                where: { id: redemptionId },
                data: { status: 'rejected', updatedAt: new Date() }
            });
        }

        // ==================================================================
        // CASE C: REJECTING (Approved -> Rejected)
        // Action: REFUND POINTS + RETURN STOCK
        // ==================================================================
        else if (currentStatus === 'approved' && newStatus === 'rejected') {
            
            // 1. Refund Points
            await tx.pointsLedger.create({
                data: {
                    id: randomUUID(),
                    masonId: masonId,
                    sourceType: 'adjustment',
                    sourceId: redemptionId,
                    points: pointsDebited, 
                    memo: `Refund: Approved Order ${redemptionId.substring(0,8)} cancelled.`
                }
            });

            // 2. Update Balance
            await tx.mason_PC_Side.update({
                where: { id: masonId },
                data: { pointsBalance: { increment: pointsDebited } }
            });

            // 3. Return Stock
            await tx.rewards.update({
                where: { id: rewardId },
                data: { stock: { increment: quantity } }
            });

            // 4. Update Status
            return await tx.rewardRedemption.update({
                where: { id: redemptionId },
                data: { status: 'rejected', updatedAt: new Date() }
            });
        }

        // ==================================================================
        // CASE D: FULFILLMENT (Approved -> Shipped -> Delivered)
        // Action: Just update status.
        // ==================================================================
        else {
            return await tx.rewardRedemption.update({
                where: { id: redemptionId },
                data: { status: newStatus, updatedAt: new Date() }
            });
        }
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating Reward Redemption:', error);
    // Handle custom stock error
    if (error.message && error.message.includes('Insufficient stock')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update redemption status' }, { status: 500 });
  }
}