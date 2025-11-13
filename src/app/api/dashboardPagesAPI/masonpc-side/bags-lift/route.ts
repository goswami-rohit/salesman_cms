// src/app/api/dashboardPagesAPI/masonpc-side/bags-lift/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { bagLiftSchema } from '@/lib/shared-zod-schema'; // Assuming BagLiftSchema is exported here

// Re-using the allowed roles from your sample. Adjust as needed.
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

// Helper function to format user name or default to email
const formatUserName = (user: { firstName: string | null, lastName: string | null, email: string } | null) => {
  if (!user) return null;
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email;
};

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

    // 4. Fetch BagLift Records for the current user's company
    const bagLiftRecords = await prisma.bagLift.findMany({
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
        purchaseDate: true,
        bagCount: true,
        pointsCredited: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true,
        mason: { select: { name: true } },
        dealer: { select: { name: true } },
        approver: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
      take: 1000, // Add a reasonable limit
    });

    // 5. Format and Flatten the data
    const formattedReports = bagLiftRecords.map(record => ({
      id: record.id,
      masonId: record.masonId,
      masonName: record.mason.name, // Flattened field
      dealerName: record.dealer?.name ?? null, // Flattened field
      purchaseDate: record.purchaseDate.toISOString(), // Keep as full ISO string for frontend date handling
      bagCount: record.bagCount,
      pointsCredited: record.pointsCredited,
      status: record.status,
      approvedBy: record.approvedBy,
      approverName: formatUserName(record.approver), // Flattened field
      approvedAt: record.approvedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      // The shared schema requires only the fields defined in the model,
      // but we return the full flattened structure for the UI.
      // We will validate the core BagLift fields below.
    }));
    
    // NOTE: Zod validation here is tricky because the API response includes 
    // flattened fields (masonName, dealerName, approverName) that are not in 
    // the core bagLiftSchema. We must validate the core fields separately 
    // or create a dedicated API response schema. For security, we validate 
    // the core data structure to ensure data integrity.
    
    // 6. Validate core data structure (simplified for this context)
    // Create a temporary schema for the API response structure.
    const bagLiftResponseSchema = z.object({
        id: z.string(),
        masonId: z.string(),
        masonName: z.string(),
        dealerName: z.string().nullable(),
        purchaseDate: z.string(),
        bagCount: z.number().int(),
        pointsCredited: z.number().int(),
        status: z.string(),
        approvedBy: z.number().int().nullable(),
        approverName: z.string().nullable(),
        approvedAt: z.string().nullable(),
        createdAt: z.string(),
    });

    const validatedReports = z.array(bagLiftResponseSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching bag-lift data:', error);
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch bag-lift data' }, { status: 500 });
  }
}