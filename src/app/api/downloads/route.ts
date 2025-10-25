// src/app/api/downloads/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { generateAndStreamCsv, generateAndStreamXlsx } from '@/lib/download-utils';

// Crucial Auth Check
async function getAuthClaims() {
  const claims = await getTokenClaims();
  if (!claims || !claims.sub || !claims.org_id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  return claims;
}

const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

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
    where: {
      user: {
        companyId: companyId
      }
    },
    // The 'include' clause ensures we get data from the related User model.
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

  // Define the headers for the CSV file. This array must match the order of data points below.
  const headers = [
    "Report ID", "Salesman Name", "Salesman Email", "Report Date", "Visit Type",
    "Site Name / Concerned Person", "Phone Number", "Email ID", "Clients' Remarks",
    "Salesperson Remarks", "Check-in Time", "Check-out Time", "Check-in Image URL", "Check-out Image URL",
    "Site Visit Brand In Use", "Site Visit Stage", "Conversion From Brand",
    "Conversion Quantity Value", "Conversion Quantity Unit", "Associated Party Name", "Influencer Type", "Service Type",
    "Quality Complaint", "Promotional Activity", "Channel Partner Visit", "Created At", "Updated At"
  ];

  const dataForCsv = reports.map(report => [
    report.id,
    `${report.user?.firstName || ''} ${report.user?.lastName || ''}`.trim(),
    report.user?.email || '',
    report.reportDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD
    report.visitType,
    report.siteNameConcernedPerson,
    report.phoneNo,
    report.emailId || '',
    report.clientsRemarks,
    report.salespersonRemarks,
    report.checkInTime.toISOString(),
    report.checkOutTime?.toISOString() || '',
    report.inTimeImageUrl || '',
    report.outTimeImageUrl || '',
    (report.siteVisitBrandInUse && report.siteVisitBrandInUse.length > 0) ? report.siteVisitBrandInUse.join(', ') : '',
    report.siteVisitStage || '',
    report.conversionFromBrand || '',
    report.conversionQuantityValue?.toString() || '',
    report.conversionQuantityUnit || '',
    report.associatedPartyName || '',
    (report.influencerType && report.influencerType.length > 0) ? report.influencerType.join(', ') : '',
    report.serviceType || '',
    report.qualityComplaint || '',
    report.promotionalActivity || '',
    report.channelPartnerVisit || '',
    report.createdAt.toISOString(),
    report.updatedAt.toISOString(),
  ]);

  return [headers, ...dataForCsv];
}

async function getPermanentJourneyPlansForCsv(companyId: number) {
  const plans = await prisma.permanentJourneyPlan.findMany({
    where: {
      // Find plans where either the assigned user or the creator user belongs to the company.
      // This ensures all relevant plans are captured.
      OR: [
        { user: { companyId: companyId } },
        { createdBy: { companyId: companyId } }
      ]
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
  });

  const headers = [
    "Plan ID", "Assigned Salesman Name", "Assigned User Email", "Creator Name",
    "Creator Email", "Plan Date", "Area to be Visited", "Description",
    "Status", "Created At", "Updated At"
  ];

  const dataForCsv = plans.map(plan => [
    plan.id,
    `${plan.user?.firstName || ''} ${plan.user?.lastName || ''}`.trim(),
    plan.user?.email || '',
    `${plan.createdBy?.firstName || ''} ${plan.createdBy?.lastName || ''}`.trim(),
    plan.createdBy?.email || '',
    plan.planDate.toISOString(),
    plan.areaToBeVisited,
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
    where: {
      user: {
        companyId: companyId
      }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      recordedAt: 'desc'
    },
  });
  const headers = [
    "Salesman Name", "User Email", "Latitude", "Longitude", "Recorded At", "Accuracy", "Speed", "Heading", "Altitude",
    "Location Type", "Activity Type", "App State", "Battery Level", "Is Charging", "Network Status",
    "IP Address", "Site Name", "Check In Time", "Check Out Time", "Total Distance Travelled",
    "Journey ID", "Is Active", "Destination Latitude", "Destination Longitude", "Created At", "Updated At"
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
    record.journeyId || '',
    record.isActive ? 'true' : 'false',
    record.destLat?.toNumber().toString() || '',
    record.destLng?.toNumber().toString() || '',
    record.createdAt.toISOString(),
    record.updatedAt.toISOString(),
  ]);
  return [headers, ...dataForCsv];
}

