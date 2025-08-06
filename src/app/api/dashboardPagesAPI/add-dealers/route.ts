// src/app/api/dashboardPagesAPI/add-dealers/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma'; // Ensure this path is correct for your Prisma client
import { z } from 'zod'; // Import Zod for schema validation

// Define Zod schema for the data expected when adding a new dealer
const addDealerSchema = z.object({
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."),
    region: z.string().min(1, "Region is required."),
    area: z.string().min(1, "Area is required."),
    phoneNo: z.string().min(1, "Phone number is required.").max(16, "Phone number is too long."),
    address: z.string().min(1, "Address is required.").max(200, "Address is too long."),
    totalPotential: z.number().positive("Total potential must be a positive number."),
    bestPotential: z.number().positive("Best potential must be a positive number."),
    brandSelling: z.array(z.string()).min(1, "At least one brand must be selected."),
    feedbacks: z.string().min(1, "Feedbacks are required.").max(250, "Feedbacks are too long."),
    remarks: z.string().nullable().optional(), // Optional field
});

export async function POST(request: NextRequest) {
    try {
        const claims = await getTokenClaims();

        // 1. Authentication Check
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Current User to get their ID and role
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true } // Select only necessary fields
        });

        // 3. Role-based Authorization: Only 'admin' or 'manager' can add dealers
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden: Only admins or managers can add dealers' }, { status: 403 });
        }

        const body = await request.json();
        const parsedBody = addDealerSchema.safeParse(body);

        if (!parsedBody.success) {
            console.error('Add Dealer Validation Error:', parsedBody.error.format());
            return NextResponse.json({ message: 'Invalid request body', errors: parsedBody.error.format() }, { status: 400 });
        }

        const {
            name,
            type,
            region,
            area,
            phoneNo,
            address,
            totalPotential,
            bestPotential,
            brandSelling,
            feedbacks,
            remarks,
        } = parsedBody.data;

        // Create the new dealer in the database
        const newDealer = await prisma.dealer.create({
            data: {
                userId: currentUser.id, // Associate the dealer with the current admin/manager
                name: name,
                type: type,
                region: region,
                area: area,
                phoneNo: phoneNo,
                address: address,
                totalPotential: totalPotential,
                bestPotential: bestPotential,
                brandSelling: brandSelling,
                feedbacks: feedbacks,
                remarks: remarks,
            },
        });

        return NextResponse.json({ message: 'Dealer added successfully!', dealer: newDealer }, { status: 201 });
    } catch (error) {
        console.error('Error adding dealer:', error);
        // Be careful not to expose sensitive error details in production
        return NextResponse.json({ error: 'Failed to add dealer', details: (error as Error).message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET() {
    try {
        const claims = await getTokenClaims();

        // 1. Authentication Check
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Current User to get their ID and role
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true } // Select only necessary fields
        });

        // 3. Role-based Authorization: Only 'admin' or 'manager' can view dealers
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
            return NextResponse.json({ error: 'Forbidden: Requires admin or manager role' }, { status: 403 });
        }

        // 4. Fetch Dealers for the current user's company
        const dealers = await prisma.dealer.findMany({
            where: {
                user: { // Filter dealers by the company of the user who created them
                    companyId: currentUser.companyId,
                },
            },
            orderBy: {
                createdAt: 'desc', // Order by latest added dealers first
            },
            take: 200, // Limit to recent dealers for dashboard view
        });

        // 5. Format the data to match the frontend's expected structure and validate
        const formattedDealers = dealers.map(dealer => ({
            id: dealer.id,
            name: dealer.name,
            type: dealer.type,     //made flexible type=string
            region: dealer.region, //made flexible type=string
            area: dealer.area,     //made flexible type=string
            phoneNo: dealer.phoneNo, 
            address: dealer.address,
            totalPotential: dealer.totalPotential.toNumber(),
            bestPotential: dealer.bestPotential.toNumber(),
            brandSelling: dealer.brandSelling,
            feedbacks: dealer.feedbacks,
            remarks: dealer.remarks,
            createdAt: dealer.createdAt.toISOString(),
            updatedAt: dealer.updatedAt.toISOString(),
        }));

        // Validate the formatted data against the schema
        const validatedDealers = z.array(addDealerSchema).parse(formattedDealers);

        return NextResponse.json(validatedDealers, { status: 200 });
    } catch (error) {
        console.error('Error fetching dealers:', error);
        return NextResponse.json({ error: 'Failed to fetch dealers', details: (error as Error).message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}