// src/lib/shared-zod-schema.ts
import { z } from 'zod';
import { dealerVerification } from '@/lib/Reusable-constants';

// assign tasks - daily tasks
// Zod schema for validating the POST request body when assigning tasks
export const assignTaskSchema = z.object({
  salesmanUserIds: z.array(z.number().int()).min(1, "At least one salesman must be selected."),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Task date must be in YYYY-MM-DD format."),
  visitType: z.string(),
  relatedDealerIds: z.array(z.string().uuid()).optional().nullable(), // ✅ accept multiple dealers
  siteName: z.string().min(1, "Site name is required for Technical Visit.").optional().nullable(),
  description: z.string().optional().nullable(),
});

// Zod schema for the GET response for daily tasks - DEFINED HERE
export const dailyTaskSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  assignedByUserName: z.string(),
  taskDate: z.string(), // YYYY-MM-DD
  visitType: z.string(),
  relatedDealerName: z.string().nullable().optional(), // For Client Visit
  siteName: z.string().nullable().optional(), // For Technical Visit
  description: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.string(),
});

// dealer brand mapping + brands 
export const baseDealerBrandMappingSchema = z.object({
  id: z.string(), // Dealer ID
  dealerName: z.string(),
  area: z.string(),
  totalPotential: z.number(),
});

// dealer - verification
export const dealerVerificationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    phoneNo: z.string().min(1),
    area: z.string().min(1),
    region: z.string().min(1),
    type: z.string().min(1), // Used as a primary identifier/zone category
    verificationStatus: z.enum(dealerVerification),

    // Statutory IDs
    gstinNo: z.string().nullable().optional(),
    panNo: z.string().nullable().optional(),
    aadharNo: z.string().nullable().optional(),
    tradeLicNo: z.string().nullable().optional(),

    // Image URLs (nullable/optional)
    tradeLicencePicUrl: z.string().url().nullable().optional(),
    shopPicUrl: z.string().url().nullable().optional(),
    dealerPicUrl: z.string().url().nullable().optional(),
    blankChequePicUrl: z.string().url().nullable().optional(),
    partnershipDeedPicUrl: z.string().url().nullable().optional(),
    
    remarks: z.string().nullable().optional(),
});

export const verificationUpdateSchema = z.object({
    verificationStatus: z.enum(["VERIFIED", "REJECTED"]), 
});

// dealer 
export const optionalNumberSchema = z.number().nullable().optional();
export const optionalIntSchema = z.number().int().nullable().optional();
export const optionalStringSchema = z.string().nullable().optional();

