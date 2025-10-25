// src/app/api/downloads/masterCustomDownload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { generateAndStreamXlsxMulti, exportTablesToCSVZip } from '@/lib/download-utils';

// Crucial Auth Check
async function getAuthClaims() {
    const claims = await getTokenClaims();
    if (!claims || !claims.sub || !claims.org_id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    return claims;
}

// map each table id to an async fetcher that returns full rows (rich objects) scoped by company
const modelMap = {
    dailyVisitReports: async (companyId: number) => {
        const rows = await prisma.dailyVisitReport.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { reportDate: 'desc' },
        });
        return rows.map(r => ({
            reportDate: r.reportDate?.toISOString().slice(0, 10) ?? null,
            dealerType: r.dealerType ?? null,
            dealerName: r.dealerName ?? null,
            subDealerName: r.subDealerName ?? null,
            location: r.location ?? null,
            visitType: r.visitType ?? null,
            todayOrderMt: r.todayOrderMt?.toNumber() ?? null,
            todayCollectionRupees: r.todayCollectionRupees?.toNumber() ?? null,
            feedbacks: r.feedbacks ?? null,
            salesmanName: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || null,
        }));
    },

    technicalVisitReports: async (companyId: number) => {
        const rows = await prisma.technicalVisitReport.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { reportDate: 'desc' },
        });
        return rows.map(r => {
            const salesmanName = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim();

            return {
                id: r.id,
                reportDate: r.reportDate.toISOString().slice(0, 10),
                visitType: r.visitType,
                siteNameConcernedPerson: r.siteNameConcernedPerson,
                phoneNo: r.phoneNo,
                emailId: r.emailId,
                clientsRemarks: r.clientsRemarks,
                salespersonRemarks: r.salespersonRemarks,
                checkInTime: r.checkInTime.toISOString(),
                checkOutTime: r.checkOutTime?.toISOString() ?? null,
                inTimeImageUrl: r.inTimeImageUrl ?? null,
                outTimeImageUrl: r.outTimeImageUrl ?? null,
                // new cols added from pdf
                siteVisitBrandInUse: r.siteVisitBrandInUse, // Non-nullable, array
                siteVisitStage: r.siteVisitStage ?? null,
                conversionFromBrand: r.conversionFromBrand ?? null,
                conversionQuantityValue: r.conversionQuantityValue?.toNumber() ?? null,
                conversionQuantityUnit: r.conversionQuantityUnit ?? null,
                associatedPartyName: r.associatedPartyName ?? null,
                influencerType: r.influencerType, // Non-nullable, array
                serviceType: r.serviceType ?? null,
                qualityComplaint: r.qualityComplaint ?? null,
                promotionalActivity: r.promotionalActivity ?? null,
                channelPartnerVisit: r.channelPartnerVisit ?? null,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
                salesmanName: salesmanName || r.user?.email || null, // Cleaner logic
                salesmanEmail: r.user?.email ?? null,
            };
        });
    },

    salesmanAttendance: async (companyId: number) => {
        const rows = await prisma.salesmanAttendance.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(r => ({
            salesmanName: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || null,
            salesmanEmail: r.user?.email ?? null,
            attendanceDate: r.attendanceDate?.toISOString() ?? null,
            locationName: r.locationName ?? null,
            inTimeTimestamp: r.inTimeTimestamp?.toISOString() ?? null,
            outTimeTimestamp: r.outTimeTimestamp?.toISOString() ?? null,
            inTimeImageCaptured: r.inTimeImageCaptured ?? null,
            outTimeImageCaptured: r.outTimeImageCaptured ?? null,
            inTimeImageUrl: r.inTimeImageUrl ?? null,
            outTimeImageUrl: r.outTimeImageUrl ?? null,
            inTimeLatitude: r.inTimeLatitude?.toNumber() ?? null,
            inTimeLongitude: r.inTimeLongitude?.toNumber() ?? null,
            inTimeAccuracy: r.inTimeAccuracy?.toNumber() ?? null,
            inTimeSpeed: r.inTimeSpeed?.toNumber() ?? null,
            inTimeHeading: r.inTimeHeading?.toNumber() ?? null,
            inTimeAltitude: r.inTimeAltitude?.toNumber() ?? null,
            outTimeLatitude: r.outTimeLatitude?.toNumber() ?? null,
            outTimeLongitude: r.outTimeLongitude?.toNumber() ?? null,
            outTimeAccuracy: r.outTimeAccuracy?.toNumber() ?? null,
            outTimeSpeed: r.outTimeSpeed?.toNumber() ?? null,
            outTimeHeading: r.outTimeHeading?.toNumber() ?? null,
            outTimeAltitude: r.outTimeAltitude?.toNumber() ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
        }));
    },

    permanentJourneyPlans: async (companyId: number) => {
        const rows = await prisma.permanentJourneyPlan.findMany({
            where: {
                OR:
                    [{ user: { companyId } },
                    { createdBy: { companyId } }
                    ]
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                createdBy: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map(r => {
            const assignedToName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim();
            const creatorName = `${r.createdBy?.firstName || ''} ${r.createdBy?.lastName || ''}`.trim();

            return {
                id: r.id,
                planDate: r.planDate.toISOString().slice(0, 10),
                areaToBeVisited: r.areaToBeVisited,
                description: r.description,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
                assignedToName: assignedToName || r.user.email, // Use email as fallback
                assignedToEmail: r.user.email,
                creatorName: creatorName || r.createdBy.email, // Use email as fallback
                creatorEmail: r.createdBy.email,
            };
        });
    },

    dealers: async (companyId: number) => {
        const rows = await prisma.dealer.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(r => {
            const salesmanName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim();

            return {
                id: r.id,
                name: r.name,
                address: r.address,
                region: r.region,
                area: r.area,
                phoneNo: r.phoneNo,
                pinCode: r.pinCode,
                dateOfBirth: r.dateOfBirth,
                anniversaryDate: r.anniversaryDate,
                totalPotential: r.totalPotential.toNumber(),
                bestPotential: r.bestPotential.toNumber(),
                brandSelling: r.brandSelling.join(', '), // Correctly handles the array
                feedbacks: r.feedbacks,
                remarks: r.remarks ?? null,
                salesmanName: salesmanName || r.user?.email || null, // Cleaner logic
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
                salesmanEmail: r.user?.email ?? null,
            };
        });
    },

    salesmanLeaveApplications: async (companyId: number) => {
        const rows = await prisma.salesmanLeaveApplication.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(r => ({
            id: r.id,
            leaveType: r.leaveType ?? null,
            startDate: r.startDate?.toISOString().slice(0, 10) ?? null,
            endDate: r.endDate?.toISOString().slice(0, 10) ?? null,
            reason: r.reason ?? null,
            status: r.status ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
            salesmanName: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || null,
            salesmanEmail: r.user?.email ?? null,
        }));
    },

    competitionReports: async (companyId: number) => {
        const rows = await prisma.competitionReport.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { reportDate: 'desc' },
        });
        return rows.map(r => ({
            id: r.id,
            reportDate: r.reportDate?.toISOString().slice(0, 10) ?? null,
            brandName: r.brandName ?? null,
            billing: r.billing ?? null,
            nod: r.nod ?? null,
            retail: r.retail ?? null,
            schemesYesNo: r.schemesYesNo ?? null,
            avgSchemeCost: r.avgSchemeCost?.toNumber() ?? null,
            remarks: r.remarks ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
            salesmanName: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || null,
            salesmanEmail: r.user?.email ?? null,
        }));
    },

    geoTracking: async (companyId: number) => {
        const rows = await prisma.geoTracking.findMany({
            where: { user: { companyId } },
            include: { user: { select: { email: true } } },
            orderBy: { recordedAt: 'desc' },
            take: 500,
        });
        return rows.map(r => ({
            id: r.id,
            latitude: r.latitude?.toNumber() ?? null,
            longitude: r.longitude?.toNumber() ?? null,
            recordedAt: r.recordedAt?.toISOString() ?? null,
            accuracy: r.accuracy?.toNumber() ?? null,
            speed: r.speed?.toNumber() ?? null,
            heading: r.heading?.toNumber() ?? null,
            altitude: r.altitude?.toNumber() ?? null,
            locationType: r.locationType ?? null,
            activityType: r.activityType ?? null,
            appState: r.appState ?? null,
            batteryLevel: r.batteryLevel?.toNumber() ?? null,
            isCharging: r.isCharging ?? null,
            networkStatus: r.networkStatus ?? null,
            ipAddress: r.ipAddress ?? null,
            siteName: r.siteName ?? null,
            checkInTime: r.checkInTime?.toISOString() ?? null,
            checkOutTime: r.checkOutTime?.toISOString() ?? null,
            totalDistanceTravelled: r.totalDistanceTravelled?.toNumber() ?? null,
            journeyId: r.journeyId ?? null,
            isActive: r.isActive ?? null,
            destLat: r.destLat?.toNumber() ?? null,
            destLng: r.destLng?.toNumber() ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
            salesmanEmail: r.user?.email ?? null,
        }));
    },

    salesOrders: async (companyId: number) => {
        const rows = await prisma.salesOrder.findMany({
            where: { salesman: { companyId } },
            include: {
                salesman: {
                    select: { firstName: true, lastName: true, email: true, role: true },
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
            orderBy: { createdAt: 'desc' },
            take: 500,
        });

        return rows.map(r => ({
            id: r.id,
            salesmanName: `${r.salesman?.firstName || ''} ${r.salesman?.lastName || ''}`.trim() || null,
            salesmanRole: r.salesman?.role ?? null,
            salesmanEmail: r.salesman?.email ?? null,
            dealerName: r.dealer?.name ?? null,
            dealerType: r.dealer?.type ?? null,
            dealerPhone: r.dealer?.phoneNo ?? null,
            dealerAddress: r.dealer?.address ?? null,
            area: r.dealer?.area ?? null,
            region: r.dealer?.region ?? null,
            quantity: r.quantity ?? null,
            unit: r.unit ?? null,
            orderTotal: r.orderTotal ?? null,
            advancePayment: r.advancePayment ?? null,
            pendingPayment: r.pendingPayment ?? null,
            estimatedDelivery: r.estimatedDelivery ?? null,
            remarks: r.remarks ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
        }));
    },

    dailyTasks: async (companyId: number) => {
        const rows = await prisma.dailyTask.findMany({
            where: { user: { companyId } },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                assignedBy: { select: { firstName: true, lastName: true, email: true } },
                relatedDealer: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map(r => ({
            id: r.id,
            taskDate: r.taskDate?.toISOString().slice(0, 10) ?? null,
            visitType: r.visitType ?? null,
            siteName: r.siteName ?? null,
            description: r.description ?? null,
            status: r.status ?? null,
            pjpId: r.pjpId ?? null,
            createdAt: r.createdAt?.toISOString() ?? null,
            updatedAt: r.updatedAt?.toISOString() ?? null,
            assignedToName: `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || r.user?.email || null,
            assignedToEmail: r.user?.email ?? null,
            assignedByName: `${r.assignedBy?.firstName ?? ''} ${r.assignedBy?.lastName ?? ''}`.trim() || r.assignedBy?.email || null,
            assignedByEmail: r.assignedBy?.email ?? null,
            relatedDealerName: r.relatedDealer?.name ?? null,
        }));
    },

    dealerBrandCapacities: async (companyId: number) => {
        const rows = await prisma.dealerBrandMapping.findMany({
            where: { dealer: { user: { companyId } } },
            include: {
                dealer: { select: { name: true, user: { select: { firstName: true, lastName: true, email: true } } } },
                brand: { select: { name: true } }, // change to { brandName: true } if your schema uses brandName
            },
        });
        return rows.map((r) => ({
            dealerName: r.dealer?.name ?? null,
            brandName: (r as any).brand?.name ?? null, // or brandName
            capacityMT: num(r.capacityMT),
            salesmanName:
                `${r.dealer?.user?.firstName ?? ""} ${r.dealer?.user?.lastName ?? ""}`.trim() ||
                r.dealer?.user?.email ||
                null,
            salesmanEmail: r.dealer?.user?.email ?? null,
        }));
    },

    salesmanRating: async (companyId: number) => {
        const rows = await prisma.rating.findMany({
            where: { user: { companyId } },
            include: { user: { select: { firstName: true, lastName: true, email: true, area: true, region: true } } },
        });
        return rows.map((r) => ({
            id: r.id,
            area: r.area ?? r.user?.area ?? null,
            region: r.region ?? r.user?.region ?? null,
            rating: num(r.rating),
            salesmanName:
                `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim() ||
                r.user?.email ||
                null,
            salesmanEmail: r.user?.email ?? null,
        }));
    },

    dealerReportsAndScores: async (companyId: number) => {
        const rows = await prisma.dealerReportsAndScores.findMany({
            where: { dealer: { user: { companyId } } },
            include: { dealer: { select: { name: true, user: { select: { firstName: true, lastName: true, email: true } } } } },
            orderBy: { lastUpdatedDate: "desc" },
        });
        return rows.map((r) => ({
            dealerName: r.dealer?.name ?? null,
            dealerScore: num(r.dealerScore),
            trustWorthinessScore: num(r.trustWorthinessScore),
            creditWorthinessScore: num(r.creditWorthinessScore),
            orderHistoryScore: num(r.orderHistoryScore),
            visitFrequencyScore: num(r.visitFrequencyScore),
            lastUpdatedDate: r.lastUpdatedDate?.toISOString().slice(0, 10) ?? null,
            salesmanName:
                `${r.dealer?.user?.firstName ?? ""} ${r.dealer?.user?.lastName ?? ""}`.trim() ||
                r.dealer?.user?.email ||
                null,
            salesmanEmail: r.dealer?.user?.email ?? null,
        }));
    },

} as const;

type TableKey = keyof typeof modelMap;

// utilities: 
// group selections by table
function groupSelections(
    selections: { table: string; column: string }[]
): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    for (const s of selections) {
        if (!grouped[s.table]) grouped[s.table] = [];
        if (!grouped[s.table].includes(s.column)) grouped[s.table].push(s.column);
    }
    return grouped;
};

// num
function num(n: any): number | null {
    if (n == null) return null;
    return typeof n === "number" ? n : n?.toNumber?.() ?? Number(n);
};

// Excel formatting: one sheet per table
function buildSheetsPayload(grouped: Record<string, string[]>, data: Record<string, any[]>) {
    const sheets: Record<string, { headers: string[]; rows: any[] }> = {};
    for (const [table, cols] of Object.entries(grouped)) {
        const headers = cols;
        const rows = (data[table] ?? []).map(r => {
            const obj: Record<string, any> = {};
            for (const c of headers) obj[c] = (r as any)[c] ?? null;
            return obj;
        });
        sheets[table] = { headers, rows };
    }
    return sheets;
};

export async function POST(req: NextRequest) {
    try {
        //1.  Auth Check
        const claims = await getAuthClaims();
        if (claims instanceof NextResponse) return claims;

        const { format, selections } = await req.json() as {
            format: 'csv' | 'xlsx';
            selections: { table: string; column: string }[];
        };

        if (!selections?.length) {
            return NextResponse.json({ error: 'No columns selected' }, { status: 400 });
        }

        // current user & company check
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { companyId: true, role: true },
        });
        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // group and validate tables
        const grouped = groupSelections(selections);
        const invalidTables = Object.keys(grouped).filter(t => !(t in modelMap));
        if (invalidTables.length) {
            return NextResponse.json({ error: `Invalid tables: ${invalidTables.join(', ')}` }, { status: 400 });
        }

        // fetch data per table
        const dataPerTable: Record<string, any[]> = {};
        for (const table of Object.keys(grouped)) {
            const fn = modelMap[table as TableKey];
            dataPerTable[table] = await fn(currentUser.companyId);
        }

        const filenameBase = `master-custom-download-${Date.now()}`;

        // Multiple csv files per table
        if (format === 'csv') {
            const dataByTable = Object.entries(grouped).map(([table, cols]) => {
                const rows = (dataPerTable[table] ?? []).map(r => {
                    const obj: Record<string, any> = {};
                    for (const c of cols) obj[c] = (r as any)[c] ?? null;
                    return obj;
                });
                return { table, columns: cols, rows };
            });

            const zipBlob = await exportTablesToCSVZip(dataByTable);
            const buffer = Buffer.from(await zipBlob.arrayBuffer());

            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/zip",
                    "Content-Disposition": `attachment; filename="${filenameBase}.zip"`,
                },
            });
        }

        // Excel: one sheet per table with only selected columns
        const sheets = buildSheetsPayload(grouped, dataPerTable);
        return generateAndStreamXlsxMulti(sheets, `${filenameBase}.xlsx`);
    } catch (e) {
        console.error('custom download error', e);
        return NextResponse.json({ error: 'Failed to build custom download' }, { status: 500 });
    } finally {
        // do not disconnect prisma in Next app routes
    }
}
