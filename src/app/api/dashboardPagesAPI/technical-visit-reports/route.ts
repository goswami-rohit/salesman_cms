// src/app/api/dashboardPagesAPI/technical-visit-reports/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/dashboardPagesAPI/technical-reports
// Fetches all technical visit reports from the database
export async function GET() {
  try {
    const technicalReports = await prisma.technicalVisitReport.findMany({
      include: {
        user: true, // Include the associated User record to get salesman details
      },
      orderBy: {
        reportDate: 'desc', // Order the results by report date in descending order
      },
    });

    // Format the data to match the frontend's expected TechnicalVisitReport structure
    const formattedReports = technicalReports.map(report => {
      // Construct salesmanName from user's firstName and lastName, handling potential nulls
      const salesmanName = [report.user?.firstName, report.user?.lastName]
        .filter(Boolean) // Filters out any null or undefined parts
        .join(' ') || 'N/A'; // Joins remaining parts with a space, defaults to 'N/A' if empty

      return {
        id: report.id,
        salesmanName: salesmanName,
        visitType: report.visitType,
        siteNameConcernedPerson: report.siteNameConcernedPerson,
        phoneNo: report.phoneNo,
        date: report.reportDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD
        emailId: report.emailId || '', // Ensure emailId is a string, default to empty
        clientsRemarks: report.clientsRemarks,
        salespersonRemarks: report.salespersonRemarks,
        checkInTime: report.checkInTime.toISOString(), // Keep as ISO string for full timestamp
        checkOutTime: report.checkOutTime?.toISOString() || '', // Optional checkout time
      };
    });

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error('Error fetching technical visit reports:', error);
    // Return a 500 status with an error message in case of failure
    return NextResponse.json({ message: 'Failed to fetch technical visit reports', error: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client to prevent connection leaks
  }
}