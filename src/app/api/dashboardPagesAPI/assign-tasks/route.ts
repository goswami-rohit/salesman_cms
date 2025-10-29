// src/app/api/dashboardPagesAPI/assign-tasks/route.ts
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for validating the POST request body when assigning tasks
export const assignTaskSchema = z.object({
  salesmanUserIds: z.array(z.number().int()).min(1, "At least one salesman must be selected."),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Task date must be in YYYY-MM-DD format."),
  visitType: z.string(),
  relatedDealerIds: z.array(z.string().uuid()).optional().nullable(), // ✅ accept multiple dealers
  siteName: z.string().min(1, "Site name is required for Technical Visit.").optional().nullable(),
  description: z.string().optional().nullable(),
});

// Zod schema for the GET response for daily tasks - DEFINED HERE
export const dailyTaskSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  assignedByUserName: z.string(),
  taskDate: z.string(), // YYYY-MM-DD
  visitType: z.string(),
  relatedDealerName: z.string().nullable().optional(), // For Client Visit
  siteName: z.string().nullable().optional(), // For Technical Visit
  description: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.string(),
});

// Roles allowed to assign tasks
const allowedAssignerRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',];

// Roles that can be assigned tasks by a manager
const allowedAssigneeRoles = [
  'senior-executive',
  'junior-executive',
  'executive',
];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // 1. Authentication Check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Current User to check role, companyId, area, and region
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: {
        id: true,
        role: true,
        companyId: true,
        area: true,
        region: true,
        company: true, // Select the entire company object here
      },
    });

    // 3. Role-based Authorization: Check if user's role is in the allowedAssignerRoles array
    if (!currentUser || !allowedAssignerRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can assign tasks: ${allowedAssignerRoles.join(', ')}` }, { status: 403 });
    }

    // 4. Fetch the users that can be assigned tasks (junior/executives) within the same company
    // and matching the assigner's area and region.
    const assignableSalesmen = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        role: { in: allowedAssigneeRoles }, // Only junior-executive and executive roles
        // Filter by the current user's area and region if they exist
        ...(currentUser.area && { area: currentUser.area }),
        ...(currentUser.region && { region: currentUser.region }),
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

    // 6. Fetch Daily Tasks for the current user's company and area/region
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        user: { // Filter tasks by the company and the user's area/region
          companyId: currentUser.companyId,
          ...(currentUser.area && { area: currentUser.area }),
          ...(currentUser.region && { region: currentUser.region }),
        },
      },
      include: {
        user: { // Salesman assigned
          select: { firstName: true, lastName: true, email: true },
        },
        assignedBy: { // Admin/Manager who assigned
          select: { firstName: true, lastName: true, email: true },
        },
        relatedDealer: { // Related dealer for Client Visits
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by latest assigned tasks
      },
      take: 200, // Limit for dashboard view
    });

    // 7. Format the tasks data for the frontend table display
    const formattedTasks = dailyTasks.map(task => {
      const salesmanName = `${task.user.firstName || ''} ${task.user.lastName || ''}`.trim() || task.user.email;
      const assignedByUserName = `${task.assignedBy.firstName || ''} ${task.assignedBy.lastName || ''}`.trim() || task.assignedBy.email;

      return {
        id: task.id,
        salesmanName: salesmanName,
        assignedByUserName: assignedByUserName,
        taskDate: task.taskDate.toISOString().split('T')[0], // YYYY-MM-DD
        visitType: task.visitType,
        relatedDealerName: task.relatedDealer?.name || null,
        siteName: task.siteName || null,
        description: task.description,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
      };
    });

    // Validate formatted tasks against the schema
    const validatedTasks = z.array(dailyTaskSchema).parse(formattedTasks);

    return NextResponse.json({ salesmen: assignableSalesmen, dealers, tasks: validatedTasks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data for assign tasks form/table:', error);
    return NextResponse.json({ error: 'Failed to fetch form data or tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true, area: true, region: true }
    });

    if (!currentUser || !allowedAssignerRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: `Forbidden: Only the following roles can assign tasks: ${allowedAssignerRoles.join(', ')}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsedBody = assignTaskSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { salesmanUserIds, taskDate, visitType, relatedDealerIds, siteName, description } = parsedBody.data;

    // Extra validation
    if (visitType === "Client Visit" && (!relatedDealerIds || relatedDealerIds.length === 0)) {
      return NextResponse.json({ message: 'At least one relatedDealerId is required for Client Visit.' }, { status: 400 });
    }
    if (visitType === "Technical Visit" && !siteName) {
      return NextResponse.json({ message: 'siteName is required for Technical Visit.' }, { status: 400 });
    }
    if (visitType === "Client Visit" && siteName) {
      return NextResponse.json({ message: 'Site name should not be provided for Client Visit.' }, { status: 400 });
    }
    if (visitType === "Technical Visit" && relatedDealerIds && relatedDealerIds.length > 0) {
      return NextResponse.json({ message: 'Related dealers should not be provided for Technical Visit.' }, { status: 400 });
    }

    // Validate salesman IDs
    const assignedUsers = await prisma.user.findMany({
      where: {
        id: { in: salesmanUserIds },
        role: { in: allowedAssigneeRoles },
        companyId: currentUser.companyId,
        ...(currentUser.area && { area: currentUser.area }),
        ...(currentUser.region && { region: currentUser.region }),
      },
      select: { id: true },
    });

    if (assignedUsers.length !== salesmanUserIds.length) {
      const assignedUserIdsSet = new Set(assignedUsers.map(u => u.id));
      const invalidUserIds = salesmanUserIds.filter(id => !assignedUserIdsSet.has(id));
      return NextResponse.json(
        { error: `Forbidden: Invalid user IDs: ${invalidUserIds.join(', ')}` },
        { status: 403 }
      );
    }

    const parsedTaskDate = new Date(taskDate);
    parsedTaskDate.setUTCHours(0, 0, 0, 0);

    // Create tasks for each salesman × dealer (or single tech visit)
    const createdTasks = await prisma.$transaction(
      salesmanUserIds.flatMap(userId =>
        (visitType === "Client Visit"
          ? relatedDealerIds!.map(dealerId =>
              prisma.dailyTask.create({
                data: {
                  userId,
                  assignedByUserId: currentUser.id,
                  taskDate: parsedTaskDate,
                  visitType,
                  relatedDealerId: dealerId,
                  siteName: null,
                  description,
                  status: "Assigned",
                },
              })
            )
          : [
              prisma.dailyTask.create({
                data: {
                  userId,
                  assignedByUserId: currentUser.id,
                  taskDate: parsedTaskDate,
                  visitType,
                  relatedDealerId: null,
                  siteName,
                  description,
                  status: "Assigned",
                },
              }),
            ])
      )
    );

    return NextResponse.json({ message: 'Tasks assigned successfully!', tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error('Error assigning tasks:', error);
    return NextResponse.json({ error: 'Failed to assign tasks', details: (error as Error).message }, { status: 500 });
  }
}
