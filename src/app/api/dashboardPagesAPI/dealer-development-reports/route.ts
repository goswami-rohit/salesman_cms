// src/app/api/dashboardPagesAPI/dealer-development-reports/route.ts

import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

// Define Zod schema for the data returned by this API
const dealerDevelopmentSchema = z.object({
  id: z.number(),
  salesPersonName: z.string(),
  dealerName: z.string(),
  creationDate: z.string().date(), // YYYY-MM-DD string
  status: z.string(),
  obstacle: z.string().nullable(),
});

// A list of roles that are allowed to access this endpoint.
// This should be adjusted based on your application's specific requirements.
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

export async function GET() {
  try {
    // 1. Authentication Check: Verify the user is logged in
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to check their role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true } // Select only necessary fields
    });

    // 3. Role-based Authorization Check: Ensure the user's role is allowed to access this data
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Your role does not have access to this data.` }, { status: 403 });
    }

    // 4. Fetch DDP Reports for the current user's company
    const ddpReports = await prisma.dDP.findMany({
      where: {
        // Filter DDP records by the company of the salesperson who created them
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: { // Include user details to get the salesperson's name
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dealer: { // Include dealer details to get their name
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        creationDate: 'desc', // Order by latest reports first
      },
    });

    // 5. Format the data to match the frontend's expected structure and validate
    const formattedReports = ddpReports.map(report => {
      // Construct the sales person's full name from first and last name
      const salesPersonName = `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email;

      return {
        id: report.id,
        salesPersonName: salesPersonName,
        dealerName: report.dealer.name,
        creationDate: report.creationDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD string
        status: report.status,
        obstacle: report.obstacle,
      };
    });

    // Validate the formatted data against the schema to ensure data integrity
    const validatedReports = z.array(dealerDevelopmentSchema).parse(formattedReports);

    return NextResponse.json(validatedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching dealer development reports:', error);
    // Return a generic error message to the client, logging the specific error internally
    return NextResponse.json({ error: 'Failed to fetch dealer development reports', details: (error as Error).message }, { status: 500 });
  }
}
