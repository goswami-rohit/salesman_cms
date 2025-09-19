import { NextResponse } from "next/server";
import { getTokenClaims } from "@workos-inc/authkit-nextjs";
import prisma from "@/lib/prisma";
import axios from "axios";
import { z } from "zod";

// Zod schema for one live location
const liveLocationSchema = z.object({
  userId: z.string(), // 👈 Radar externalId = id in users table
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

    // 1. Get all active permanent journey plans for the current company
    const activePlans = await prisma.permanentJourneyPlan.findMany({
      where: {
        // Filter by the user's company who is assigned to the plan
        user: { 
          companyId: currentUser.companyId,
        },
        // We'll assume the 'status' field exists and can be 'active'
        status: "active",
      },
      include: {
        user: { 
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            salesmanLoginId: true,
            region: true, // Assuming these fields are on the User model
            area: true,   // Assuming these fields are on the User model
          },
        },
      },
    });

    // Extract the user IDs from the active plans
    const activeSalesmen = activePlans.map(plan => plan.user);
    const salesmanIds = activeSalesmen.map(s => String(s.id));

    if (salesmanIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // --- NEW RADAR LIVE TRACKING API CALL ---
    // 2. Fetch ALL live locations from Radar for the specified user IDs
    const res = await axios.get("https://api.radar.io/v1/live", {
      headers: { Authorization: process.env.RADAR_SECRET_KEY!.trim() },
      params: {
        userIds: salesmanIds.join(','),
      },
    });

    const liveLocations = res.data.locations || [];
    console.log("Fetched live locations from Radar:", liveLocations);

    // 3. Normalize and filter the live locations against your DB users
    const mapped = liveLocations
      .map((loc: any) => {
        // Find the user in YOUR database that matches the user in the Radar live data
        const user = activeSalesmen.find((u) => String(u.id) === loc.userId);

        // If the location doesn't belong to a salesman in an active plan, skip it
        if (!user) return null;

        if (!loc.location?.coordinates) return null;

        return {
          userId: String(user.id),
          salesmanName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A",
          employeeId: user.salesmanLoginId,
          role: user.role,
          region: user.region,
          area: user.area,
          latitude: loc.location.coordinates[1],
          longitude: loc.location.coordinates[0],
          recordedAt: loc.location.recordedAt, // Use the timestamp from the Radar location object
          isActive: true,
          accuracy: loc.location.accuracy ?? null,
          speed: loc.location.speed ?? null,
          heading: loc.location.heading ?? null,
          altitude: loc.location.altitude ?? null,
          batteryLevel: loc.location.batteryLevel ?? null,
        };
      })
      .filter(Boolean); // Remove any null entries

    //console.log("Mapped live locations before validation:", mapped);

    const validated = z.array(liveLocationSchema).parse(mapped);
    //console.log("Validated live locations to return:", validated);

    return NextResponse.json(validated, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching live locations from Radar:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch live locations" }, { status: 500 });
  }
}
