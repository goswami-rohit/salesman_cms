// src/app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';

// GET - Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> } // Made params async
) {
  try {
    const { userId } = await params; // Await params first
    
    const claims = await getTokenClaims();
    
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { 
        id: parseInt(userId), // Use awaited userId
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
  request: Request,
  { params }: { params: Promise<{ userId: string }> } // Made params async
) {
  try {
    const { userId } = await params; // Await params first
    
    const claims = await getTokenClaims();
    
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, role, email, phoneNumber } = body;

    // Check if email already exists for another user in the same company
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        companyId: adminUser.companyId,
        id: { not: parseInt(userId) } // Use awaited userId
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists for another user' }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { 
        id: parseInt(userId), // Use awaited userId
        companyId: adminUser.companyId 
      },
      data: {
        firstName,
        lastName,
        role,
        email,
        phoneNumber,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> } // Made params async
) {
  try {
    const { userId } = await params; // Await params first
    
    const claims = await getTokenClaims();
    
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    const targetUserId = parseInt(userId); // Use awaited userId
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