async function getSalesOrdersForCsv(companyId: number) {
  const orders = await prisma.salesOrder.findMany({
    where: {
      salesman: {
        companyId: companyId,
      },
    },
    include: {
      salesman: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      dealer: {
        select: {
          name: true,
          type: true,
          phoneNo: true,
          address: true,
          area: true,
          region: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const headers = [
    "Salesman Name",
    "Salesman Role",
    "Salesman Email",
    "Dealer Name",
    "Dealer Type",
    "Dealer Phone",
    "Dealer Address",
    "Area",
    "Region",
    "Quantity",
    "Unit",
    "Order Total (₹)",
    "Advance Payment (₹)",
    "Pending Payment (₹)",
    "Estimated Delivery",
    "Remarks",
    "Created At",
    "Updated At",
  ];

  const dataForCsv = orders.map(order => [
    `${order.salesman?.firstName || ''} ${order.salesman?.lastName || ''}`.trim(),
    order.salesman?.role || '',
    order.salesman?.email || '',
    order.dealer?.name || '',
    order.dealer?.type || '',
    order.dealer?.phoneNo || '',
    order.dealer?.address || '',
    order.dealer?.area || '',
    order.dealer?.region || '',
    order.quantity?.toString() || '',
    order.unit || '',
    order.orderTotal?.toString() || '',
    order.advancePayment?.toString() || '',
    order.pendingPayment?.toString() || '',
    order.estimatedDelivery ? order.estimatedDelivery.toISOString() : '',
    order.remarks || '',
    order.createdAt.toISOString(),
    order.updatedAt.toISOString(),
  ]);

  return [headers, ...dataForCsv];
}

async function getDailyTasksForCsv(companyId: number) {
  const tasks = await prisma.dailyTask.findMany({
    where: {
      user: {
        companyId: companyId
      }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      assignedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      relatedDealer: {
        select: {
          name: true
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    "Task ID", "Assigned To (Name)", "Assigned To (Email)", "Assigned By (Name)", "Assigned By (Email)",
    "Task Date", "Visit Type", "Related Dealer", "Site Name", "Description",
    "Status", "PJP Plan ID", "Created At", "Updated At"
  ];

  const dataForCsv = tasks.map(task => [
    task.id,
    `${task.user?.firstName || ''} ${task.user?.lastName || ''}`.trim(),
    task.user?.email || '',
    `${task.assignedBy?.firstName || ''} ${task.assignedBy?.lastName || ''}`.trim(),
    task.assignedBy?.email || '',
    task.taskDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD
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

async function getDealerBrandCapacitiesForCsv(companyId: number) {
  const mappings = await prisma.dealerBrandMapping.findMany({
    where: {
      dealer: {
        user: {
          companyId: companyId,
        },
      },
    },
    // Include the related 'dealer' and 'brand' data to get their names.
    include: {
      dealer: {
        select: {
          name: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
    },
  });

  // This combines data from the `DealerBrandMapping`, `Dealer`, and `Brand` models.
  const formattedMappings = mappings.map(mapping => ({
    dealerName: mapping.dealer?.name || '',
    brandName: mapping.brand?.name || '',
    capacityMT: mapping.capacityMT,
    salesmanName: `${mapping.dealer?.user?.firstName || ''} ${mapping.dealer?.user?.lastName || ''}`.trim(),
    salesmanEmail: mapping.dealer?.user?.email || '',
  }));

  return formatTableDataForCsv(formattedMappings);
}

async function getSalesmanRatingsForCsv(companyId: number) {
  const ratingRecords = await prisma.rating.findMany({
    where: {
      user: {
        companyId: companyId,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const formattedRecords = ratingRecords.map(record => ({
    id: record.id,
    area: record.area,
    region: record.region,
    rating: record.rating,
    salesmanName: `${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim(),
    salesmanEmail: record.user?.email || '',
  }));

  return formatTableDataForCsv(formattedRecords);
}

async function getDealerReportsAndScoresForCsv(companyId: number) {
  const scores = await prisma.dealerReportsAndScores.findMany({
    where: {
      dealer: {
        user: {
          companyId: companyId,
        },
      },
    },
    include: {
      dealer: {
        select: {
          name: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastUpdatedDate: 'desc',
    },
  });

  const formattedScores = scores.map(record => ({
    dealerName: record.dealer?.name || '',
    dealerScore: record.dealerScore,
    trustWorthinessScore: record.trustWorthinessScore,
    creditWorthinessScore: record.creditWorthinessScore,
    orderHistoryScore: record.orderHistoryScore,
    visitFrequencyScore: record.visitFrequencyScore,
    lastUpdatedDate: record.lastUpdatedDate,
    salesmanName: `${record.dealer?.user?.firstName || ''} ${record.dealer?.user?.lastName || ''}`.trim(),
    salesmanEmail: record.dealer?.user?.email || '',
  }));

  return formatTableDataForCsv(formattedScores);
}

//Master Custom Download
//imported from masterCustomDownload.ts

export async function GET(request: NextRequest) {
  try {
    //1. Auth check
    const claims = await getAuthClaims();
    if (claims instanceof NextResponse) return claims;

    // 2. Fetch Current User to check role and companyId
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
    //const selectionsParam = searchParams.get('selections');

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
      case 'competitionReports':
        csvData = await getCompetitionReportsForCsv(currentUser.companyId);
        filename = `competition-reports-${Date.now()}`;
        break;
      case 'geoTracking':
        csvData = await getGeoTrackingForCsv(currentUser.companyId);
        filename = `geo-tracking-${Date.now()}`;
        break;
      case 'salesOrders':
        csvData = await getSalesOrdersForCsv(currentUser.companyId);
        filename = `sales-orders-${Date.now()}`;
        break;
      case 'dailyTasks':
        csvData = await getDailyTasksForCsv(currentUser.companyId);
        filename = `daily-tasks-${Date.now()}`;
        break;
      case 'dealerBrandCapacities':
        csvData = await getDealerBrandCapacitiesForCsv(currentUser.companyId);
        filename = `dealer-brand-capacities-${Date.now()}`;
        break;
      case 'salesmanRating':
        csvData = await getSalesmanRatingsForCsv(currentUser.companyId);
        filename = `salesman-rating-${Date.now()}`;
        break;
      case 'dealerReportsAndScores':
        csvData = await getDealerReportsAndScoresForCsv(currentUser.companyId);
        filename = `dealer-reports-and-scores-${Date.now()}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      return generateAndStreamCsv(csvData, `${filename}.csv`);
    } else if (format === 'xlsx') {
      // csvData is [headers, ...rows]
      const headers = (csvData[0] ?? []) as string[];
      const rows = csvData.slice(1);
      return generateAndStreamXlsx(rows, headers, `${filename}.xlsx`);
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
