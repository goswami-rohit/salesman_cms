// src/app/api/users/[userId]/route.ts
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define the roles that have admin-level access
const allowedAdminRoles = [
  'president',
  'senior-general-manager',
  'general-manager',
  'regional-sales-manager',
  'area-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
];

const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required.").optional(),
  lastName: z.string().min(1, "Last name is required.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  role: z.string().min(1, "Role is required.").optional(),
  area: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(), // Added phone number
}).strict();

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const claims = await getTokenClaims();

    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    // Check if the user's role is in the list of allowed admin roles
    if (!adminUser || !allowedAdminRoles.includes(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        companyId: adminUser.companyId
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: targetUser });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  // FIX: Match the GET signature by explicitly defining params as a Promise
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    // FIX: Await params and destructure the userId
    const { userId } = await params;
    const targetUserLocalId = parseInt(userId); // Renamed for clarity in local context

    // We expect a string ID (like UUID or CUID)
    if (!targetUserLocalId) {
      return NextResponse.json({ error: 'User ID is missing from path.' }, { status: 400 });
    }

    const claims = await getTokenClaims();

    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Current User for Authorization
    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    // Check if the user's role is in the list of allowed admin roles
    if (!adminUser || !allowedAdminRoles.includes(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Await request.json() early
    const body = await request.json();
    const parsedBody = updateUserSchema.safeParse(body);

    if (!parsedBody.success) {
      // Zod Validation Failure
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsedBody.error.format() },
        { status: 400 }
      );
    }

    // Destructure data for WorkOS and Prisma updates
    const { role, area, region, phoneNumber, ...workosStandardData } = parsedBody.data;

    // 2. Check if the target user exists and belongs to the same company
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserLocalId },
      select: { id: true, companyId: true, workosUserId: true, email: true }
    });

    if (!targetUser || targetUser.companyId !== adminUser.companyId) {
      return NextResponse.json({ error: 'User not found or access denied.' }, { status: 404 });
    }

    // 3. Check for email conflict *only if email is provided and changed*
    if (workosStandardData.email && workosStandardData.email !== targetUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: workosStandardData.email,
          companyId: adminUser.companyId,
          id: { not: targetUserLocalId }
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists for another user in this company' }, { status: 409 });
      }
    }

    // 4. Prepare for Concurrent Updates

    // Data for Prisma (includes all fields)
    const prismaUpdateData: any = {
      ...workosStandardData,
      ...(role !== undefined && { role }),
      ...(area !== undefined && { area }),
      ...(region !== undefined && { region }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      updatedAt: new Date()
    };

    const prismaUpdatePromise = prisma.user.update({
      // Use the local ID (now a string) for the update
      where: { id: targetUserLocalId },
      data: prismaUpdateData
    });

    let workosUpdatePromise;
    let workosUpdateRequired = false;

    // 5. Prepare WorkOS Update Data
    const workosUserUpdateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      customAttributes?: Record<string, string | null>;
    } = { ...workosStandardData };

    const customAttributes: Record<string, string | null> = {};

    // Custom attributes: role, area, region, phoneNumber
    if (role !== undefined) {
      customAttributes.role = role;
      workosUpdateRequired = true;
    }
    if (area !== undefined) {
      customAttributes.area = area;
      workosUpdateRequired = true;
    }
    if (region !== undefined) {
      customAttributes.region = region;
      workosUpdateRequired = true;
    }
    if (phoneNumber !== undefined) {
      customAttributes.phoneNumber = phoneNumber;
      workosUpdateRequired = true;
    }

    // Check if any standard fields (firstName, lastName, email) were provided
    if (Object.keys(workosStandardData).length > 0) {
      workosUpdateRequired = true;
    }

    if (Object.keys(customAttributes).length > 0) {
      workosUserUpdateData.customAttributes = customAttributes;
    }

    // Only proceed with WorkOS update if changes were detected and we have a workosUserId (which is always a string)
    if (workosUpdateRequired && targetUser.workosUserId) {
      workosUpdatePromise = workos.userManagement.updateUser({
        userId: targetUser.workosUserId, // This ID is already a string, as required by WorkOS
        ...workosUserUpdateData,
      });
    } else if (workosUpdateRequired && !targetUser.workosUserId) {
      console.warn(`User ID ${targetUserLocalId} has data changes but is missing WorkOS ID. Skipping WorkOS update.`);
    }

    // Execute both updates concurrently if a WorkOS update is needed
    await Promise.all([
      prismaUpdatePromise,
      workosUpdatePromise
    ].filter(Boolean));

    return NextResponse.json({
      message: 'User updated successfully',
      user: await prismaUpdatePromise // Return the newly updated user object
    });
  } catch (error: any) {
    console.error('Error updating user:', error);

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    // Note: P2025 is typically for records not found during an update/delete
    if (error.code === 'P2025' || error.name === 'PrismaClientKnownRequestError') {
      // Provide a more generic 404/400 for errors related to ID existence
      return NextResponse.json({ error: 'User not found or database conflict.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // workos uder deletion happens in api/delete-user/route.ts 
  try {
    const { userId } = await params;

    const claims = await getTokenClaims();

    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    // Check if the user's role is in the list of allowed admin roles
    if (!adminUser || !allowedAdminRoles.includes(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    const targetUserId = parseInt(userId);
    if (targetUserId === adminUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists and belongs to same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        companyId: adminUser.companyId
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: {
        id: targetUserId
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
