// src/app/api/dashboardPagesAPI/masonpc-side/mason-pc/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
// Assuming the schema is in the same shared file as your example
import { masonPCSideSchema } from '@/lib/shared-zod-schema'; 

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
      include: { company: true }
    });

    // 3. Authorization Check
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only allowed roles can access this data.` }, { status: 403 });
    }

    // 4. Fetch Mason_PC_Side Records for the current user's company
    const masonPcRecords = await prisma.mason_PC_Side.findMany({
      where: {
        // Filter records where the associated user belongs to the current user's company
        user: {
          companyId: currentUser.companyId,
        },
      },
      orderBy: {
        name: 'asc', // Order by name alphabetically
      },
      take: 1000, // Add a reasonable limit
    });

    // 5. Format the data (if needed)
    // In this case, the Prisma model (Mason_PC_Side) fields directly map
    // to the zod schema (masonPCSideSchema). No complex .map() is needed
    // as there are no Decimals or DateTimes to convert for this specific schema.
    const formattedReports = masonPcRecords.map(record => ({
      id: record.id,
      name: record.name,
      phoneNumber: record.phoneNumber,
      kycDocumentName: record.kycDocumentName,
      kycDocumentIdNum: record.kycDocumentIdNum,
      verificationStatus: record.verificationStatus,
      bagsLifted: record.bagsLifted,
      pointsGained: record.pointsGained,
      isReferred: record.isReferred,
      referredByUser: record.referredByUser,
      referredToUser: record.referredToUser,
      dealerId: record.dealerId,
      userId: record.userId,
    }));


    // 6. Validate the data against the Zod schema
    const validatedReports = z.array(masonPCSideSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching mason/pc data:', error);
    // Handle Zod validation errors specifically if you want
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch mason/pc data' }, { status: 500 });
  } finally {
    // It's generally not recommended to manually disconnect prisma in serverless environments
    // await prisma.$disconnect();
  }
}