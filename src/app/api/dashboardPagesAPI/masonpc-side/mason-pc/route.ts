// src/app/api/dashboardPagesAPI/masonpc-side/mason-pc/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { masonPCSideSchema } from '@/lib/shared-zod-schema';

// Re-using the allowed roles from your sample. Adjust as needed.
const allowedRoles = ['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive',];

// Define acceptable status values for type safety in the FE, but use z.string() for schema validation.
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type KycVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_SUBMITTED';


// Define a separate schema for the full report including KYC details
const masonPcFullSchema = masonPCSideSchema.extend({
  // FIX: Replaced z.enum with z.string().nullable().optional()
  kycStatus: z.string().nullable().optional(),

  // Use string for FE display status, defaulted for safety
  kycVerificationStatus: z.string().default('NOT_SUBMITTED'),

  // KYC details from KYCSubmission, all are nullable strings
  kycAadhaarNumber: z.string().nullable().optional(),
  kycPanNumber: z.string().nullable().optional(),
  kycVoterIdNumber: z.string().nullable().optional(),
  kycDocuments: z.any().nullable().optional(), // Json field
  kycSubmissionRemark: z.string().nullable().optional(),
  kycSubmittedAt: z.string().nullable().optional(),

  // Added for better filtering/display
  salesmanName: z.string().optional(),
  role: z.string().optional(),
  area: z.string().optional(),
  region: z.string().optional(),
});
export type MasonPcFullDetails = z.infer<typeof masonPcFullSchema>;

/**
 * GET: Fetches Mason_PC_Side Records, including KYC details and user info for filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const claims = await getTokenClaims();
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { workosUserId: claims.sub },
      select: { id: true, role: true, companyId: true }
    });

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: `Forbidden: Only allowed roles can access this data.` }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Build the WHERE clause
    const whereClause: any = {
      user: {
        companyId: currentUser.companyId,
      },
    };

    const kycStatusFilter = searchParams.get('kycStatus') as KycVerificationStatus | null;

    const filterToDbMap: Partial<Record<KycVerificationStatus, KycStatus>> = {
      PENDING: 'pending',
      VERIFIED: 'verified',
      REJECTED: 'rejected',
      NOT_SUBMITTED: 'none',
    };

    if (kycStatusFilter && filterToDbMap[kycStatusFilter]) {
      whereClause.kycStatus = filterToDbMap[kycStatusFilter];
    }

    // Fetch Mason_PC_Side Records for the current user's company, including user and KYC submissions
    const masonPcRecords = await prisma.mason_PC_Side.findMany({
      where: whereClause,
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, area: true, region: true }
        },
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 2000,
    });

    // 5. Format the data to include joined user/kyc fields
    const formattedRecords = masonPcRecords.map(record => {
      const salesmanName = [record.user?.firstName, record.user?.lastName]
        .filter(Boolean)
        .join(' ') || 'N/A';

      // Get the latest/most relevant KYC submission
      const latestKycSubmission = record.kycSubmissions?.[0] || {};

      let displayStatus: KycVerificationStatus;

      switch (record.kycStatus) {
        case 'verified':
          displayStatus = 'VERIFIED';
          break;

        case 'pending':
          displayStatus = 'PENDING';
          break;

        case 'rejected':
          displayStatus = 'REJECTED';
          break;

        case 'none':
        default:
          displayStatus = 'NOT_SUBMITTED';
          break;
      }

      return {
        ...record,
        id: record.id,
        name: record.name,
        phoneNumber: record.phoneNumber,
        kycDocumentName: record.kycDocumentName ?? null,
        kycDocumentIdNum: record.kycDocumentIdNum ?? null,
        kycStatus: record.kycStatus ?? null, // Raw status from Mason_PC_Side (String?)
        pointsBalance: record.pointsBalance,
        bagsLifted: record.bagsLifted,
        isReferred: record.isReferred,

        // Joined User fields for filtering/display
        salesmanName: salesmanName,
        role: record.user?.role ?? '',
        area: record.user?.area ?? '',
        region: record.user?.region ?? '',

        // Joined KYC fields (from KYCSubmission)
        kycVerificationStatus: displayStatus as KycVerificationStatus,
        kycAadhaarNumber: latestKycSubmission.aadhaarNumber ?? null,
        kycPanNumber: latestKycSubmission.panNumber ?? null,
        kycVoterIdNumber: latestKycSubmission.voterIdNumber ?? null,
        kycDocuments: latestKycSubmission.documents ?? null,
        kycSubmissionRemark: latestKycSubmission.remark ?? null,
        kycSubmittedAt: latestKycSubmission.createdAt?.toISOString() ?? null,
      };
    });


    // 6. Validate the data against the Zod schema
    const validatedReports = z.array(masonPcFullSchema).parse(formattedRecords);

    return NextResponse.json(validatedReports, { status: 200 });

  } catch (error) {
    console.error('Error fetching mason/pc data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch mason/pc data' }, { status: 500 });
  }
}