export const getDealersSchema = z.object({
    id: z.string().uuid(), // Expecting a UUID string
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."), 
    parentDealerId: z.string().uuid("Parent Dealer ID must be a valid UUID if provided.").nullable().optional(),
    parentDealerName: optionalStringSchema, // Custom field from parentDealer relation
    region: z.string().min(1, "Region is required."),     
    area: z.string().min(1, "Area is required."),         
    phoneNo: z.string().min(1, "Phone number is required.").max(20, "Phone number is too long."),
    address: z.string().min(1, "Address is required.").max(500, "Address is too long."),
    pinCode: optionalStringSchema,
    latitude: optionalNumberSchema,
    longitude: optionalNumberSchema,
    dateOfBirth: optionalStringSchema,       // ISO string
    anniversaryDate: optionalStringSchema,   // ISO string
    totalPotential: z.number().nonnegative("Total potential must be 0 or positive."),
    bestPotential: z.number().nonnegative("Best potential must be 0 or positive."),
    brandSelling: z.array(z.string()).min(1, "At least one brand must be selected."),
    feedbacks: z.string().min(1, "Feedbacks are required.").max(500, "Feedbacks are too long."),
    remarks: optionalStringSchema, 
    verificationStatus: z.string().optional(),
    
    // --- New Fields (Contact, KYC, Development) ---
    dealerDevelopmentStatus: optionalStringSchema,
    dealerDevelopmentObstacle: optionalStringSchema,
    whatsappNo: optionalStringSchema,
    emailId: optionalStringSchema,
    businessType: optionalStringSchema,
    gstinNo: optionalStringSchema,
    panNo: optionalStringSchema,
    tradeLicNo: optionalStringSchema, 
    aadharNo: optionalStringSchema,

    // --- Godown Details ---
    godownSizeSqFt: optionalNumberSchema, 
    godownCapacityMTBags: optionalStringSchema, 
    godownAddressLine: optionalStringSchema, 
    godownLandMark: optionalStringSchema, 
    godownDistrict: optionalStringSchema, 
    godownArea: optionalStringSchema, 
    godownRegion: optionalStringSchema, 
    godownPinCode: optionalStringSchema, 

    // --- Residential Address Details ---
    residentialAddressLine: optionalStringSchema, 
    residentialLandMark: optionalStringSchema, 
    residentialDistrict: optionalStringSchema, 
    residentialArea: optionalStringSchema, 
    residentialRegion: optionalStringSchema, 
    residentialPinCode: optionalStringSchema, 

    // --- Bank Details ---
    bankAccountName: optionalStringSchema, 
    bankName: optionalStringSchema, 
    bankBranchAddress: optionalStringSchema, 
    bankAccountNumber: optionalStringSchema, 
    bankIfscCode: optionalStringSchema, 

    // --- Sales & Promoter Details ---
    brandName: optionalStringSchema, 
    monthlySaleMT: optionalNumberSchema, 
    noOfDealers: optionalNumberSchema, 
    areaCovered: optionalStringSchema, 
    projectedMonthlySalesBestCementMT: optionalNumberSchema, 
    noOfEmployeesInSales: optionalNumberSchema, 

    // --- Declaration ---
    declarationName: optionalStringSchema, 
    declarationPlace: optionalStringSchema, 
    declarationDate: optionalStringSchema, 

    // --- Document/Image URLs ---
    tradeLicencePicUrl: optionalStringSchema,
    shopPicUrl: optionalStringSchema,
    dealerPicUrl: optionalStringSchema,
    blankChequePicUrl: optionalStringSchema,
    partnershipDeedPicUrl: optionalStringSchema, 

    createdAt: z.string(), // Expecting ISO string
    updatedAt: z.string(), // Expecting ISO string
});

// Schema for the POST request body (data sent from frontend to create a new dealer)
export const postDealersSchema = z.object({
    name: z.string().min(1, "Dealer name is required."),
    type: z.string(),
    parentDealerId: z.string().uuid("Parent Dealer ID must be a valid UUID if provided.").nullable().optional(),
    region: z.string(),
    area: z.string(),
    phoneNo: z.string().min(1, "Phone number is required.").max(20, "Phone number is too long."),
    address: z.string().min(1, "Address is required.").max(500, "Address is too long."),
    pinCode: optionalStringSchema,
    latitude: optionalNumberSchema,
    longitude: optionalNumberSchema,
    dateOfBirth: optionalStringSchema,       // ISO string
    anniversaryDate: optionalStringSchema,   // ISO string
    totalPotential: z.number().nonnegative("Total potential must be 0 or positive."),
    bestPotential: z.number().nonnegative("Best potential must be 0 or positive."),
    brandSelling: z.array(z.string()).min(1, "At least one brand must be selected."),
    feedbacks: z.string().min(1, "Feedbacks are required.").max(500, "Feedbacks are too long."),
    remarks: optionalStringSchema, 

    // --- New Fields (Contact, KYC, Development) ---
    dealerDevelopmentStatus: optionalStringSchema,
    dealerDevelopmentObstacle: optionalStringSchema,
    whatsappNo: optionalStringSchema,
    emailId: optionalStringSchema,
    businessType: optionalStringSchema,
    gstinNo: optionalStringSchema,
    panNo: optionalStringSchema,
    tradeLicNo: optionalStringSchema, 
    aadharNo: optionalStringSchema,

    // --- Godown Details ---
    godownSizeSqFt: optionalIntSchema, // Specific integer validation
    godownCapacityMTBags: optionalStringSchema, 
    godownAddressLine: optionalStringSchema, 
    godownLandMark: optionalStringSchema, 
    godownDistrict: optionalStringSchema, 
    godownArea: optionalStringSchema, 
    godownRegion: optionalStringSchema, 
    godownPinCode: optionalStringSchema, 

    // --- Residential Address Details ---
    residentialAddressLine: optionalStringSchema, 
    residentialLandMark: optionalStringSchema, 
    residentialDistrict: optionalStringSchema, 
    residentialArea: optionalStringSchema, 
    residentialRegion: optionalStringSchema, 
    residentialPinCode: optionalStringSchema, 

    // --- Bank Details ---
    bankAccountName: optionalStringSchema, 
    bankName: optionalStringSchema, 
    bankBranchAddress: optionalStringSchema, 
    bankAccountNumber: optionalStringSchema, 
    bankIfscCode: optionalStringSchema, 

    // --- Sales & Promoter Details ---
    brandName: optionalStringSchema, 
    monthlySaleMT: optionalNumberSchema, 
    noOfDealers: optionalIntSchema, // Specific integer validation
    areaCovered: optionalStringSchema, 
    projectedMonthlySalesBestCementMT: optionalNumberSchema, 
    noOfEmployeesInSales: optionalIntSchema, // Specific integer validation

    // --- Declaration ---
    declarationName: optionalStringSchema, 
    declarationPlace: optionalStringSchema, 
    declarationDate: optionalStringSchema, 

    // --- Document/Image URLs ---
    tradeLicencePicUrl: optionalStringSchema,
    shopPicUrl: optionalStringSchema,
    dealerPicUrl: optionalStringSchema,
    blankChequePicUrl: optionalStringSchema,
    partnershipDeedPicUrl: optionalStringSchema, 
});

