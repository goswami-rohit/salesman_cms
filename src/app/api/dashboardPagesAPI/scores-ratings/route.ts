// src/app/api/dashboardPagesAPI/scores-ratings/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Salesperson Ratings
export const salesmanRatingSchema = z.object({
  id: z.number(),
  salesPersonName: z.string(),
  area: z.string(),
  region: z.string(),
  rating: z.number().int(),
});

// Dealer Scores (now includes area/region/type; fixed date field)
export const dealerScoreSchema = z.object({
  id: z.string(),
  dealerName: z.string(),
  dealerScore: z.number(),
  trustWorthinessScore: z.number(),
  creditWorthinessScore: z.number(),
  orderHistoryScore: z.number(),
  visitFrequencyScore: z.number(),
  lastUpdatedDate: z.string(),     // YYYY-MM-DD string we format below
  area: z.string().optional(),     // from Dealer.area
  region: z.string().optional(),   // from Dealer.region
  type: z.string().optional(),     // from Dealer.type
});

const allowedRoles = [
  'president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager', 'senior-executive',
];

export async function GET(request: Request) {
  try {
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
        { error: 'Forbidden: Your role does not have access to this data.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    if (!reportType) {
      return NextResponse.json({ error: 'Missing required query parameter: type' }, { status: 400 });
    }

    switch (reportType) {
      case 'salesman': {
        const salesmanRatings = await prisma.rating.findMany({
          where: { user: { companyId: currentUser.companyId } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        });

        const formatted = salesmanRatings.map(r => ({
          id: r.id,
          salesPersonName:
            `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.email,
          area: r.area,
          region: r.region,
          rating: r.rating,
        }));

        const validated = z.array(salesmanRatingSchema).parse(formatted);
        return NextResponse.json(validated, { status: 200 });
      }

      case 'dealer': {
        const dealerScores = await prisma.dealerReportsAndScores.findMany({
          where: {
            dealer: {
              user: { companyId: currentUser.companyId },
            },
          },
          include: {
            dealer: {
              select: {
                name: true,
                area: true,
                region: true,
                type: true,
              },
            },
          },
        });

        const formatted = dealerScores.map(s => ({
          id: s.id,
          dealerName: s.dealer.name,
          dealerScore: s.dealerScore.toNumber(),
          trustWorthinessScore: s.trustWorthinessScore.toNumber(),
          creditWorthinessScore: s.creditWorthinessScore.toNumber(),
          orderHistoryScore: s.orderHistoryScore.toNumber(),
          visitFrequencyScore: s.visitFrequencyScore.toNumber(),
          lastUpdatedDate: s.lastUpdatedDate.toISOString().split('T')[0],
          area: s.dealer.area ?? '',
          region: s.dealer.region ?? '',
          type: s.dealer.type ?? '',
        }));

        const validated = z.array(dealerScoreSchema).parse(formatted);
        return NextResponse.json(validated, { status: 200 });
      }

      default:
        return NextResponse.json({ error: 'Invalid report type specified.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching scores or ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: (error as Error).message },
      { status: 500 }
    );
  }
}
