// src/app/api/dashboardPagesAPI/masonpc-side/bags-lift/[id]/route.ts
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const allowedRoles = [
  'president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',
];

const bagLiftUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const bagLiftId = resolvedParams.id;

    if (!bagLiftId) {
      return NextResponse.json(
        { error: 'Missing BagLift ID in request URL' },
        { status: 400 }
      );
    }

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
        { error: `Forbidden: Your role (${currentUser?.role || 'None'}) is not authorized for Bag Lift approval.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bagLiftUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status value.', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Fetch BagLift + Mason + User to ensure same company
    const bagLift = await prisma.bagLift.findUnique({
      where: { id: bagLiftId },
      include: {
        mason: {
          include: {
            user: {
              select: { companyId: true },
            },
          },
        },
      },
    });

    if (!bagLift) {
      return NextResponse.json(
        { error: 'Bag Lift record not found' },
        { status: 404 }
      );
    }

    // Company guard
    const masonCompanyId = bagLift.mason.user?.companyId;
    if (!masonCompanyId || masonCompanyId !== currentUser.companyId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update a record from another company.' },
        { status: 403 }
      );
    }

    if (bagLift.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot update a bag lift that is already ${bagLift.status}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.bagLift.update({
      where: { id: bagLiftId },
      data: {
        status,                       // "approved" or "rejected"
        approvedBy: currentUser.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: `Bag Lift status updated to ${status}.`,
        record: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating Bag Lift status:', err);
    return NextResponse.json(
      { error: 'Failed to update Bag Lift status', details: (err as Error).message },
      { status: 500 }
    );
  }
}