// pjp 
export const permanentJourneyPlanSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  userId: z.number().int(),
  createdByName: z.string(),
  createdByRole: z.string(),
  areaToBeVisited: z.string(),
  planDate: z.string(), // Mapped to YYYY-MM-DD
  description: z.string().nullable().optional(), // Mapped to String? in schema
  status: z.string(),
  taskIds: z.array(z.string()), // Array of DailyTask IDs
  // We'll also include the timestamps, as these are useful in most reports
  createdAt: z.string(),
  updatedAt: z.string(),
});

// competition report
export const competitionReportSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  brandName: z.string(),
  date: z.string(), // Mapped to YYYY-MM-DD
  billing: z.string(),
  nod: z.string(),
  retail: z.string(),
  schemesYesNo: z.string(),
  avgSchemeCost: z.number(), // Mapped from Decimal to Number
  remarks: z.string(), // Mapped from String? to non-nullable string
  createdAt: z.string(), // ISO String
  updatedAt: z.string(), // ISO String
});

// daily visit report
export const dailyVisitReportSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  role: z.string(),
  reportDate: z.string(), // YYYY-MM-DD string
  dealerType: z.string(),
  dealerName: z.string().nullable(),
  subDealerName: z.string().nullable(),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  visitType: z.string(),
  dealerTotalPotential: z.number(),
  dealerBestPotential: z.number(),
  brandSelling: z.array(z.string()),
  contactPerson: z.string().nullable(),
  contactPersonPhoneNo: z.string().nullable(),
  todayOrderMt: z.number(),
  todayCollectionRupees: z.number(),
  overdueAmount: z.number().nullable(),
  feedbacks: z.string(),
  solutionBySalesperson: z.string().nullable(),
  anyRemarks: z.string().nullable(),
  checkInTime: z.string(), // ISO string
  checkOutTime: z.string().nullable(), // ISO string or null
  inTimeImageUrl: z.string().nullable(),
  outTimeImageUrl: z.string().nullable(),
});

