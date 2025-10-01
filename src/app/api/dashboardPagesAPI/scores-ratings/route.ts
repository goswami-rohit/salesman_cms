// src/app/api/dashboardPagesAPI/scores-ratings/route.ts
// This file serves as a unified API endpoint for fetching either Salesperson Ratings or Dealer Scores,
// determined by a 'type' query parameter (e.g., /api/dashboardPagesAPI/scores-ratings?type=salesman).

import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

// Define Zod schemas for the two different data types returned by this API.
// This ensures that the data sent to the frontend is correctly typed and validated.

// Schema for Salesperson Ratings
const salesmanRatingSchema = z.object({
  id: z.number(),
  salesPersonName: z.string(),
  area: z.string(),
  region: z.string(),
  rating: z.number().int(),
});

// Schema for Dealer Scores
const dealerScoreSchema = z.object({
  id: z.string(),
  dealerName: z.string(),
  dealerScore: z.number(),
  trustWorthinessScore: z.number(),
  creditWorthinessScore: z.number(),
  orderHistoryScore: z.number(),
  visitFrequencyScore: z.number(),
  lastUpdatedDate: z.string().date(),
});

// A list of roles that are allowed to access this endpoint.
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

export async function GET(request: Request) {
  try {
    // 1. Authentication Check: Verify the user is logged in
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to check their role and companyId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true }
    });

    // 3. Role-based Authorization Check: Ensure the user's role is allowed
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Your role does not have access to this data.` }, { status: 403 });
    }

    // 4. Determine the type of report to fetch from the URL query parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');

    if (!reportType) {
      return NextResponse.json({ error: 'Missing required query parameter: type' }, { status: 400 });
    }

    // 5. Fetch and format data based on the report type
    switch (reportType) {
      case 'salesman': {
        // Fetch Salesperson Ratings
        const salesmanRatings = await prisma.rating.findMany({
          where: {
            user: {
              companyId: currentUser.companyId,
            },
          },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        });

        const formattedRatings = salesmanRatings.map(rating => {
          const salesPersonName = `${rating.user.firstName || ''} ${rating.user.lastName || ''}`.trim() || rating.user.email;
          return {
            id: rating.id,
            salesPersonName: salesPersonName,
            area: rating.area,
            region: rating.region,
            rating: rating.rating,
          };
        });

        // Validate the formatted data against the schema
        const validatedRatings = z.array(salesmanRatingSchema).parse(formattedRatings);
        return NextResponse.json(validatedRatings, { status: 200 });
      }
        case 'dealer': {
        // Corrected Query: Fetching scores for dealers by filtering on the related Dealer's companyId.
        const dealerScores = await prisma.dealerReportsAndScores.findMany({
          where: {
            dealer: {
              user: {
                companyId: currentUser.companyId,
              },
            },
          },
          include: {
            dealer: {
              select: { name: true },
            },
          },
        });

        const formattedScores = dealerScores.map(score => {
          return {
            id: score.id,
            dealerName: score.dealer.name,
            dealerScore: score.dealerScore.toNumber(),
            trustWorthinessScore: score.trustWorthinessScore.toNumber(),
            creditWorthinessScore: score.creditWorthinessScore.toNumber(),
            orderHistoryScore: score.orderHistoryScore.toNumber(),
            visitFrequencyScore: score.visitFrequencyScore.toNumber(),
            lastUpdatedDate: score.lastUpdatedDate.toISOString().split('T')[0],
          };
        });

        // Validate the formatted data against the schema
        const validatedScores = z.array(dealerScoreSchema).parse(formattedScores);
        return NextResponse.json(validatedScores, { status: 200 });
      }

      default:
        // Handle invalid 'type' parameter
        return NextResponse.json({ error: 'Invalid report type specified.' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching scores or ratings:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: (error as Error).message }, { status: 500 });
  }
}
