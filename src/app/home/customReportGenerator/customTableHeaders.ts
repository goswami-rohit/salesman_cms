// src/app/home/customReportGenerator/customTableHeaders.ts

import {
    LucideIcon, User, Car, BadgeIndianRupeeIcon, ListTodo, ClipboardCheck, BandageIcon,
    CalendarCheck, PencilRuler, ChartNoAxesCombined, MapPin, Award, Star, Boxes,
    Building, Briefcase,
    Building2
} from 'lucide-react';

export interface TableColumn {
    table: string;
    column: string;
}

export interface TableMeta {
    id: string;
    title: string;
    icon: LucideIcon;
    columns: string[];
}

export const tablesMetadata: TableMeta[] = [
    {
        id: 'users',
        title: 'User (Salesman)',
        icon: User,
        columns: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNo', 'address', 'region', 'area', 'isActive', 'createdAt']
    },
    {
        id: 'dealers',
        title: 'Dealers',
        icon: Building2,
        columns: [
            'id', 'type', 'name', 'region', 'area', 'phoneNo', 'address', 'pinCode',
            'feedbacks', 'remarks', 'dealerDevelopmentStatus', 'dealerDevelopmentObstacle',
            'verificationStatus', 'whatsappNo', 'emailId', 'businessType', 'gstinNo', 'nameOfFirm', 'underSalesPromoterName',
            'panNo', 'tradeLicNo', 'aadharNo', 'godownSizeSqFt', 'godownCapacityMTBags',
            'godownAddressLine', 'godownLandMark', 'godownDistrict', 'godownArea',
            'godownRegion', 'godownPinCode', 'residentialAddressLine', 'residentialLandMark',
            'residentialDistrict', 'residentialArea', 'residentialRegion', 'residentialPinCode',
            'bankAccountName', 'bankName', 'bankBranchAddress', 'bankAccountNumber',
            'bankIfscCode', 'brandName', 'noOfDealers', 'areaCovered', 'noOfEmployeesInSales',
            'declarationName', 'declarationPlace', 'tradeLicencePicUrl', 'shopPicUrl',
            'dealerPicUrl', 'blankChequePicUrl', 'partnershipDeedPicUrl', 'latitude',
            'longitude', 'dateOfBirth', 'anniversaryDate', 'totalPotential', 'bestPotential',
            'monthlySaleMT', 'projectedMonthlySalesBestCementMT', 'brandSelling',
            'declarationDate', 'createdAt', 'updatedAt', 'associatedSalesmanName'
        ],
    },
    {
        id: 'dailyVisitReports',
        title: 'Daily Visit Reports',
        icon: CalendarCheck,
        columns: [
            'id', 'reportDate', 'dealerType', 'dealerName', 'subDealerName', 'location',
            'latitude', 'longitude', 'visitType', 'dealerTotalPotential', 'dealerBestPotential',
            'brandSelling', 'contactPerson', 'contactPersonPhoneNo', 'todayOrderMt',
            'todayCollectionRupees', 'overdueAmount', 'feedbacks', 'solutionBySalesperson',
            'anyRemarks', 'checkInTime', 'checkOutTime', 'inTimeImageUrl', 'outTimeImageUrl',
            'createdAt', 'updatedAt'
        ],
    },
    {
        id: 'technicalVisitReports',
        title: 'Technical Visit Reports',
        icon: PencilRuler,
        columns: [
            'id', 'reportDate', 'visitType', 'siteNameConcernedPerson', 'phoneNo', 'emailId',
            'clientsRemarks', 'salespersonRemarks', 'checkInTime', 'checkOutTime',
            'inTimeImageUrl', 'outTimeImageUrl', 'siteVisitBrandInUse', 'siteVisitStage',
            'conversionFromBrand', 'conversionQuantityValue', 'conversionQuantityUnit',
            'associatedPartyName', 'influencerType', 'serviceType', 'qualityComplaint',
            'promotionalActivity', 'channelPartnerVisit', 'siteVisitType',
            'dhalaiVerificationCode', 'isVerificationStatus', 'meetingId', 'createdAt',
            'updatedAt', 'salesmanName', 'salesmanEmail'
        ],
    },
    {
        id: 'permanentJourneyPlans',
        title: 'Permanent Journey Plans (PJP)',
        icon: Car,
        columns: ['id', 'planDate', 'areaToBeVisited', 'description', 'status', 'dealerName', 'assignedSalesmanName', 'creatorName', 'createdAt', 'updatedAt']
    },
    {
        id: 'salesOrders',
        title: 'Sales Orders',
        icon: BadgeIndianRupeeIcon,
        columns: [
            'id', 'userId', 'dealerId', 'dvrId', 'pjpId',
            'salesmanName', 'salesmanRole',
            'dealerName', 'dealerType', 'dealerPhone', 'dealerAddress', 'area', 'region',
            'orderDate', 'orderPartyName',
            'partyPhoneNo', 'partyArea', 'partyRegion', 'partyAddress',
            'deliveryDate', 'deliveryArea', 'deliveryRegion', 'deliveryAddress', 'deliveryLocPincode',
            'paymentMode', 'paymentTerms', 'paymentAmount', 'receivedPayment', 'receivedPaymentDate', 'pendingPayment',
            'orderQty', 'orderUnit',
            'itemPrice', 'discountPercentage', 'itemPriceAfterDiscount',
            'itemType', 'itemGrade',
            'orderTotal', 'estimatedDelivery', 'remarks',
            'createdAt', 'updatedAt',
        ],
    },
    {
        id: 'dailyTasks',
        title: 'Daily Tasks',
        icon: ListTodo,
        columns: ['id', 'taskDate', 'visitType', 'siteName', 'description', 'status', 'pjpId', 'assignedToName', 'assignedByName', 'relatedDealerName', 'createdAt'],
    },
    {
        id: 'competitionReports',
        title: 'Competition Reports',
        icon: ChartNoAxesCombined,
        columns: ['id', 'reportDate', 'area', 'region', 'competitorName', 'productName', 'price', 'salesmanName', 'dealerName', 'createdAt'],
    },
    {
        id: 'dealerReportsAndScores',
        title: 'Dealer Scores',
        icon: Award,
        columns: ['id', 'dealerScore', 'trustWorthinessScore', 'creditWorthinessScore', 'orderHistoryScore', 'visitFrequencyScore', 'lastUpdatedDate', 'dealerName', 'dealerRegion', 'dealerArea', 'createdAt'],
    },
    {
        id: 'dealerBrandCapacities',
        title: 'Dealer Brand Capacities',
        icon: Boxes,
        columns: ['id', 'capacityMT', 'bestCapacityMT', 'brandGrowthCapacityPercent', 'userId', 'brandName', 'dealerName', 'dealerRegion', 'dealerArea']
    },
    {
        id: 'salesmanAttendance',
        title: 'Salesman Attendance',
        icon: ClipboardCheck,
        columns: ['id', 'attendanceDate', 'locationName', 'inTimeTimestamp', 'outTimeTimestamp', 'inTimeLatitude', 'inTimeLongitude', 'salesmanName', 'salesmanEmail', 'createdAt'],
    },
    {
        id: 'salesmanLeaveApplications',
        title: 'Leave Applications',
        icon: BandageIcon,
        columns: ['id', 'leaveType', 'startDate', 'endDate', 'reason', 'status', 'salesmanName', 'salesmanEmail', 'approverName', 'createdAt'],
    },
    {
        id: 'geoTracking',
        title: 'Salesman GeoTracking',
        icon: MapPin,
        columns: ['id', 'latitude', 'longitude', 'recordedAt', 'accuracy', 'speed', 'activityType', 'appState', 'batteryLevel', 'salesmanName', 'salesmanEmail', 'journeyId', 'createdAt'],
    },
    {
        id: 'salesmanRating',
        title: 'Salesman Rating',
        icon: Star,
        columns: ['id', 'area', 'region', 'rating', 'salesmanName', 'salesmanEmail'],
    },

];
export type ReportFormat = 'csv' | 'xlsx';