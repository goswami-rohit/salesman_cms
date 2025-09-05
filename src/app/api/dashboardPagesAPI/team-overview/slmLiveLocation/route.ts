// /api/dashboardPagesAPI/team-overview/slmLiveLocation/route.ts
import { NextResponse } from "next/server";
import { getTokenClaims } from "@workos-inc/authkit-nextjs";
import prisma from "@/lib/prisma";
import axios from "axios";
import { z } from "zod";

// Zod schema for one live location
const liveLocationSchema = z.object({
  userId: z.string(), // 👈 Radar externalId (salesman_login_id)
  salesmanName: z.string(),
  employeeId: z.string().nullable(),
  role: z.string(),
  region: z.string().nullable(),
  area: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(),
  isActive: z.boolean(),
  accuracy: z.number().nullable(),
  speed: z.number().nullable(),
  heading: z.number().nullable(),
  altitude: z.number().nullable(),
  batteryLevel: z.number().nullable(),
});

const allowedRoles = [
  "senior-manager",
  "manager",
  "assistant-manager",
  "senior-executive",
  "executive",
];

export async function GET() {
  try {
    const claims = await getTokenClaims();

    // Auth check
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
    });

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view live locations." },
        { status: 403 }
      );
    }

    // 1. Get all ACTIVE users in same company
    const activeUsers = await prisma.user.findMany({
      where: { companyId: currentUser.companyId, status: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        region: true,
        area: true,
        salesmanLoginId: true,
      },
    });

    const externalIds = activeUsers.map((u) => u.salesmanLoginId).filter(Boolean);
    if (externalIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 2. Call Radar directly (bulk list trips by externalId)
    const res = await axios.get("https://api.radar.io/v1/trips", {
      headers: { Authorization: process.env.RADAR_SECRET_KEY! }, // secrect key here
      params: {
        externalId: externalIds.join(","),
        includeLocations: true,
      },
    });

    const trips = res.data.trips || [];

    // 3. Normalize against your DB users
    const mapped = trips
      .filter((t: any) => t.user && t.user.lastLocation)
      .map((t: any) => {
        const user = activeUsers.find((u) => u.salesmanLoginId === t.externalId);
        if (!user) return null;

        const loc = t.user.lastLocation;
        return {
          userId: user.id,
          salesmanName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A",
          employeeId: user.salesmanLoginId,
          role: user.role,
          region: user.region,
          area: user.area,
          latitude: loc.coordinates[1],
          longitude: loc.coordinates[0],
          recordedAt: loc.createdAt,
          isActive: true,
          accuracy: loc.accuracy ?? null,
          speed: loc.speed ?? null,
          heading: loc.heading ?? null,
          altitude: loc.altitude ?? null,
          batteryLevel: loc.battery?.level ?? null,
        };
      })
      .filter(Boolean);

    const validated = z.array(liveLocationSchema).parse(mapped);

    return NextResponse.json(validated, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching live locations from Radar:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch live locations" }, { status: 500 });
  }
}
