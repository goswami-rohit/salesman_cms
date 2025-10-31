// src/lib/reports-transformer.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Users
export type FlattenedUser = {
    id: number;
    email: string;
    fullName: string; // Flattened name
    role: string;
    phoneNumber: string | null;
    status: string;
    region: string | null;
    area: string | null;
    reportsToManagerName: string | null; // Flattened relation name
    createdAt: string;
};

export async function getFlattenedUsers(companyId: number): Promise<FlattenedUser[]> {
    const rawUsers = await prisma.user.findMany({
        where: { companyId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phoneNumber: true,
            status: true,
            region: true,
            area: true,
            createdAt: true,
            // Relations for flattening:
            reportsTo: {
                select: { firstName: true, lastName: true }
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return rawUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: `${u.firstName} ${u.lastName}`,
        role: u.role,
        phoneNumber: u.phoneNumber ?? null,
        status: u.status,
        region: u.region ?? null,
        area: u.area ?? null,
        reportsToManagerName: u.reportsTo ? `${u.reportsTo.firstName} ${u.reportsTo.lastName}` : null,
        createdAt: u.createdAt?.toISOString() ?? '',
    }));
}

// Dealers
export type FlattenedDealer = {
    // Scalar fields that need no special handling (String, Int)
    id: string;
    type: string;
    name: string;
    region: string;
    area: string;
    phoneNo: string;
    address: string;
    pinCode: string | null;
    feedbacks: string;
    remarks: string | null;
    dealerDevelopmentStatus: string | null;
    dealerDevelopmentObstacle: string | null;
    verificationStatus: string;
    whatsappNo: string | null;
    emailId: string | null;
    businessType: string | null;
    gstinNo: string | null;
    panNo: string | null;
    tradeLicNo: string | null;
    aadharNo: string | null;
    godownSizeSqFt: number | null; // Int
    godownCapacityMTBags: string | null;
    godownAddressLine: string | null;
    godownLandMark: string | null;
    godownDistrict: string | null;
    godownArea: string | null;
    godownRegion: string | null;
    godownPinCode: string | null;
    residentialAddressLine: string | null;
    residentialLandMark: string | null;
    residentialDistrict: string | null;
    residentialArea: string | null;
    residentialRegion: string | null;
    residentialPinCode: string | null;
    bankAccountName: string | null;
    bankName: string | null;
    bankBranchAddress: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    brandName: string | null;
    noOfDealers: number | null; // Int
    areaCovered: string | null;
    noOfEmployeesInSales: number | null; // Int
    declarationName: string | null;
    declarationPlace: string | null;
    tradeLicencePicUrl: string | null;
    shopPicUrl: string | null;
    dealerPicUrl: string | null;
    blankChequePicUrl: string | null;
    partnershipDeedPicUrl: string | null;

    // Fields that require Type Conversion (Decimal, DateTime, Array)
    latitude: number | null; // Decimal -> number
    longitude: number | null; // Decimal -> number
    dateOfBirth: string | null; // DateTime -> string
    anniversaryDate: string | null; // DateTime -> string
    totalPotential: number; // Decimal -> number
    bestPotential: number; // Decimal -> number
    monthlySaleMT: number | null; // Decimal -> number
    projectedMonthlySalesBestCementMT: number | null; // Decimal -> number
    brandSelling: string; // String[] -> string (joined)
    declarationDate: string | null; // DateTime -> string

    // Auto-generated fields (for full report)
    createdAt: string;
    updatedAt: string;

    // Flattened relation field
    associatedSalesmanName: string | null;
};

export async function getFlattenedDealers(companyId: number): Promise<FlattenedDealer[]> {
    // 1. SELECT all fields and the necessary relation
    const rawDealers = await prisma.dealer.findMany({
        where: { user: { companyId: companyId } },
        select: {
            // Include all scalar fields by explicitly listing them:
            id: true, userId: true, type: true, parentDealerId: true, name: true, region: true, area: true,
            phoneNo: true, address: true, pinCode: true, latitude: true, longitude: true,
            dateOfBirth: true, anniversaryDate: true, totalPotential: true, bestPotential: true,
            brandSelling: true, feedbacks: true, remarks: true, dealerDevelopmentStatus: true,
            dealerDevelopmentObstacle: true, verificationStatus: true, whatsappNo: true, emailId: true,
            businessType: true, gstinNo: true, panNo: true, tradeLicNo: true, aadharNo: true,
            godownSizeSqFt: true, godownCapacityMTBags: true, godownAddressLine: true, godownLandMark: true,
            godownDistrict: true, godownArea: true, godownRegion: true, godownPinCode: true,
            residentialAddressLine: true, residentialLandMark: true, residentialDistrict: true,
            residentialArea: true, residentialRegion: true, residentialPinCode: true, bankAccountName: true,
            bankName: true, bankBranchAddress: true, bankAccountNumber: true, bankIfscCode: true,
            brandName: true, monthlySaleMT: true, noOfDealers: true, areaCovered: true,
            projectedMonthlySalesBestCementMT: true, noOfEmployeesInSales: true, declarationName: true,
            declarationPlace: true, declarationDate: true, tradeLicencePicUrl: true, shopPicUrl: true,
            dealerPicUrl: true, blankChequePicUrl: true, partnershipDeedPicUrl: true,
            createdAt: true, updatedAt: true,

            // Relations for flattening:
            user: {
                select: { firstName: true, lastName: true }
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // 2. Transformation/Flattening Logic
    return rawDealers.map((d: any) => ({
        // Scalar Fields (Default Mapping)
        id: d.id, type: d.type, name: d.name, region: d.region, area: d.area, phoneNo: d.phoneNo,
        address: d.address, pinCode: d.pinCode ?? null, feedbacks: d.feedbacks, remarks: d.remarks ?? null,
        dealerDevelopmentStatus: d.dealerDevelopmentStatus ?? null, dealerDevelopmentObstacle: d.dealerDevelopmentObstacle ?? null,
        verificationStatus: d.verificationStatus, whatsappNo: d.whatsappNo ?? null, emailId: d.emailId ?? null,
        businessType: d.businessType ?? null, gstinNo: d.gstinNo ?? null, panNo: d.panNo ?? null, tradeLicNo: d.tradeLicNo ?? null,
        aadharNo: d.aadharNo ?? null, godownSizeSqFt: d.godownSizeSqFt ?? null, godownCapacityMTBags: d.godownCapacityMTBags ?? null,
        godownAddressLine: d.godownAddressLine ?? null, godownLandMark: d.godownLandMark ?? null, godownDistrict: d.godownDistrict ?? null,
        godownArea: d.godownArea ?? null, godownRegion: d.godownRegion ?? null, godownPinCode: d.godownPinCode ?? null,
        residentialAddressLine: d.residentialAddressLine ?? null, residentialLandMark: d.residentialLandMark ?? null,
        residentialDistrict: d.residentialDistrict ?? null, residentialArea: d.residentialArea ?? null, residentialRegion: d.residentialRegion ?? null,
        residentialPinCode: d.residentialPinCode ?? null, bankAccountName: d.bankAccountName ?? null, bankName: d.bankName ?? null,
        bankBranchAddress: d.bankBranchAddress ?? null, bankAccountNumber: d.bankAccountNumber ?? null, bankIfscCode: d.bankIfscCode ?? null,
        brandName: d.brandName ?? null, noOfDealers: d.noOfDealers ?? null, areaCovered: d.areaCovered ?? null,
        noOfEmployeesInSales: d.noOfEmployeesInSales ?? null, declarationName: d.declarationName ?? null,
        declarationPlace: d.declarationPlace ?? null, tradeLicencePicUrl: d.tradeLicencePicUrl ?? null, shopPicUrl: d.shopPicUrl ?? null,
        dealerPicUrl: d.dealerPicUrl ?? null, blankChequePicUrl: d.blankChequePicUrl ?? null, partnershipDeedPicUrl: d.partnershipDeedPicUrl ?? null,

        // DateTime Fields (Conversion to Date string)
        dateOfBirth: d.dateOfBirth?.toISOString().slice(0, 10) ?? null,
        anniversaryDate: d.anniversaryDate?.toISOString().slice(0, 10) ?? null,
        declarationDate: d.declarationDate?.toISOString().slice(0, 10) ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),

        // Decimal Fields (Conversion to number)
        latitude: d.latitude?.toNumber() ?? null,
        longitude: d.longitude?.toNumber() ?? null,
        totalPotential: d.totalPotential.toNumber(),
        bestPotential: d.bestPotential.toNumber(),
        monthlySaleMT: d.monthlySaleMT?.toNumber() ?? null,
        projectedMonthlySalesBestCementMT: d.projectedMonthlySalesBestCementMT?.toNumber() ?? null,

        // Array Field (Conversion to comma-separated string)
        brandSelling: d.brandSelling.join(', '),

        // Flattened Relation Field
        associatedSalesmanName: d.user ? `${d.user.firstName} ${d.user.lastName}` : null,
    }));
}

// DVR
export type FlattenedDailyVisitReport = {
    id: string;
    reportDate: string;
    dealerType: string;
    dealerName: string | null;      // hydrated from relation
    subDealerName: string | null;   // hydrated from relation
    location: string;
    latitude: number;
    longitude: number;
    visitType: string;
    dealerTotalPotential: number;
    dealerBestPotential: number;
    brandSelling: string;
    contactPerson: string | null;
    contactPersonPhoneNo: string | null;
    todayOrderMt: number;
    todayCollectionRupees: number;
    overdueAmount: number | null;
    feedbacks: string;
    solutionBySalesperson: string | null;
    anyRemarks: string | null;
    checkInTime: string;
    checkOutTime: string | null;
    inTimeImageUrl: string | null;
    outTimeImageUrl: string | null;
    createdAt: string;
    updatedAt: string;

    salesmanName: string;
    salesmanEmail: string;
};

// getFlattenedDailyVisitReports — FIXED to pull names via FKs
export async function getFlattenedDailyVisitReports(companyId: number): Promise<FlattenedDailyVisitReport[]> {
    // getFlattenedDailyVisitReports(companyId)
    const raw = await prisma.dailyVisitReport.findMany({
        where: { user: { companyId } },
        select: {
            id: true, reportDate: true, dealerType: true,
            location: true, latitude: true, longitude: true, visitType: true,
            dealerTotalPotential: true, dealerBestPotential: true,
            brandSelling: true, contactPerson: true, contactPersonPhoneNo: true,
            todayOrderMt: true, todayCollectionRupees: true, overdueAmount: true,
            feedbacks: true, solutionBySalesperson: true, anyRemarks: true,
            checkInTime: true, checkOutTime: true, inTimeImageUrl: true, outTimeImageUrl: true,
            createdAt: true, updatedAt: true,

            user: { select: { firstName: true, lastName: true, email: true } },

            // REQUIRED for names
            dealer: { select: { name: true } },
            subDealer: { select: { name: true } },
        },
        orderBy: { reportDate: 'desc' },
    });

    return raw.map(r => ({
        id: r.id,
        reportDate: r.reportDate.toISOString().slice(0, 10),
        dealerType: r.dealerType,
        dealerName: r.dealer?.name ?? null,
        subDealerName: r.subDealer?.name ?? null,
        location: r.location,
        latitude: r.latitude.toNumber(),
        longitude: r.longitude.toNumber(),
        visitType: r.visitType,
        dealerTotalPotential: r.dealerTotalPotential.toNumber(),
        dealerBestPotential: r.dealerBestPotential.toNumber(),
        brandSelling: r.brandSelling.join(', '),
        contactPerson: r.contactPerson ?? null,
        contactPersonPhoneNo: r.contactPersonPhoneNo ?? null,
        todayOrderMt: r.todayOrderMt.toNumber(),
        todayCollectionRupees: r.todayCollectionRupees.toNumber(),
        overdueAmount: r.overdueAmount?.toNumber() ?? null,
        feedbacks: r.feedbacks,
        solutionBySalesperson: r.solutionBySalesperson ?? null,
        anyRemarks: r.anyRemarks ?? null,
        checkInTime: r.checkInTime.toISOString(),
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
        inTimeImageUrl: r.inTimeImageUrl ?? null,
        outTimeImageUrl: r.outTimeImageUrl ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        salesmanName: `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email,
        salesmanEmail: r.user.email,
    }));
}

// TVR
export type FlattenedTechnicalVisitReport = {
    // All scalar fields from TechnicalVisitReport
    id: string;
    reportDate: string; // Converted from Date
    visitType: string;
    siteNameConcernedPerson: string;
    phoneNo: string;
    emailId: string | null;
    clientsRemarks: string;
    salespersonRemarks: string;
    checkInTime: string; // Converted from DateTime (Timestamp)
    checkOutTime: string | null; // Converted from DateTime (Timestamp)
    inTimeImageUrl: string | null;
    outTimeImageUrl: string | null;
    siteVisitBrandInUse: string; // Converted from String[]
    siteVisitStage: string | null;
    conversionFromBrand: string | null;
    conversionQuantityValue: number | null; // Converted from Decimal
    conversionQuantityUnit: string | null;
    associatedPartyName: string | null;
    influencerType: string; // Converted from String[]
    serviceType: string | null;
    qualityComplaint: string | null;
    promotionalActivity: string | null;
    channelPartnerVisit: string | null;
    siteVisitType: string | null;
    dhalaiVerificationCode: string | null;
    isVerificationStatus: string | null;
    meetingId: string | null;
    createdAt: string; // Converted from DateTime (Timestamp)
    updatedAt: string; // Converted from DateTime (Timestamp)

    // Flattened fields from the related User model (salesperson)
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedTechnicalVisitReports(companyId: number): Promise<FlattenedTechnicalVisitReport[]> {
    const rawReports = await prisma.technicalVisitReport.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields included explicitly
            id: true, userId: true, reportDate: true, visitType: true, siteNameConcernedPerson: true, phoneNo: true,
            emailId: true, clientsRemarks: true, salespersonRemarks: true, checkInTime: true, checkOutTime: true,
            inTimeImageUrl: true, outTimeImageUrl: true, createdAt: true, updatedAt: true,
            siteVisitBrandInUse: true, siteVisitStage: true, conversionFromBrand: true, conversionQuantityValue: true,
            conversionQuantityUnit: true, associatedPartyName: true, influencerType: true, serviceType: true,
            qualityComplaint: true, promotionalActivity: true, channelPartnerVisit: true, siteVisitType: true,
            dhalaiVerificationCode: true, isVerificationStatus: true, meetingId: true,

            // Nested query for the relation:
            user: {
                select: { firstName: true, lastName: true, email: true }
            },
        },
        orderBy: { reportDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        // Map scalar fields
        id: r.id,
        visitType: r.visitType,
        siteNameConcernedPerson: r.siteNameConcernedPerson,
        phoneNo: r.phoneNo,
        emailId: r.emailId ?? null,
        clientsRemarks: r.clientsRemarks,
        salespersonRemarks: r.salespersonRemarks,
        siteVisitStage: r.siteVisitStage ?? null,
        conversionFromBrand: r.conversionFromBrand ?? null,
        conversionQuantityUnit: r.conversionQuantityUnit ?? null,
        associatedPartyName: r.associatedPartyName ?? null,
        serviceType: r.serviceType ?? null,
        qualityComplaint: r.qualityComplaint ?? null,
        promotionalActivity: r.promotionalActivity ?? null,
        channelPartnerVisit: r.channelPartnerVisit ?? null,
        siteVisitType: r.siteVisitType ?? null,
        dhalaiVerificationCode: r.dhalaiVerificationCode ?? null,
        isVerificationStatus: r.isVerificationStatus ?? null,
        meetingId: r.meetingId ?? null,
        inTimeImageUrl: r.inTimeImageUrl ?? null,
        outTimeImageUrl: r.outTimeImageUrl ?? null,

        // DateTime Fields (Date/Timestamp conversion to string)
        reportDate: r.reportDate.toISOString().slice(0, 10), // Date only
        checkInTime: r.checkInTime.toISOString(),
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Decimal Fields (Conversion to number)
        conversionQuantityValue: r.conversionQuantityValue?.toNumber() ?? null,

        // Array Fields (Conversion to comma-separated string)
        siteVisitBrandInUse: r.siteVisitBrandInUse.join(', '),
        influencerType: r.influencerType.join(', '),

        // Custom, flattened fields:
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// PJP
export type FlattenedPermanentJourneyPlan = {
    id: string;
    planDate: string;
    areaToBeVisited: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;

    assignedSalesmanName: string;
    assignedSalesmanEmail: string;

    creatorName: string;
    creatorEmail: string;

    dealerName: string | null;
};

export async function getFlattenedPermanentJourneyPlans(companyId: number): Promise<FlattenedPermanentJourneyPlan[]> {
    const rawReports = await prisma.permanentJourneyPlan.findMany({
        where: { user: { companyId } },
        select: {
            id: true, planDate: true, areaToBeVisited: true, description: true, status: true,
            createdAt: true, updatedAt: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            createdBy: { select: { firstName: true, lastName: true, email: true } },
            dealer: { select: { name: true } }, //hydrate dealer name
        },
        orderBy: { planDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        id: r.id,
        areaToBeVisited: r.areaToBeVisited,
        description: r.description ?? null,
        status: r.status,

        planDate: r.planDate.toISOString().slice(0, 10),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        assignedSalesmanName: `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email,
        assignedSalesmanEmail: r.user.email,

        creatorName: `${r.createdBy.firstName ?? ''} ${r.createdBy.lastName ?? ''}`.trim() || r.createdBy.email,
        creatorEmail: r.createdBy.email,

        dealerName: r.dealer?.name ?? null,   //final output friendly
    }));
}


// Competition Report
export type FlattenedCompetitionReport = {
    id: string;
    reportDate: string; // Converted from DateTime (Date)
    brandName: string;
    billing: string;
    nod: string;
    retail: string;
    schemesYesNo: string;
    avgSchemeCost: number; // Converted from Decimal
    remarks: string | null;
    createdAt: string; // Converted from DateTime (Timestamp)
    updatedAt: string; // Converted from DateTime (Timestamp)

    // Flattened Salesman
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedCompetitionReports(companyId: number): Promise<FlattenedCompetitionReport[]> {
    const rawReports = await prisma.competitionReport.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields
            id: true, reportDate: true, brandName: true, billing: true, nod: true, retail: true,
            schemesYesNo: true, avgSchemeCost: true, remarks: true, createdAt: true, updatedAt: true,
            // Relation
            user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { reportDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        id: r.id,
        brandName: r.brandName,
        billing: r.billing,
        nod: r.nod,
        retail: r.retail,
        schemesYesNo: r.schemesYesNo,
        remarks: r.remarks ?? null,

        // Conversions
        reportDate: r.reportDate.toISOString().slice(0, 10),
        avgSchemeCost: r.avgSchemeCost.toNumber(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Flattened Relations
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// Daily Tasks
export type FlattenedDailyTask = {
    id: string;
    taskDate: string; // Converted from DateTime (Date)
    visitType: string;
    relatedDealerId: string | null;
    siteName: string | null;
    description: string | null;
    status: string;
    pjpId: string | null;
    createdAt: string; // Converted from DateTime (Timestamp)
    updatedAt: string; // Converted from DateTime (Timestamp)

    // Flattened Relations
    assignedSalesmanName: string;
    assignedSalesmanEmail: string;
    creatorName: string;
    creatorEmail: string;
    relatedDealerName: string | null;
};

export async function getFlattenedDailyTasks(companyId: number): Promise<FlattenedDailyTask[]> {
    const rawReports = await prisma.dailyTask.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields
            id: true, taskDate: true, visitType: true, relatedDealerId: true, siteName: true, description: true, status: true,
            pjpId: true, createdAt: true, updatedAt: true,

            // Relations
            user: { select: { firstName: true, lastName: true, email: true } }, // Assigned Salesman
            assignedBy: { select: { firstName: true, lastName: true, email: true } }, // Creator/Manager
            relatedDealer: { select: { name: true } }, // Dealer Name
        },
        orderBy: { taskDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        id: r.id,
        visitType: r.visitType,
        relatedDealerId: r.relatedDealerId ?? null,
        siteName: r.siteName ?? null,
        description: r.description ?? null,
        status: r.status,
        pjpId: r.pjpId ?? null,

        // DateTime Conversions
        taskDate: r.taskDate.toISOString().slice(0, 10),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Flattened Relations
        assignedSalesmanName: `${r.user.firstName} ${r.user.lastName}`,
        assignedSalesmanEmail: r.user.email,
        creatorName: `${r.assignedBy.firstName} ${r.assignedBy.lastName}`,
        creatorEmail: r.assignedBy.email,
        relatedDealerName: r.relatedDealer?.name ?? null,
    }));
}

// Salesman Attendance
export type FlattenedSalesmanAttendance = {
    // All scalar fields from SalesmanAttendance
    id: string;
    attendanceDate: string; // Converted from Date
    locationName: string;
    inTimeTimestamp: string; // Converted from Timestamp
    outTimeTimestamp: string | null; // Converted from Timestamp
    inTimeImageCaptured: boolean;
    outTimeImageCaptured: boolean;
    inTimeImageUrl: string | null;
    outTimeImageUrl: string | null;
    inTimeLatitude: number; // Converted from Decimal
    inTimeLongitude: number; // Converted from Decimal
    inTimeAccuracy: number | null; // Converted from Decimal
    inTimeSpeed: number | null; // Converted from Decimal
    inTimeHeading: number | null; // Converted from Decimal
    inTimeAltitude: number | null; // Converted from Decimal
    outTimeLatitude: number | null; // Converted from Decimal
    outTimeLongitude: number | null; // Converted from Decimal
    outTimeAccuracy: number | null; // Converted from Decimal
    outTimeSpeed: number | null; // Converted from Decimal
    outTimeHeading: number | null; // Converted from Decimal
    outTimeAltitude: number | null; // Converted from Decimal
    createdAt: string; // Converted from Timestamp
    updatedAt: string; // Converted from Timestamp

    // Flattened Salesman
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedSalesmanAttendance(companyId: number): Promise<FlattenedSalesmanAttendance[]> {
    const rawReports = await prisma.salesmanAttendance.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields
            id: true, attendanceDate: true, locationName: true, inTimeTimestamp: true, outTimeTimestamp: true,
            inTimeImageCaptured: true, outTimeImageCaptured: true, inTimeImageUrl: true, outTimeImageUrl: true,
            inTimeLatitude: true, inTimeLongitude: true, inTimeAccuracy: true, inTimeSpeed: true,
            inTimeHeading: true, inTimeAltitude: true, outTimeLatitude: true, outTimeLongitude: true,
            outTimeAccuracy: true, outTimeSpeed: true, outTimeHeading: true, outTimeAltitude: true,
            createdAt: true, updatedAt: true,

            // Relation
            user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { attendanceDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        // Map scalar fields (String, Boolean)
        id: r.id,
        locationName: r.locationName,
        inTimeImageCaptured: r.inTimeImageCaptured,
        outTimeImageCaptured: r.outTimeImageCaptured,
        inTimeImageUrl: r.inTimeImageUrl ?? null,
        outTimeImageUrl: r.outTimeImageUrl ?? null,

        // DateTime Fields (Conversion to string)
        attendanceDate: r.attendanceDate.toISOString().slice(0, 10), // Date only
        inTimeTimestamp: r.inTimeTimestamp.toISOString(),
        outTimeTimestamp: r.outTimeTimestamp?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Decimal Fields (Conversion to number)
        inTimeLatitude: r.inTimeLatitude.toNumber(),
        inTimeLongitude: r.inTimeLongitude.toNumber(),
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

        // Flattened Relation
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// Salesman Leaves
export type FlattenedSalesmanLeaveApplication = {
    id: string;
    leaveType: string;
    startDate: string; // Converted from Date
    endDate: string; // Converted from Date
    reason: string;
    status: string;
    adminRemarks: string | null;
    createdAt: string; // Converted from Timestamp
    updatedAt: string; // Converted from Timestamp

    // Flattened Salesman
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedSalesmanLeaveApplication(companyId: number): Promise<FlattenedSalesmanLeaveApplication[]> {
    const rawReports = await prisma.salesmanLeaveApplication.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields
            id: true, leaveType: true, startDate: true, endDate: true, reason: true, status: true,
            adminRemarks: true, createdAt: true, updatedAt: true,
            // Relation
            user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { startDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        // Map scalar fields (String)
        id: r.id,
        leaveType: r.leaveType,
        reason: r.reason,
        status: r.status,
        adminRemarks: r.adminRemarks ?? null,

        // DateTime Conversions
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Flattened Relations
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// Sales Order
export type FlattenedSalesOrder = {
    // IDs
    id: string;
    userId: number | null;
    dealerId: string | null;
    dvrId: string | null;
    pjpId: string | null;

    // Denormalized display
    salesmanName: string | null;
    salesmanEmail: string | null;
    salesmanRole: string | null;
    dealerName: string | null;
    dealerRegion: string | null;
    dealerArea: string | null;
    dealerPhone: string | null;
    dealerAddress: string | null;

    // Business fields (raw)
    orderDate: string;                 // YYYY-MM-DD
    orderPartyName: string;

    partyPhoneNo: string | null;
    partyArea: string | null;
    partyRegion: string | null;
    partyAddress: string | null;

    deliveryDate: string | null;       // YYYY-MM-DD
    deliveryArea: string | null;
    deliveryRegion: string | null;
    deliveryAddress: string | null;
    deliveryLocPincode: string | null;

    paymentMode: string | null;
    paymentTerms: string | null;
    paymentAmount: number | null;
    receivedPayment: number | null;
    receivedPaymentDate: string | null; // YYYY-MM-DD
    pendingPayment: number | null;

    orderQty: number | null;
    orderUnit: string | null;

    itemPrice: number | null;
    discountPercentage: number | null;
    itemPriceAfterDiscount: number | null;

    itemType: string | null;
    itemGrade: string | null;

    // Convenience/computed
    orderTotal: number;                // qty * effective price
    estimatedDelivery: string | null;  // alias of deliveryDate
    remarks: string | null;            // you don't have this column; stays null

    // Timestamps
    createdAt: string; // ISO
    updatedAt: string; // ISO
};

export async function getFlattenedSalesOrders(companyId: number): Promise<FlattenedSalesOrder[]> {
    const orders = await prisma.salesOrder.findMany({
        where: { user: { companyId } },           // link via SalesOrder.user
        include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            dealer: {
                select: {
                    id: true, name: true, region: true, area: true, phoneNo: true, address: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const toNum = (v: any): number | null => (v == null ? null : Number(v));
    const toDate = (d: any): string | null => (d ? new Date(d).toISOString().slice(0, 10) : null);

    return orders.map((o: any) => {
        const qty = toNum(o.orderQty) ?? 0;
        // Prefer price after discount; fall back to base price; else 0
        const unitPrice = (toNum(o.itemPriceAfterDiscount) ?? toNum(o.itemPrice) ?? 0);
        const orderTotal = Number((qty * unitPrice).toFixed(2));

        const receivedPayment = toNum(o.receivedPayment);
        const pendingPayment =
            o.pendingPayment != null ? toNum(o.pendingPayment) : Number((orderTotal - (receivedPayment ?? 0)).toFixed(2));

        const salesmanName =
            `${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`.trim() ||
            o.user?.email || null;

        return {
            // IDs
            id: o.id,
            userId: o.userId ?? null,
            dealerId: o.dealerId ?? null,
            dvrId: o.dvrId ?? null,
            pjpId: o.pjpId ?? null,

            // Denormalized
            salesmanName,
            salesmanEmail: o.user?.email ?? null,
            salesmanRole: o.user?.role ?? null,
            dealerName: o.dealer?.name ?? null,
            dealerRegion: o.dealer?.region ?? null,
            dealerArea: o.dealer?.area ?? null,
            dealerPhone: o.dealer?.phoneNo ?? null,
            dealerAddress: o.dealer?.address ?? null,

            // Business (raw)
            orderDate: toDate(o.orderDate)!, // not null by schema
            orderPartyName: o.orderPartyName,

            partyPhoneNo: o.partyPhoneNo ?? null,
            partyArea: o.partyArea ?? null,
            partyRegion: o.partyRegion ?? null,
            partyAddress: o.partyAddress ?? null,

            deliveryDate: toDate(o.deliveryDate),
            deliveryArea: o.deliveryArea ?? null,
            deliveryRegion: o.deliveryRegion ?? null,
            deliveryAddress: o.deliveryAddress ?? null,
            deliveryLocPincode: o.deliveryLocPincode ?? null,

            paymentMode: o.paymentMode ?? null,
            paymentTerms: o.paymentTerms ?? null,
            paymentAmount: toNum(o.paymentAmount),
            receivedPayment,
            receivedPaymentDate: toDate(o.receivedPaymentDate),
            pendingPayment,

            orderQty: toNum(o.orderQty),
            orderUnit: o.orderUnit ?? null,

            itemPrice: toNum(o.itemPrice),
            discountPercentage: toNum(o.discountPercentage),
            itemPriceAfterDiscount: toNum(o.itemPriceAfterDiscount),

            itemType: o.itemType ?? null,
            itemGrade: o.itemGrade ?? null,

            // Convenience/computed
            orderTotal,
            estimatedDelivery: toDate(o.deliveryDate),
            remarks: null,

            // Timestamps
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
        };
    });
}

// Geo-tracking
export type FlattenedGeoTracking = {
    id: string;
    latitude: number; // Converted from Decimal
    longitude: number; // Converted from Decimal
    recordedAt: string; // Converted from Timestamp
    accuracy: number | null; // Converted from Decimal
    speed: number | null; // Converted from Decimal
    heading: number | null; // Converted from Decimal
    altitude: number | null; // Converted from Decimal
    locationType: string | null;
    activityType: string | null;
    appState: string | null;
    batteryLevel: number | null; // Converted from Decimal
    isCharging: boolean | null;
    networkStatus: string | null;
    ipAddress: string | null;
    siteName: string | null;
    checkInTime: string | null; // Converted from Timestamp
    checkOutTime: string | null; // Converted from Timestamp
    totalDistanceTravelled: number | null; // Converted from Decimal
    journeyId: string | null;
    isActive: boolean;
    destLat: number | null; // Converted from Decimal
    destLng: number | null; // Converted from Decimal
    createdAt: string; // Converted from Timestamp
    updatedAt: string; // Converted from Timestamp

    // Flattened User
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedGeoTracking(companyId: number): Promise<FlattenedGeoTracking[]> {
    const rawReports = await prisma.geoTracking.findMany({
        where: { user: { companyId } },
        select: {
            // All scalar fields
            id: true, latitude: true, longitude: true, recordedAt: true, accuracy: true, speed: true,
            heading: true, altitude: true, locationType: true, activityType: true, appState: true,
            batteryLevel: true, isCharging: true, networkStatus: true, ipAddress: true, siteName: true,
            checkInTime: true, checkOutTime: true, totalDistanceTravelled: true, journeyId: true,
            isActive: true, destLat: true, destLng: true, createdAt: true, updatedAt: true,

            // Relation
            user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { recordedAt: 'desc' },
    });

    return rawReports.map((r: any) => ({
        // Map scalar fields (String, Boolean)
        id: r.id,
        locationType: r.locationType ?? null,
        activityType: r.activityType ?? null,
        appState: r.appState ?? null,
        isCharging: r.isCharging ?? null,
        networkStatus: r.networkStatus ?? null,
        ipAddress: r.ipAddress ?? null,
        siteName: r.siteName ?? null,
        journeyId: r.journeyId ?? null,
        isActive: r.isActive,

        // DateTime Conversions
        recordedAt: r.recordedAt.toISOString(),
        checkInTime: r.checkInTime?.toISOString() ?? null,
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Decimal Conversions (all are nullable or required)
        latitude: r.latitude.toNumber(),
        longitude: r.longitude.toNumber(),
        accuracy: r.accuracy?.toNumber() ?? null,
        speed: r.speed?.toNumber() ?? null,
        heading: r.heading?.toNumber() ?? null,
        altitude: r.altitude?.toNumber() ?? null,
        batteryLevel: r.batteryLevel?.toNumber() ?? null,
        totalDistanceTravelled: r.totalDistanceTravelled?.toNumber() ?? null,
        destLat: r.destLat?.toNumber() ?? null,
        destLng: r.destLng?.toNumber() ?? null,

        // Flattened Relation
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// Dealer Scores
export type FlattenedDealerReportsAndScores = {
    id: string;
    dealerScore: number; // Converted from Decimal
    trustWorthinessScore: number; // Converted from Decimal
    creditWorthinessScore: number; // Converted from Decimal
    orderHistoryScore: number; // Converted from Decimal
    visitFrequencyScore: number; // Converted from Decimal
    lastUpdatedDate: string; // Converted from Timestamp
    createdAt: string; // Converted from Timestamp
    updatedAt: string; // Converted from Timestamp

    // Flattened Dealer
    dealerName: string;
    dealerRegion: string;
    dealerArea: string;
};

export async function getFlattenedDealerReportsAndScores(companyId: number): Promise<FlattenedDealerReportsAndScores[]> {
    const rawReports = await prisma.dealerReportsAndScores.findMany({
        where: {
            dealer: {
                user: {
                    companyId: companyId
                }
            }
        },
        select: {
            // All scalar fields
            id: true, dealerScore: true, trustWorthinessScore: true, creditWorthinessScore: true,
            orderHistoryScore: true, visitFrequencyScore: true, lastUpdatedDate: true,
            createdAt: true, updatedAt: true,

            // Relation: Fetching key dealer fields
            dealer: { select: { name: true, region: true, area: true } },
        },
        orderBy: { lastUpdatedDate: 'desc' },
    });

    return rawReports.map((r: any) => ({
        id: r.id,

        // DateTime Conversions
        lastUpdatedDate: r.lastUpdatedDate.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),

        // Decimal Conversions
        dealerScore: r.dealerScore.toNumber(),
        trustWorthinessScore: r.trustWorthinessScore.toNumber(),
        creditWorthinessScore: r.creditWorthinessScore.toNumber(),
        orderHistoryScore: r.orderHistoryScore.toNumber(),
        visitFrequencyScore: r.visitFrequencyScore.toNumber(),

        // Flattened Dealer
        dealerName: r.dealer.name,
        dealerRegion: r.dealer.region,
        dealerArea: r.dealer.area,
    }));
}

// Salesman Rating
export type FlattenedRating = {
    id: number;
    area: string;
    region: string;
    rating: number;

    // Flattened Salesman
    salesmanName: string;
    salesmanEmail: string;
};

export async function getFlattenedRatings(companyId: number): Promise<FlattenedRating[]> {
    const rawReports = await prisma.rating.findMany({
        // Filter by the user's company ID
        where: { user: { companyId } },
        select: {
            id: true, area: true, region: true, rating: true,
            user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { id: 'desc' },
    });

    return rawReports.map((r: any) => ({
        id: r.id,
        area: r.area,
        region: r.region,
        rating: r.rating,

        // Flattened User
        salesmanName: `${r.user.firstName} ${r.user.lastName}`,
        salesmanEmail: r.user.email,
    }));
}

// Brands && Dealer Brand Mapping
export type FlattenedDealerBrandMapping = {
    id: string;

    // Capacities
    capacityMT: number;                 // required
    bestCapacityMT: number | null;      // optional
    brandGrowthCapacityPercent: number | null; // optional

    // Who recorded/owns this mapping (optional in schema)
    userId: number | null;

    // Flattened Brand
    brandName: string;

    // Flattened Dealer
    dealerId: string;
    dealerName: string;
    dealerRegion: string;
    dealerArea: string;
};

export async function getFlattenedDealerBrandCapacities(
    companyId: number
): Promise<FlattenedDealerBrandMapping[]> {
    const rows = await prisma.dealerBrandMapping.findMany({
        where: {
            dealer: {
                user: { companyId }
            }
        },
        select: {
            id: true,
            dealerId: true,
            userId: true,
            capacityMT: true,
            bestCapacityMT: true,
            brandGrowthCapacityPercent: true,
            brand: { select: { name: true } },
            dealer: { select: { name: true, region: true, area: true } },
        },
        orderBy: { dealerId: 'asc' },
    });

    return rows.map((r: any) => ({
        id: r.id,
        dealerId: r.dealerId,

        // Decimal conversions
        capacityMT: r.capacityMT.toNumber(),
        bestCapacityMT: r.bestCapacityMT?.toNumber() ?? null,
        brandGrowthCapacityPercent: r.brandGrowthCapacityPercent?.toNumber() ?? null,

        // Optional owner
        userId: r.userId ?? null,

        // Flattened relations
        brandName: r.brand.name,
        dealerName: r.dealer.name,
        dealerRegion: r.dealer.region,
        dealerArea: r.dealer.area,
    }));
}

export const transformerMap = {
    // Core Report Models
    users: getFlattenedUsers,
    dealers: getFlattenedDealers,
    dailyVisitReports: getFlattenedDailyVisitReports,
    technicalVisitReports: getFlattenedTechnicalVisitReports,
    salesOrders: getFlattenedSalesOrders,
    competitionReports: getFlattenedCompetitionReports,

    // Planning & Task Models
    permanentJourneyPlans: getFlattenedPermanentJourneyPlans,
    dailyTasks: getFlattenedDailyTasks,

    salesmanAttendance: getFlattenedSalesmanAttendance,
    salesmanLeaveApplications: getFlattenedSalesmanLeaveApplication,
    geoTracking: getFlattenedGeoTracking,

    dealerReportsAndScores: getFlattenedDealerReportsAndScores,
    salesmanRating: getFlattenedRatings,
    dealerBrandCapacities: getFlattenedDealerBrandCapacities,
};