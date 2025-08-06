// src/app/api/dashboardPagesAPI/salesman-attendance/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const attendanceRecords = await prisma.salesmanAttendance.findMany({
      include: {
        user: true, // Include the entire User object to access firstName and lastName
      },
      orderBy: {
        attendanceDate: 'desc', // Order by date, newest first
      },
    });

    // Map the Prisma data to the desired frontend format
    const formattedRecords = attendanceRecords.map(record => {
      // Construct salesmanName from firstName and lastName, handling potential nulls
      const salesmanName = [record.user?.firstName, record.user?.lastName]
        .filter(Boolean) // Remove any null or undefined parts
        .join(' ') || 'N/A'; // Join with space, default to 'N/A' if both are empty

      return {
        id: record.id,
        salesmanName: salesmanName,
        date: record.attendanceDate.toISOString().split('T')[0], // YYYY-MM-DD
        location: record.locationName, // Corresponds to locationName in schema
        inTime: record.inTimeTimestamp ? record.inTimeTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        outTime: record.outTimeTimestamp ? record.outTimeTimestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
        inTimeImageCaptured: record.inTimeImageCaptured,
        outTimeImageCaptured: record.outTimeImageCaptured,
        inTimeImageUrl: record.inTimeImageUrl,
        outTimeImageUrl: record.outTimeImageUrl,
        inTimeLatitude: record.inTimeLatitude?.toNumber(), // Convert Decimal to Number
        inTimeLongitude: record.inTimeLongitude?.toNumber(),
        inTimeAccuracy: record.inTimeAccuracy?.toNumber(),
        inTimeSpeed: record.inTimeSpeed?.toNumber(),
        inTimeHeading: record.inTimeHeading?.toNumber(),
        inTimeAltitude: record.inTimeAltitude?.toNumber(),
        outTimeLatitude: record.outTimeLatitude?.toNumber(),
        outTimeLongitude: record.outTimeLongitude?.toNumber(),
        outTimeAccuracy: record.outTimeAccuracy?.toNumber(),
        outTimeSpeed: record.outTimeSpeed?.toNumber(),
        outTimeHeading: record.outTimeHeading?.toNumber(),
        outTimeAltitude: record.outTimeAltitude?.toNumber(),
      };
    });

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching salesman attendance reports:', error);
    return NextResponse.json({ message: 'Failed to fetch salesman attendance reports', error: (error as Error).message }, { status: 500 });
  } finally {
    //await prisma.$disconnect();
  }
}