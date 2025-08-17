// src/app/api/downloads/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthClaims, generateAndStreamCsv } from '@/lib/download-utils';

const allowedRoles = [
  'president',
  'senior-general-manager',
  'general-manager',
  'regional-sales-manager',
  'area-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
];

// Helper function to mock XLSX generation. In a real application, you would use a library like 'exceljs' or 'xlsx'.
const generateAndStreamXlsx = (data: string[][], filename: string) => {
  // This is a placeholder. A real implementation would convert the data to an XLSX file buffer.
  const content = `This is a placeholder for your XLSX file.
A real implementation would use a library like 'exceljs' to convert the data to a spreadsheet.
Data provided was:
${data.map(row => row.join(',')).join('\n')}`;

  const headers = new Headers();
  headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);

  return new NextResponse(content, {
    status: 200,
    headers: headers,
  });
};

// Generic helper to format any table data into CSV rows
const formatTableDataForCsv = (data: any[]) => {
  if (!data || data.length === 0) {
    return [[], []]; // Return empty headers and data
  }

  const headers = Object.keys(data[0]);

  const rows = data.map(row => headers.map(header => {
    const value = row[header];

    if (value === null || value === undefined) {
      return '';
    }

    // Handle nested objects (relations) by joining values
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Check for Decimal type and convert to string
      if (value.hasOwnProperty('toNumber') && typeof value.toNumber === 'function') {
        return value.toNumber().toString();
      }
      // Otherwise, join object values
      return Object.values(value).filter(v => v !== null).map(v => String(v)).join(' | ');
    }
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => String(v)).join(' | ');
    }
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }
    // All other values are converted to string
    return String(value);
  }));

  // Ensure headers are also strings
  const stringHeaders = headers.map(h => String(h));
  return [stringHeaders, ...rows];
};


