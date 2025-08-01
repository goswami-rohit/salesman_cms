// src/app/api/dashboardPagesAPI/dealer-reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication and Authorization Checks
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true }
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering and formatting
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(','); // Optional array of IDs to filter by

    // 3. Fetch all Dealers for the current user's company
    const dealersAndSubDealers = await prisma.dealer.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: {
          companyId: currentUser.companyId,
        },
      },
      include: {
        user: { // Include salesman details to get their name
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by latest entries first
      },
      // Apply a limit only for the standard JSON response, not for downloads
      ...(!format && { take: 200 }),
    });

    // 4. Map the data to match the frontend's DealerReport schema and prepare for CSV
    const formattedReports = dealersAndSubDealers.map(report => ({
      id: report.id,
      salesmanName: `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim() || report.user.email,
      type: report.type, // "Dealer" or "Sub Dealer"
      dealerName: report.type === 'Dealer' ? report.name : null,
      subDealerName: report.type === 'Sub Dealer' ? report.name : null,
      region: report.region,
      area: report.area,
      phoneNo: report.phoneNo,
      address: report.address,
      dealerTotalPotential: report.totalPotential?.toNumber() || null, // Convert Decimal to Number
      dealerBestPotential: report.bestPotential?.toNumber() || null,   // Convert Decimal to Number
      brandSelling: report.brandSelling,
      feedbacks: report.feedbacks,
      remarks: report.remarks,
    }));

    // 5. Handle download requests based on the 'format' query parameter
    if (format) {
      switch (format) {
        case 'csv': {
          const headers = [
            "ID", "Salesman Name", "Type", "Dealer Name", "Sub Dealer Name",
            "Region", "Area", "Phone No", "Address", "Total Potential",
            "Best Potential", "Brand Selling", "Feedbacks", "Remarks"
          ];
          const dataForCsv = [
            headers,
            ...formattedReports.map(report => [
              report.id,
              report.salesmanName,
              report.type,
              report.dealerName,
              report.subDealerName,
              report.region,
              report.area,
              report.phoneNo,
              report.address,
              report.dealerTotalPotential,
              report.dealerBestPotential,
              report.brandSelling,
              report.feedbacks,
              report.remarks,
            ])
          ];
          const filename = `dealer-reports-${Date.now()}.csv`;
          return generateAndStreamCsv(dataForCsv, filename);
        }
        case 'xlsx': {
          return NextResponse.json({ message: 'XLSX format is not yet supported.' }, { status: 501 });
        }
        default: {
          return NextResponse.json({ message: 'Invalid format specified.' }, { status: 400 });
        }
      }
    }

    // 6. Default behavior: return JSON data for the client-side table
    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Error fetching dealer reports:', error);
    return NextResponse.json({ error: 'Failed to fetch dealer reports' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
