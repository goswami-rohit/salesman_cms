// src/app/api/dashboardPagesAPI/reports/technical-visit-reports/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Use shared prisma instance
import { z } from 'zod'; // Import Zod
import { technicalVisitReportSchema } from '@/lib/shared-zod-schema';

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive','executive',];

// GET /api/dashboardPagesAPI/technical-reports
// Fetches all technical visit reports from the database
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
      select: { id: true, role: true, companyId: true } // Optimized selection
    });

    // --- UPDATED ROLE-BASED AUTHORIZATION ---
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can view technical reports: ${allowedRoles.join(', ')}` }, { status: 403 });
    }

    const technicalReports = await prisma.technicalVisitReport.findMany({
      where: {
        user: { // Access the User relation
          companyId: currentUser.companyId, // Filter by the admin/manager's company
        },
      },
      include: {
        // --- CORRECTED PRISMA QUERY: Use `select` within `include` to fetch specific user fields ---
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true, // Now we are correctly selecting the user's role
            email: true,
            area: true,
            region: true,
          },
        },
      },
      orderBy: {
        reportDate: 'desc', // Order the results by report date in descending order
      },
    });

    // Format the data to match the frontend's expected TechnicalVisitReport structure
    const formattedReports = technicalReports.map((report:any) => {
      // Construct salesmanName from user's firstName and lastName, handling potential nulls
      const salesmanName = [report.user?.firstName, report.user?.lastName]
        .filter(Boolean) // Filters out any null or undefined parts
        .join(' ') || 'N/A'; // Joins remaining parts with a space, defaults to 'N/A' if empty

      return {
        id: report.id,
        salesmanName: salesmanName,
        role: report.user.role,
        area: report.user.area,
        region: report.user.region,
        visitType: report.visitType,
        siteNameConcernedPerson: report.siteNameConcernedPerson,
        phoneNo: report.phoneNo,
        date: report.reportDate.toISOString().split('T')[0] || '',
        emailId: report.emailId || '',
        clientsRemarks: report.clientsRemarks,
        salespersonRemarks: report.salespersonRemarks,
        checkInTime: report.checkInTime.toISOString() || '',
        checkOutTime: report.checkOutTime?.toISOString() || '',
        
        // Mapped optional fields that can be null
        inTimeImageUrl: report.inTimeImageUrl,
        outTimeImageUrl: report.outTimeImageUrl,
        siteVisitType: report.siteVisitType, // Maps to String | null
        dhalaiVerificationCode: report.dhalaiVerificationCode, // Maps to String | null
        isVerificationStatus: report.isVerificationStatus, // Maps to String | null
        meetingId: report.meetingId, // Maps to String | null
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),

        // Array fields (should be empty array [] if no data, not null)
        siteVisitBrandInUse: report.siteVisitBrandInUse,
        influencerType: report.influencerType,

        // Optional string fields formatted to '' if null (match the non-nullable z.string() in Zod)
        siteVisitStage: report.siteVisitStage || '',
        conversionFromBrand: report.conversionFromBrand || '',
        conversionQuantityUnit: report.conversionQuantityUnit || '',
        associatedPartyName: report.associatedPartyName || '',
        serviceType: report.serviceType || '',
        qualityComplaint: report.qualityComplaint || '',
        promotionalActivity: report.promotionalActivity || '',
        channelPartnerVisit: report.channelPartnerVisit || '',

        // Decimal field conversion to number or null
        conversionQuantityValue: report.conversionQuantityValue ? parseFloat(report.conversionQuantityValue.toString()) : null,

        timeSpentinLoc: report.timeSpentinLoc || null,
        purposeOfVisit: report.purposeOfVisit || null,
        sitePhotoUrl: report.sitePhotoUrl || null,
        firstVisitTime: report.firstVisitTime?.toISOString() || null,
        lastVisitTime: report.lastVisitTime?.toISOString() || null,
        firstVisitDay: report.firstVisitDay || null,
        lastVisitDay: report.lastVisitDay || null,
        siteVisitsCount: report.siteVisitsCount || null,
        otherVisitsCount: report.otherVisitsCount || null,
        totalVisitsCount: report.totalVisitsCount || null,
        latitude: report.latitude ? parseFloat(report.latitude.toString()) : null,
        longitude: report.longitude ? parseFloat(report.longitude.toString()) : null,
        pjpId: report.pjpId || null,
        masonId: report.masonId || null,
      };
    });

    // 6. Validate response array with Zod
    const validated = z.array(technicalVisitReportSchema).parse(formattedReports);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Error fetching technical visit reports:', error);
    // Return a 500 status with an error message in case of failure
    return NextResponse.json({ message: 'Failed to fetch technical visit reports', error: (error as Error).message }, { status: 500 });
  } 
  // Removed finally block for consistency with Next.js pattern
}
