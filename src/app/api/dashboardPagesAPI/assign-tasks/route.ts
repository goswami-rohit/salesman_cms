// src/app/api/dashboardPagesAPI/assign-tasks/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod';

// Zod schema for validating the POST request body when assigning tasks
const assignTaskSchema = z.object({
  salesmanUserIds: z.array(z.number().int()).min(1, "At least one salesman must be selected."),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Task date must be in YYYY-MM-DD format."),
  visitType: z.enum(["Client Visit", "Technical Visit"], {
     error: "Visit type must be 'Client Visit' or 'Technical Visit'." 
  }),
  relatedDealerId: z.string().uuid().optional().nullable(), // Only for Client Visit
  siteName: z.string().min(1, "Site name is required for Technical Visit.").optional().nullable(), // Only for Technical Visit
  description: z.string().optional().nullable(),
});

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
      include: { company: true }
    });

    // 3. Role-based Authorization: Only 'admin' or 'manager' can access this
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
    }

    // 4. Fetch Salesmen (Users with role 'staff') within the same company
    const salesmen = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        role: 'staff', // Assuming 'staff' role for salesmen
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        salesmanLoginId: true, // Include employee ID
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    // 5. Fetch Dealers within the same company
    const dealers = await prisma.dealer.findMany({
      where: {
        user: { // Filter dealers by the company of the user who created them (assuming this link)
          companyId: currentUser.companyId,
        },
      },
      select: {
        id: true,
        name: true,
        type: true, // "Dealer" or "Sub Dealer"
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ salesmen, dealers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data for assign tasks form:', error);
    return NextResponse.json({ error: 'Failed to fetch form data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const claims = await getTokenClaims();

    // 1. Authentication Check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to get the assignedByUserId
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true }
    });

    // 3. Role-based Authorization: Only 'admin' or 'manager' can assign tasks
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden: Only admins or managers can assign tasks' }, { status: 403 });
    }

    const body = await request.json();
    const parsedBody = assignTaskSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsedBody.error.format() }, { status: 400 });
    }

    const { salesmanUserIds, taskDate, visitType, relatedDealerId, siteName, description } = parsedBody.data;

    // Additional validation based on visitType
    if (visitType === "Client Visit" && !relatedDealerId) {
      return NextResponse.json({ message: 'relatedDealerId is required for Client Visit.' }, { status: 400 });
    }
    if (visitType === "Technical Visit" && !siteName) {
      return NextResponse.json({ message: 'siteName is required for Technical Visit.' }, { status: 400 });
    }
    // Ensure relatedDealerId and siteName are mutually exclusive for clarity
    if (visitType === "Client Visit" && siteName) {
      return NextResponse.json({ message: 'Site name should not be provided for Client Visit.' }, { status: 400 });
    }
    if (visitType === "Technical Visit" && relatedDealerId) {
      return NextResponse.json({ message: 'Related dealer should not be provided for Technical Visit.' }, { status: 400 });
    }


    // Convert taskDate string to Date object
    const parsedTaskDate = new Date(taskDate);
    // Set to start of day to avoid timezone issues with @db.Date in Prisma
    parsedTaskDate.setUTCHours(0, 0, 0, 0);


    // Create tasks in a transaction for atomicity
    const createdTasks = await prisma.$transaction(
      salesmanUserIds.map(userId =>
        prisma.dailyTask.create({
          data: {
            userId: userId,
            assignedByUserId: currentUser.id, // The admin/manager creating the task
            taskDate: parsedTaskDate,
            visitType: visitType,
            relatedDealerId: visitType === "Client Visit" ? relatedDealerId : null,
            siteName: visitType === "Technical Visit" ? siteName : null,
            description: description,
            status: "Assigned", // Default status
          },
        })
      )
    );

    return NextResponse.json({ message: 'Tasks assigned successfully!', tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error('Error assigning tasks:', error);
    return NextResponse.json({ error: 'Failed to assign tasks', details: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}