// Helper functions for each table to be downloaded
async function getDailyVisitReportsForCsv(companyId: number) {
  const reports = await prisma.dailyVisitReport.findMany({
    where: { user: { companyId: companyId } },
    // Select the necessary fields and include the 'user' relation to get the name.
    select: {
      reportDate: true,
      dealerType: true,
      dealerName: true,
      subDealerName: true,
      location: true,
      visitType: true,
      todayOrderMt: true,
      todayCollectionRupees: true,
      feedbacks: true,
      // Here, we select the user's name instead of their ID.
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Now, we need to transform the data to match the new structure before
  // sending it to the CSV formatting function.
  const formattedReports = reports.map(report => ({
    ...report,
    // Replace the 'user' object with a simple 'salesmanName' field.
    salesmanName: `${report.user.firstName} ${report.user.lastName}`,
  }));

  // We pass the new, cleaner data structure to the formatter.
  return formatTableDataForCsv(formattedReports);
}

async function getTechnicalVisitReportsForCsv(companyId: number) {
  const reports = await prisma.technicalVisitReport.findMany({
    where: { user: { companyId: companyId } },
    // Select the necessary fields for the report and the user's name parts.
    select: {
      reportDate: true,
      visitType: true,
      siteNameConcernedPerson: true,
      phoneNo: true,
      emailId: true,
      clientsRemarks: true,
      salespersonRemarks: true,
      checkInTime: true,
      checkOutTime: true,
      inTimeImageUrl: true,
      outTimeImageUrl: true,
      // Select both the first and last name from the related User model.
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Now, we transform the data to create a 'salesmanName' field
  // before sending it to the CSV formatting function.
  const formattedReports = reports.map(report => ({
    ...report,
    // Combine the first and last name to create a single 'salesmanName' field.
    salesmanName: `${report.user.firstName} ${report.user.lastName}`,
  }));

  // The formatter will now receive the cleaner, more readable data.
  return formatTableDataForCsv(formattedReports);
}

async function getPermanentJourneyPlansForCsv(companyId: number) {
  const plans = await prisma.permanentJourneyPlan.findMany({
    where: { user: { companyId: companyId } },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  const headers = [
    "Area to be Visited", "Salesman Name", "User Email", "Plan Date", "Description", "Status", "Created At", "Updated At"
  ];
  const dataForCsv = plans.map(plan => [
    // plan.id,
    plan.areaToBeVisited,
    `${plan.user?.firstName || ''} ${plan.user?.lastName || ''}`.trim(),
    plan.user?.email || '',
    plan.planDate.toISOString(),
    plan.description || '',
    plan.status,
    plan.createdAt.toISOString(),
    plan.updatedAt.toISOString(),
  ]);
  return [headers, ...dataForCsv];
}

async function getDealersForCsv(companyId: number) {
  const dealers = await prisma.dealer.findMany({
    where: { user: { companyId: companyId } },
    // Include the user to get their name
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map the results to create a salesmanName field
  const formattedDealers = dealers.map(dealer => ({
    ...dealer,
    salesmanName: `${dealer.user?.firstName || ''} ${dealer.user?.lastName || ''}`.trim(),
  }));

  // Remove the user object before formatting
  const cleanedDealers = formattedDealers.map(({ user, ...rest }) => rest);

  return formatTableDataForCsv(cleanedDealers);
}

async function getSalesmanAttendanceForCsv(companyId: number) {
  const attendance = await prisma.salesmanAttendance.findMany({
    where: { user: { companyId: companyId } },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  const headers = [
    "Salesman Name", "User Email", "Attendance Date", "Location Name", "In Time", "Out Time",
    "In Time Image Captured", "Out Time Image Captured", "In Time Image URL", "Out Time Image URL",
    "In Time Latitude", "In Time Longitude", "In Time Accuracy", "In Time Speed", "In Time Heading",
    "In Time Altitude", "Out Time Latitude", "Out Time Longitude", "Out Time Accuracy", "Out Time Speed",
    "Out Time Heading", "Out Time Altitude", "Created At", "Updated At"
  ];
  const dataForCsv = attendance.map(att => [
    //att.id,
    `${att.user?.firstName || ''} ${att.user?.lastName || ''}`.trim(),
    att.user?.email || '',
    att.attendanceDate.toISOString(),
    att.locationName,
    att.inTimeTimestamp.toISOString(),
    att.outTimeTimestamp?.toISOString() || '',
    att.inTimeImageCaptured ? 'true' : 'false',
    att.outTimeImageCaptured ? 'true' : 'false',
    att.inTimeImageUrl || '',
    att.outTimeImageUrl || '',
    att.inTimeLatitude.toNumber().toString(),
    att.inTimeLongitude.toNumber().toString(),
    att.inTimeAccuracy?.toNumber().toString() || '',
    att.inTimeSpeed?.toNumber().toString() || '',
    att.inTimeHeading?.toNumber().toString() || '',
    att.inTimeAltitude?.toNumber().toString() || '',
    att.outTimeLatitude?.toNumber().toString() || '',
    att.outTimeLongitude?.toNumber().toString() || '',
    att.outTimeAccuracy?.toNumber().toString() || '',
    att.outTimeSpeed?.toNumber().toString() || '',
    att.outTimeHeading?.toNumber().toString() || '',
    att.outTimeAltitude?.toNumber().toString() || '',
    att.createdAt.toISOString(),
    att.updatedAt.toISOString(),
  ]);
  return [headers, ...dataForCsv];
}

async function getSalesmanLeaveApplicationsForCsv(companyId: number) {
  const leaves = await prisma.salesmanLeaveApplication.findMany({
    where: { user: { companyId: companyId } },
    // Include the user to get their name and email
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map the results to create a salesmanName field
  const formattedLeaves = leaves.map(leave => ({
    ...leave,
    salesmanName: `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim(),
    salesmanEmail: leave.user?.email || '',
  }));

  // Remove the user object before formatting
  const cleanedLeaves = formattedLeaves.map(({ user, ...rest }) => rest);

  return formatTableDataForCsv(cleanedLeaves);
}

async function getClientReportsForCsv(companyId: number) {
  const reports = await prisma.clientReport.findMany({
    where: { user: { companyId: companyId } },
    // Include the user to get their name and email
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map the results to create a salesmanName field
  const formattedReports = reports.map(report => ({
    ...report,
    salesmanName: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim(),
    salesmanEmail: report.user?.email || '',
  }));

  // Remove the user object before formatting
  const cleanedReports = formattedReports.map(({ user, ...rest }) => rest);

  return formatTableDataForCsv(cleanedReports);
}

async function getCompetitionReportsForCsv(companyId: number) {
  const reports = await prisma.competitionReport.findMany({
    where: { user: { companyId: companyId } },
    // Include the user to get their name and email
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map the results to create a salesmanName field
  const formattedReports = reports.map(report => ({
    ...report,
    salesmanName: `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim(),
    salesmanEmail: report.user?.email || '',
  }));

  // Remove the user object before formatting
  const cleanedReports = formattedReports.map(({ user, ...rest }) => rest);

  return formatTableDataForCsv(cleanedReports);
}

async function getGeoTrackingForCsv(companyId: number) {
  const tracking = await prisma.geoTracking.findMany({
    where: { user: { companyId: companyId } },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { recordedAt: 'desc' },
  });
  const headers = [
    "Salesman Name", "User Email", "Latitude", "Longitude", "Recorded At", "Accuracy", "Speed", "Heading", "Altitude",
    "Location Type", "Activity Type", "App State", "Battery Level", "Is Charging", "Network Status",
    "IP Address", "Site Name", "Check In Time", "Check Out Time", "Total Distance Travelled",
    "Created At", "Updated At"
  ];
  const dataForCsv = tracking.map(record => [
    //record.id,
    record.user?.email || '',
    record.latitude.toNumber().toString(),
    record.longitude.toNumber().toString(),
    record.recordedAt.toISOString(),
    record.accuracy?.toNumber().toString() || '',
    record.speed?.toNumber().toString() || '',
    record.heading?.toNumber().toString() || '',
    record.altitude?.toNumber().toString() || '',
    record.locationType || '',
    record.activityType || '',
    record.appState || '',
    record.batteryLevel?.toNumber().toString() || '',
    record.isCharging ? 'true' : 'false',
    record.networkStatus || '',
    record.ipAddress || '',
    record.siteName || '',
    record.checkInTime?.toISOString() || '',
    record.checkOutTime?.toISOString() || '',
    record.totalDistanceTravelled?.toNumber().toString() || '',
    record.createdAt.toISOString(),
    record.updatedAt.toISOString(),
  ]);
  return [headers, ...dataForCsv];
}

async function getDailyTasksForCsv(companyId: number) {
  const tasks = await prisma.dailyTask.findMany({
    where: { user: { companyId: companyId } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      assignedBy: { select: { firstName: true, lastName: true, email: true } },
      relatedDealer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    "Assigned To (Name)", "Assigned To (Email)", "Assigned By (Name)", "Assigned By (Email)",
    "Task Date", "Visit Type", "Related Dealer", "Site Name", "Description", "Status",
    "PJP Plan ID", "Created At", "Updated At"
  ];
  const dataForCsv = tasks.map(task => [
    //task.id,
    `${task.user?.firstName || ''} ${task.user?.lastName || ''}`.trim(),
    task.user?.email || '',
    `${task.assignedBy?.firstName || ''} ${task.assignedBy?.lastName || ''}`.trim(),
    task.assignedBy?.email || '',
    task.taskDate.toISOString(),
    task.visitType,
    task.relatedDealer?.name || '',
    task.siteName || '',
    task.description || '',
    task.status,
    task.pjpId || '',
    task.createdAt.toISOString(),
    task.updatedAt.toISOString(),
  ]);
  return [headers, ...dataForCsv];
}

async function getSalesReportForCsv(companyId: number) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // 1. Fetch all users (salesmen) with their area/region
  const users = await prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      area: true,
      region: true,
      // If you're storing target separately:
      // targets: {
      //   where: { month: today.getMonth() + 1, year: today.getFullYear() },
      //   select: { targetMt: true }
      // }
    }
  });

   const headers = [
    "Salesman Name", "Area", "Region","Monthly Target (MT)", "Till Date Achievement (MT)",
    "Yesterday's Target (MT)", "Yesterday's Collection (₹)", //"Achievement %",
    // "Balance Target (MT)", 
  ];

  const dataForCsv: string[][] = [];

  for (const user of users) {
    const salesmanName = `${user.firstName} ${user.lastName}`.trim();
    const area = user.area || '';
    const region = user.region || '';

    // 2. Get monthly target (from Target table or DailyVisitReport if you hack it in)
    //const monthlyTarget = user.targets[0]?.targetMt?.toNumber() || 0;

    // 3. Till date achievement = sum of todayOrderMt for current month
    const tillDate = await prisma.dailyVisitReport.aggregate({
      where: {
        userId: user.id,
        reportDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lte: today,
        }
      },
      _sum: { todayOrderMt: true }
    });

    const tillDateAchievement = tillDate._sum.todayOrderMt?.toNumber() || 0;

    // 4. Yesterday's target & collection
    const yesterdayReport = await prisma.dailyVisitReport.findFirst({
      where: { userId: user.id, reportDate: yesterday },
      select: {
        todayOrderMt: true,
        todayCollectionRupees: true
      }
    });

    const yesterdayTarget = yesterdayReport?.todayOrderMt?.toNumber() || 0;
    const yesterdayCollection = yesterdayReport?.todayCollectionRupees?.toNumber() || 0;

    // 5. Balance target & achievement %
    //const balanceTarget = Math.max(monthlyTarget - tillDateAchievement, 0);
    //calc of achievement percentage from given info in target table
    // const achievementPct = monthlyTarget > 0 
    //   ? ((tillDateAchievement / monthlyTarget) * 100).toFixed(2) 
    //   : "0.00";

    dataForCsv.push([
      salesmanName,
      area,
      region,
      //monthlyTarget.toString(),
      tillDateAchievement.toString(),
      yesterdayTarget.toString(),
      yesterdayCollection.toString(),
      //balanceTarget.toString(),
      //achievementPct
    ]);
  }

  return [headers, ...dataForCsv];
}


// async function getPjpEntriesForCsv(companyId: number) {
//   const entries = await prisma.dailyTask.findMany({
//     where: { user: { companyId: companyId }, pjpId: { not: null } },
//     include: {
//       permanentJourneyPlan: { select: { id: true, areaToBeVisited: true, planDate: true } },
//       relatedDealer: { select: { name: true } },
//     },
//     orderBy: { createdAt: 'desc' },
//   });
//   const headers = [
//     "Task ID", "PJP Plan ID", "PJP Plan Area", "PJP Plan Date", "Dealer Name", "Visit Type", "Status", "Created At"
//   ];
//   const dataForCsv = entries.map(entry => [
//     entry.id,
//     entry.pjpId || '',
//     entry.permanentJourneyPlan?.areaToBeVisited || '',
//     entry.permanentJourneyPlan?.planDate.toISOString() || '',
//     entry.relatedDealer?.name || '',
//     entry.visitType,
//     entry.status,
//     entry.createdAt.toISOString(),
//   ]);
//   return [headers, ...dataForCsv];
// }


export async function GET(request: NextRequest) {
  try {
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      include: { company: true }
    });

    // 3. Role-based Authorization
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only the following roles can delete dealers: ${allowedRoles.join(', ')}` }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType');
    const format = searchParams.get('format');

    if (!reportType || !format) {
      return NextResponse.json({ error: 'Missing reportType or format query parameter' }, { status: 400 });
    }

    let csvData: string[][] = [];
    let filename = '';

    switch (reportType) {
      case 'dailyVisitReports':
        csvData = await getDailyVisitReportsForCsv(currentUser.companyId);
        filename = `daily-visit-reports-${Date.now()}`;
        break;
      case 'technicalVisitReports':
        csvData = await getTechnicalVisitReportsForCsv(currentUser.companyId);
        filename = `technical-visit-reports-${Date.now()}`;
        break;
      case 'pjp':
        csvData = await getPermanentJourneyPlansForCsv(currentUser.companyId);
        filename = `pjp-${Date.now()}`;
        break;
      case 'dealers':
        csvData = await getDealersForCsv(currentUser.companyId);
        filename = `dealers-${Date.now()}`;
        break;
      case 'salesmanAttendance':
        csvData = await getSalesmanAttendanceForCsv(currentUser.companyId);
        filename = `salesman-attendance-${Date.now()}`;
        break;
      case 'salesmanLeaveApplications':
        csvData = await getSalesmanLeaveApplicationsForCsv(currentUser.companyId);
        filename = `salesman-leave-applications-${Date.now()}`;
        break;
      case 'clientReports':
        csvData = await getClientReportsForCsv(currentUser.companyId);
        filename = `client-reports-${Date.now()}`;
        break;
      case 'competitionReports':
        csvData = await getCompetitionReportsForCsv(currentUser.companyId);
        filename = `competition-reports-${Date.now()}`;
        break;
      case 'geoTracking':
        csvData = await getGeoTrackingForCsv(currentUser.companyId);
        filename = `geo-tracking-${Date.now()}`;
        break;
      case 'dailyTasks':
        csvData = await getDailyTasksForCsv(currentUser.companyId);
        filename = `daily-tasks-${Date.now()}`;
        break;
      case 'salesReport':
        csvData = await getSalesReportForCsv(currentUser.companyId);
        filename = `sales-reports-${Date.now()}`;
        break;
      // case 'pjpEntries':
      //   csvData = await getPjpEntriesForCsv(currentUser.companyId);
      //   filename = `pjp-entries-${Date.now()}`;
      //   break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      return generateAndStreamCsv(csvData, `${filename}.csv`);
    } else if (format === 'xlsx') {
      return generateAndStreamXlsx(csvData, `${filename}.xlsx`);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in downloads route:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
