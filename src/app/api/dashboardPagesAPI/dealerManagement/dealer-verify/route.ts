// src/app/api/dashboardPagesAPI/add-dealers/dealer-verify/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod';
import { dealerVerification } from '@/lib/Reusable-constants';

// Define roles allowed to perform dealer verification actions (GET and PUT)
const allowedRoles = [
    'Admin', // Assuming 'Admin' is a high-level role
    'president',
    'senior-general-manager',
    'general-manager',
    'regional-sales-manager',
    'senior-manager',
    'manager',
    'assistant-manager',
];

// Zod Schema for the data returned by the GET endpoint (minimal fields for verification)
export const DealerVerificationSchema = z.object({
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

// Zod Schema for the PUT request body (Verification action)
const VerificationUpdateSchema = z.object({
    verificationStatus: z.enum(["VERIFIED", "REJECTED"]), 
});


/**
 * GET: Fetch all dealers with verificationStatus = 'Pending' for the current user's company.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Authentication Check (FIXED: Using the assign-tasks pattern)
        const claims = await getTokenClaims();
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized: No claims found' }, { status: 401 });
        }

        // 2. Fetch Current User for robust role and companyId check
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub }, 
            // Include company to ensure we can filter dealers by companyId
            select: { id: true, role: true, companyId: true } 
        });

        // 3. Authorization Check (Role and Existence)
        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({ 
                error: `Forbidden: Your role (${currentUser?.role || 'None'}) is not authorized for verification.` 
            }, { status: 403 });
        }

        // 4. Fetch pending dealers for the current user's company
        const dealers = await prisma.dealer.findMany({
            where: {
                user: {
                    companyId: currentUser.companyId, // Filter by fetched companyId
                },
                // This line is correct per your schema: model Dealer { ... verificationStatus String ... }
                verificationStatus: 'PENDING', 
            },
            select: {
                id: true,
                name: true,
                phoneNo: true,
                area: true,
                region: true,
                type: true,
                verificationStatus: true,
                // Statutory IDs
                gstinNo: true,
                panNo: true,
                aadharNo: true,
                tradeLicNo: true,
                // Image URLs
                tradeLicencePicUrl: true,
                shopPicUrl: true,
                dealerPicUrl: true,
                blankChequePicUrl: true,
                partnershipDeedPicUrl: true,
                remarks: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        
        // 5. Validate and return data
        const validatedDealers = z.array(DealerVerificationSchema).safeParse(dealers);
        if (!validatedDealers.success) {
            console.error("GET Response Validation Error:", validatedDealers.error);
            return NextResponse.json({ error: 'Data integrity error on server', details: validatedDealers.error }, { status: 500 });
        }

        return NextResponse.json({ dealers: validatedDealers.data }, { status: 200 });

    } catch (error) {
        console.error('Error fetching pending dealers (GET):', error);
        return NextResponse.json({ error: 'Failed to fetch pending dealers', details: (error as Error).message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * PUT: Update the verificationStatus of a dealer.
 */
export async function PUT(request: NextRequest) {
    try {
        // 1. Authentication Check
        const claims = await getTokenClaims();
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized: No claims found' }, { status: 401 });
        }

        // 2. Fetch Current User
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true } 
        });

        // 3. Authorization Check
        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({ 
                error: `Forbidden: Your role (${currentUser?.role || 'None'}) is not authorized to verify/reject dealers.` 
            }, { status: 403 });
        }

        // Get dealerId from query parameters
        const { searchParams } = new URL(request.url);
        const dealerId = searchParams.get('id');

        if (!dealerId || !z.string().uuid().safeParse(dealerId).success) {
            return NextResponse.json({ error: 'Missing or invalid dealer ID in query' }, { status: 400 });
        }

        // 4. Validate request body against the new, simplified schema
        const body = await request.json();
        const validatedBody = VerificationUpdateSchema.safeParse(body);

        if (!validatedBody.success) {
            console.error("PUT Request Body Validation Error:", validatedBody.error);
            // This is the error being returned as a 400
            return NextResponse.json({ error: 'Invalid verification status format or value.', details: validatedBody.error.issues }, { status: 400 });
        }

        const { verificationStatus } = validatedBody.data; // Destructure the correct key

        // 5. Verify dealer existence and company ownership
        const dealerToUpdate = await prisma.dealer.findUnique({
            where: { id: dealerId },
            include: { user: true }
        });

        if (!dealerToUpdate) {
            return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
        }

        if (!dealerToUpdate.user || dealerToUpdate.user.companyId !== currentUser.companyId) {
            return NextResponse.json({ error: 'Forbidden: Cannot update a dealer from another company' }, { status: 403 });
        }

        // 6. Update the verification status
        await prisma.dealer.update({
            where: { id: dealerId },
            data: {
                verificationStatus: verificationStatus,
            },
        });

        return NextResponse.json({ message: `Dealer status updated to ${verificationStatus}` }, { status: 200 });

    } catch (error) {
        console.error('Error updating dealer status (PUT):', error);
        return NextResponse.json({ error: 'Failed to update dealer status', details: (error as Error).message }, { status: 500 });
    } finally {
       // await prisma.$disconnect();
    }
}