// sales orders
export const salesOrderSchema = z.object({
  // Primary & FKs
  id: z.string(),
  userId: z.number().nullable(),
  dealerId: z.string().nullable(),
  dvrId: z.string().nullable(),
  pjpId: z.string().nullable(),

  // Denormalized display fields (nice for UI)
  salesmanName: z.string(),
  salesmanRole: z.string(),
  dealerName: z.string(),
  dealerType: z.string(),
  dealerPhone: z.string(),
  dealerAddress: z.string(),
  area: z.string(),
  region: z.string(),

  // Business fields (raw)
  orderDate: z.string(),                      // YYYY-MM-DD
  orderPartyName: z.string(),

  partyPhoneNo: z.string().nullable(),
  partyArea: z.string().nullable(),
  partyRegion: z.string().nullable(),
  partyAddress: z.string().nullable(),

  deliveryDate: z.string().nullable(),        // YYYY-MM-DD or null
  deliveryArea: z.string().nullable(),
  deliveryRegion: z.string().nullable(),
  deliveryAddress: z.string().nullable(),
  deliveryLocPincode: z.string().nullable(),

  paymentMode: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  paymentAmount: z.number().nullable(),
  receivedPayment: z.number().nullable(),
  receivedPaymentDate: z.string().nullable(), // YYYY-MM-DD or null
  pendingPayment: z.number().nullable(),

  orderQty: z.number().nullable(),
  orderUnit: z.string().nullable(),

  itemPrice: z.number().nullable(),
  discountPercentage: z.number().nullable(),
  itemPriceAfterDiscount: z.number().nullable(),

  itemType: z.string().nullable(),
  itemGrade: z.string().nullable(),

  // Convenience/computed
  orderTotal: z.number(),                      // qty * effective price
  estimatedDelivery: z.string().nullable(),    // alias of deliveryDate for your UI
  remarks: z.string().nullable(),              // not in DB, stays null for compat

  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

// technical visit report 
export const technicalVisitReportSchema = z.object({
  id: z.string(),
  salesmanName: z.string(),
  role: z.string(),
  visitType: z.string(),
  siteNameConcernedPerson: z.string(),
  phoneNo: z.string(),
  date: z.string(), // Mapped to YYYY-MM-DD
  emailId: z.string(), // Formatted to '' if null
  clientsRemarks: z.string(),
  salespersonRemarks: z.string(),
  checkInTime: z.string(), // ISO String
  checkOutTime: z.string(), // ISO String or ''
  
  // NEW/MISSING FIELDS from formatting logic - MUST BE NULLABLE if they are optional in Prisma
  inTimeImageUrl: z.string().nullable(),
  outTimeImageUrl: z.string().nullable(),
  siteVisitType: z.string().nullable(), // FIX: Added .nullable()
  dhalaiVerificationCode: z.string().nullable(), // FIX: Added .nullable()
  isVerificationStatus: z.string().nullable(), // FIX: Added .nullable()
  meetingId: z.string().nullable(), // FIX: Added .nullable()
  createdAt: z.string(), // ISO String
  updatedAt: z.string(), // ISO String

  // Array fields
  siteVisitBrandInUse: z.array(z.string()),
  influencerType: z.array(z.string()),

  // Optional string fields formatted to ''
  siteVisitStage: z.string(),
  conversionFromBrand: z.string(),
  conversionQuantityUnit: z.string(),
  associatedPartyName: z.string(),
  serviceType: z.string(),
  qualityComplaint: z.string(),
  promotionalActivity: z.string(),
  channelPartnerVisit: z.string(),

  // Numeric field, converted to number or null
  conversionQuantityValue: z.number().nullable(), // FIX: Confirms it can be null
});

// salesman & dealer rating-scores
// Salesperson Ratings
export const salesmanRatingSchema = z.object({
  id: z.number(),
  salesPersonName: z.string(),
  area: z.string(),
  region: z.string(),
  rating: z.number().int(),
});

// Dealer Scores (now includes area/region/type; fixed date field)
export const dealerScoreSchema = z.object({
  id: z.string(),
  dealerName: z.string(),
  dealerScore: z.number(),
  trustWorthinessScore: z.number(),
  creditWorthinessScore: z.number(),
  orderHistoryScore: z.number(),
  visitFrequencyScore: z.number(),
  lastUpdatedDate: z.string(),     // YYYY-MM-DD string we format below
  area: z.string().optional(),     // from Dealer.area
  region: z.string().optional(),   // from Dealer.region
  type: z.string().optional(),     // from Dealer.type
});

// salesman attendance 
export const salesmanAttendanceSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  date: z.string(), // YYYY-MM-DD
  location: z.string(),
  inTime: z.string().nullable(), // Formatted time string or null
  outTime: z.string().nullable(), // Formatted time string or null
  inTimeImageCaptured: z.boolean(),
  outTimeImageCaptured: z.boolean(),
  inTimeImageUrl: z.string().nullable(),
  outTimeImageUrl: z.string().nullable(),

  // Latitude/Longitude are required fields in the DB schema, so they should be numbers.
  inTimeLatitude: z.number(),
  inTimeLongitude: z.number(),

  // The rest are optional in the DB schema, so they are nullable numbers in the output.
  inTimeAccuracy: z.number().nullable(),
  inTimeSpeed: z.number().nullable(),
  inTimeHeading: z.number().nullable(),
  inTimeAltitude: z.number().nullable(),
  outTimeLatitude: z.number().nullable(),
  outTimeLongitude: z.number().nullable(),
  outTimeAccuracy: z.number().nullable(),
  outTimeSpeed: z.number().nullable(),
  outTimeHeading: z.number().nullable(),
  outTimeAltitude: z.number().nullable(),

  // Added timestamps for a complete report
  createdAt: z.string(),
  updatedAt: z.string(),

  salesmanRole: z.string().optional(),
  area: z.string().optional(),
  region: z.string().optional(),
});

