// /api/dashboardPagesAPI/team-overview/slmLiveLocation/route.ts
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

    // 1. Get all active users from your DB for the current company
    const activeUsers = await prisma.user.findMany({
      where: {
        companyId: currentUser.companyId,
        status: "active",
      },
      select: { id: true, 
        firstName: true, lastName: true, role: true, 
        region: true, area: true, 
        salesmanLoginId: true },
    });
    //console.log("Active users for company:", activeUsers);

    if (activeUsers.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // --- NEW SIMPLIFIED RADAR API CALL ---
    // 2. Fetch ALL active trips from Radar with a single request
    const res = await axios.get("https://api.radar.io/v1/trips", {
      headers: { Authorization: process.env.RADAR_SECRET_KEY!.trim() },
      params: {
        status: "started,approaching,arrived",
        includeLocations: true,
      },
    });
    const allActiveTrips = res.data.trips || [];
    //console.log("Fetched all active trips from Radar:", allActiveTrips);
    // --- END OF API CALL ---

    // 3. Normalize and filter the trips against your DB users
    const mapped = allActiveTrips
      .map((trip: any) => {
        // Find the user in YOUR database that matches the user in the Radar trip data
        const user = activeUsers.find((u) => String(u.id) === trip.userId);

        // If the trip doesn't belong to a user in this company, skip it
        if (!user) return null;

        // Logic to find the most current location
        let locationData = null;
        if (trip.locations && trip.locations.length > 0) {
          // If the user has moved, use the last reported location
          locationData = trip.locations[trip.locations.length - 1];
        } else if (trip.metadata?.originLatitude && trip.metadata?.originLongitude) {
          // If the trip just started, use the origin location from metadata
          locationData = {
            coordinates: [trip.metadata.originLongitude, trip.metadata.originLatitude],
          };
        }

        // If no location data could be found, skip this trip
        if (!locationData) return null;

        return {
          userId: String(user.id),
          salesmanName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A",
          employeeId: user.salesmanLoginId,
          role: user.role,
          region: user.region,
          area: user.area,
          latitude: locationData.coordinates[1],
          longitude: locationData.coordinates[0],
          recordedAt: trip.updatedAt,
          isActive: true,
          accuracy: locationData.accuracy ?? null,
          speed: locationData.speed ?? null,
          heading: locationData.heading ?? null,
          altitude: locationData.altitude ?? null,
          batteryLevel: null,
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
