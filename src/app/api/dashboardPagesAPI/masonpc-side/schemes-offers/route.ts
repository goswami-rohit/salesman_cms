// src/app/api/dashboardPagesAPI/masonpc-side/schemes-offers/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
// Assuming the schema is in the same shared file
import { schemesOffersSchema } from '@/lib/shared-zod-schema'; 

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

    // 2. Fetch Current User to check role
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    // 3. Authorization Check
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only allowed roles can access this data.` }, { status: 403 });
    }

    // 4. Fetch SchemesOffers Records
    // The SchemesOffers model has no direct companyId,
    // so we fetch all available schemes.
    const schemes = await prisma.schemesOffers.findMany({
      orderBy: {
        startDate: 'desc', // Get the most recent schemes first
      },
      take: 500, // Add a reasonable limit
    });

    // 5. Format the data to match the Zod schema
    const formattedSchemes = schemes.map(scheme => ({
      id: scheme.id,
      name: scheme.name,
      description: scheme.description,
      startDate: scheme.startDate?.toISOString() ?? null, // Convert DateTime to ISO string or null
      endDate: scheme.endDate?.toISOString() ?? null,     // Convert DateTime to ISO string or null
    }));

    // 6. Validate the data against the Zod schema
    const validatedSchemes = z.array(schemesOffersSchema).parse(formattedSchemes);

    return NextResponse.json(validatedSchemes, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching schemes-offers data:', error);
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    // Return a 500 status with a generic error message
    return NextResponse.json({ error: 'Failed to fetch schemes-offers data' }, { status: 500 });
  } finally {
    // await prisma.$disconnect();
  }
}