// geotracking
export const geoTrackingSchema = z.object({
  id: z.string(),
  // User / company info
  salesmanName: z.string().nullable().optional(),
  employeeId: z.string().nullable().optional(),
  workosOrganizationId: z.string().nullable().optional(),
  // Required coords
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.string(), // ISO string
  // Nullable numeric fields
  totalDistanceTravelled: z.number().nullable().optional(),
  accuracy: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  // Nullable strings
  locationType: z.string().nullable().optional(),
  activityType: z.string().nullable().optional(),
  appState: z.string().nullable().optional(),
  networkStatus: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  siteName: z.string().nullable().optional(),
  // Battery / charging
  batteryLevel: z.number().nullable().optional(),
  isCharging: z.boolean().nullable().optional(),
  // Check-in/out
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  // Extra fields you added in formatting
  journeyId: z.string().nullable().optional(),
  isActive: z.boolean(),
  destLat: z.number().nullable().optional(),
  destLng: z.number().nullable().optional(),
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),

  salesmanRole: z.string().optional(),
  area: z.string().optional(),
  region: z.string().optional(),
});

// leave application
export const salesmanLeaveApplicationSchema = z.object({
  id: z.string().uuid(),
  salesmanName: z.string(),
  leaveType: z.string(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),   // YYYY-MM-DD
  reason: z.string(),
  status: z.string(), // "Pending", "Approved", "Rejected"
  adminRemarks: z.string().nullable(),
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string

  salesmanRole: z.string().optional(),
  area: z.string().optional(),
  region: z.string().optional(),
});

// Zod schema for validating PATCH request body
export const updateLeaveApplicationSchema = z.object({
  id: z.string().uuid(), // Ensure it's a valid UUID for the leave application
  status: z.enum(["Approved", "Rejected"]), // Status must be one of these two
  adminRemarks: z.string().nullable().optional(), // Can be string, null, or undefined (if not sent)
});

export type AssignTaskSchema = z.infer<typeof assignTaskSchema>;
export type DailyTaskSchema = z.infer<typeof dailyTaskSchema>;
export type BaseDealerBrandMappingSchema = z.infer<typeof baseDealerBrandMappingSchema>;
export type VerificationUpdateSchema = z.infer<typeof verificationUpdateSchema>;
export type DealerVerificationSchema = z.infer<typeof dealerVerificationSchema>;
export type GetDealersSchema = z.infer<typeof getDealersSchema>;
export type PostDealersSchema = z.infer<typeof postDealersSchema>;
export type PermanentJourneyPlanSchema = z.infer<typeof permanentJourneyPlanSchema>;
export type CompetitionReportSchema = z.infer<typeof competitionReportSchema>;
export type DailyVisitReportSchema = z.infer<typeof dailyVisitReportSchema>;
export type TechnicalVisitReportSchema = z.infer<typeof technicalVisitReportSchema>;
export type SalesOrderSchema = z.infer<typeof salesOrderSchema>;
export type SalesmanAttendanceSchema = z.infer<typeof salesmanAttendanceSchema>;
export type GeoTrackingSchema = z.infer<typeof geoTrackingSchema>;
export type SalesmanLeaveApplicationSchema = z.infer<typeof salesmanLeaveApplicationSchema>;
export type UpdateLeaveApplicationSchema = z.infer<typeof updateLeaveApplicationSchema>;
