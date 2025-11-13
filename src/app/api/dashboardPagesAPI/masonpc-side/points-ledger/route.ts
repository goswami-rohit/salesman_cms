// src/app/api/dashboardPagesAPI/masonpc-side/points-ledger/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { pointsLedgerSchema } from '@/lib/shared-zod-schema'; // Assuming PointsLedgerSchema is exported here

// Re-using the allowed roles from your sample. Adjust as needed.
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // 1. Authentication Check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to check role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { role: true, companyId: true }
    });

    // 3. Authorization Check
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only allowed roles can access this data.` }, { status: 403 });
    }

    // 4. Fetch PointsLedger Records for the current user's company
    const ledgerRecords = await prisma.pointsLedger.findMany({
      where: {
        // Filter records where the associated mason's user belongs to the current user's company
        mason: {
          user: {
            companyId: currentUser.companyId,
          },
        },
      },
      select: {
        id: true,
        masonId: true,
        sourceType: true,
        sourceId: true,
        points: true,
        memo: true,
        createdAt: true,
        mason: { select: { name: true } }, // Join to get Mason Name
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Add a reasonable limit
    });

    // 5. Format and Flatten the data
    const formattedReports = ledgerRecords.map(record => ({
      id: record.id,
      masonId: record.masonId,
      masonName: record.mason.name, // Flattened field
      sourceType: record.sourceType,
      sourceId: record.sourceId ?? null,
      points: record.points,
      memo: record.memo ?? null,
      createdAt: record.createdAt.toISOString(),
    }));
    
    // 6. Validate core data structure
    // Create a temporary schema for the API response structure that includes the flattened masonName
    const ledgerResponseSchema = z.object({
        id: z.string(),
        masonId: z.string(),
        masonName: z.string(),
        sourceType: z.string(),
        sourceId: z.string().nullable(),
        points: z.number().int(),
        memo: z.string().nullable(),
        createdAt: z.string(),
    });

    const validatedReports = z.array(ledgerResponseSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching points ledger data:', error);
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch points ledger data' }, { status: 500 });
  }
}