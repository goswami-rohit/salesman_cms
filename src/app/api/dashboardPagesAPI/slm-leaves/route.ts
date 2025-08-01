// src/app/api/dashboardPagesAPI/salesman-leaves/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

const prisma = new PrismaClient();

// Zod schema for validating PATCH request body
const updateLeaveApplicationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Approved", "Rejected"]),
  adminRemarks: z.string().nullable().optional(),
});

// GET /api/dashboardPagesAPI/salesman-leaves?format=csv&ids=...
export async function GET(request: NextRequest) {
  try {
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const ids = searchParams.get('ids')?.split(',');
    
    const leaveApplications = await prisma.salesmanLeaveApplication.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        user: { 
          company: { 
            workosOrganizationId: claims.org_id as string,
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedApplications = leaveApplications.map(app => {
      const salesmanName = [app.user?.firstName, app.user?.lastName]
        .filter(Boolean)
        .join(' ') || 'N/A';

      return {
        id: app.id,
        salesmanName: salesmanName,
        leaveType: app.leaveType,
        startDate: app.startDate.toISOString().split('T')[0],
        endDate: app.endDate.toISOString().split('T')[0],
        reason: app.reason,
        status: app.status,
        adminRemarks: app.adminRemarks,
      };
    });

    if (format === 'csv') {
      const headers = [
        "ID", "Salesman Name", "Leave Type", "Start Date", "End Date",
        "Reason", "Status", "Admin Remarks"
      ];
      const dataForCsv = [
        headers,
        ...formattedApplications.map(app => [
          app.id,
          app.salesmanName,
          app.leaveType,
          app.startDate,
          app.endDate,
          app.reason,
          app.status,
          app.adminRemarks
        ])
      ];

      const filename = `salesman-leaves-${Date.now()}.csv`;
      return generateAndStreamCsv(dataForCsv, filename);
    }

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching salesman leave applications:', error);
    return NextResponse.json({ message: 'Failed to fetch leave applications', error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/dashboardPagesAPI/salesman-leaves
export async function PATCH(req: NextRequest) {
  try {
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const body = await req.json();
    const parsedBody = updateLeaveApplicationSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { id, status, adminRemarks } = parsedBody.data;

    const existingApplication = await prisma.salesmanLeaveApplication.findFirst({
        where: {
            id: id,
            user: {
                company: {
                    workosOrganizationId: claims.org_id as string,
                }
            },
        },
        include: {
            user: true,
        },
    });

    if (!existingApplication) {
        return new NextResponse('Unauthorized: Leave application not found or does not belong to your organization.', { status: 403 });
    }

    const updateData: { status: "Approved" | "Rejected"; adminRemarks?: string | null; updatedAt: Date } = {
      status: status,
      updatedAt: new Date(),
    };

    if (adminRemarks !== undefined) {
      updateData.adminRemarks = adminRemarks;
    }

    const updatedApplication = await prisma.salesmanLeaveApplication.update({
      where: { id: id },
      data: updateData,
      include: {
        user: true,
      },
    });

    const salesmanName = [updatedApplication.user?.firstName, updatedApplication.user?.lastName]
      .filter(Boolean)
      .join(' ') || 'N/A';

    const formattedUpdatedApplication = {
      id: updatedApplication.id,
      salesmanName: salesmanName,
      leaveType: updatedApplication.leaveType,
      startDate: updatedApplication.startDate.toISOString().split('T')[0],
      endDate: updatedApplication.endDate.toISOString().split('T')[0],
      reason: updatedApplication.reason,
      status: updatedApplication.status,
      adminRemarks: updatedApplication.adminRemarks,
    };

    return NextResponse.json(formattedUpdatedApplication);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Leave application not found.' }, { status: 404 });
    }
    console.error('Error updating salesman leave application:', error);
    return NextResponse.json({ message: 'Failed to update leave application', error: error.message }, { status: 500 });
  }
}