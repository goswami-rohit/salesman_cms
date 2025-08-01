// src/app/api/dashboardPagesAPI/salesman-leaves/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod'; // Ensure zod is imported

const prisma = new PrismaClient();

// Zod schema for validating PATCH request body
const updateLeaveApplicationSchema = z.object({
  id: z.string().uuid(), // Ensure it's a valid UUID for the leave application
  status: z.enum(["Approved", "Rejected"]), // Status must be one of these two
  adminRemarks: z.string().nullable().optional(), // Can be string, null, or undefined (if not sent)
});

// GET /api/dashboardPagesAPI/salesman-leaves
// Fetches all salesman leave applications from the database
export async function GET() {
  try {
    const leaveApplications = await prisma.salesmanLeaveApplication.findMany({
      include: {
        user: true, // Include the associated User record to get salesman details
      },
      orderBy: {
        createdAt: 'desc', // Order the results by creation date in descending order
      },
    });

    // Format the data to match the frontend's expected structure
    const formattedApplications = leaveApplications.map(app => {
      // Construct salesmanName from user's firstName and lastName, handling potential nulls
      const salesmanName = [app.user?.firstName, app.user?.lastName]
        .filter(Boolean) // Filters out any null or undefined parts
        .join(' ') || 'N/A'; // Joins remaining parts with a space, defaults to 'N/A' if empty

      return {
        id: app.id,
        salesmanName: salesmanName,
        leaveType: app.leaveType,
        startDate: app.startDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD
        endDate: app.endDate.toISOString().split('T')[0],     // Format date to YYYY-MM-DD
        reason: app.reason,
        status: app.status,
        adminRemarks: app.adminRemarks,
      };
    });

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching salesman leave applications:', error);
    // Return a 500 status with an error message in case of failure
    return NextResponse.json({ message: 'Failed to fetch leave applications', error: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client to prevent connection leaks
  }
}

// PATCH /api/dashboardPagesAPI/salesman-leaves
// Updates the status and remarks of a salesman leave application
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedBody = updateLeaveApplicationSchema.safeParse(body); // Validate request body with Zod

    if (!parsedBody.success) {
      // If validation fails, return 400 with detailed errors
      // Accessing parsedBody.error.errors directly, which is the standard Zod error structure
      return NextResponse.json({ message: 'Invalid request body', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { id, status, adminRemarks } = parsedBody.data; // Destructure validated data

    // Construct the data object for Prisma update operation
    // Define an explicit type to ensure correctness for conditional properties
    const updateData: { status: "Approved" | "Rejected"; adminRemarks?: string | null; updatedAt: Date } = {
      status: status,
      updatedAt: new Date(), // Set updated timestamp
    };

    // Conditionally add adminRemarks to updateData.
    // If adminRemarks is undefined (not sent in request), it won't be in updateData,
    // and Prisma will not modify the admin_remarks field in the database.
    // If adminRemarks is null or a string, it will be included and updated.
    if (adminRemarks !== undefined) {
      updateData.adminRemarks = adminRemarks;
    }

    // Update the leave application in the database
    const updatedApplication = await prisma.salesmanLeaveApplication.update({
      where: { id: id }, // Find the record by ID
      data: updateData,  // Apply the constructed update data
      include: {
        user: true, // Include user to return formatted data
      },
    });

    // Format the updated record to match the frontend schema
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

    return NextResponse.json(formattedUpdatedApplication); // Return the formatted updated record
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ message: 'Leave application not found.' }, { status: 404 });
    }
    console.error('Error updating salesman leave application:', error);
    // Return a 500 status with a generic error message
    return NextResponse.json({ message: 'Failed to update leave application', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
}