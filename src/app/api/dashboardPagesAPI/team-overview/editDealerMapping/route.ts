// src/app/api/dashboardPagesAPI/team-overview/editDealerMapping/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getTokenClaims } from "@workos-inc/authkit-nextjs";
import prisma from "@/lib/prisma";
//import { Prisma } from "@prisma/client";
import { z } from "zod";

const allowedAdminRoles = [
    "president",
    "senior-general-manager",
    "general-manager",
    "regional-sales-manager",
    "area-sales-manager",
    "senior-manager",
    "manager",
    "assistant-manager",
    "senior-executive",
];

const editDealerSchema = z.object({
    userId: z.number(),
    dealerIds: z.array(z.string()).optional().default([]),
    // ⚠️ dealer.id is String (uuid) in your schema
});

// ================= GET =================
// Fetch all dealers + assigned dealers for a given user
export async function GET(request: NextRequest) {
  try {
    const claims = await getTokenClaims();
    if (!claims?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch current user (to get companyId & role)
    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true },
    });

    if (!currentUser || !allowedAdminRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userIdParam = request.nextUrl.searchParams.get("userId");
    const targetUserId = userIdParam ? parseInt(userIdParam, 10) : null;

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Step 1: Get all users of this company
    const companyUsers = await prisma.user.findMany({
      where: { companyId: currentUser.companyId },
      select: { id: true },
    });
    const companyUserIds = companyUsers.map((u) => u.id);

    // Step 2: Get all dealers belonging to those users OR unassigned (userId = null)
    const dealers = await prisma.dealer.findMany({
      where: {
        OR: [ 
          { userId: { in: companyUserIds } },
          { userId: {equals:null} },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Step 3: Get currently assigned dealers for this salesman
    const assignedDealers = await prisma.dealer.findMany({
      where: { userId: targetUserId },
      select: { id: true },
    });

    return NextResponse.json({
      dealers,
      assignedDealerIds: assignedDealers.map((d) => d.id),
    });
  } catch (err) {
    console.error("Dealer mapping fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================= POST =================
// Save dealer mapping for a user
export async function POST(request: NextRequest) {
    try {
        const claims = await getTokenClaims();
        const currentUserRole = claims?.role as string;

        if (!claims?.sub || !allowedAdminRoles.includes(currentUserRole)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = editDealerSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { userId, dealerIds } = validated.data;

        // Unassign all dealers from this user
        await prisma.dealer.updateMany({
            where: { userId },
            data: { userId: null },
        });

        // Assign selected dealers to this user
        if (dealerIds.length > 0) {
            await prisma.dealer.updateMany({
                where: { id: { in: dealerIds } },
                data: { userId },
            });
        }

        // Return updated user with dealers
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { dealers: true },
        });

        return NextResponse.json(
            { message: "Dealer mapping updated", user: updatedUser },
            { status: 200 }
        );
    } catch (err) {
        console.error("Dealer mapping POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
