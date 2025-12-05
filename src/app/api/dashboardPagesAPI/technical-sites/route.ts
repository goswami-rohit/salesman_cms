// src/app/api/dashboardPagesAPI/technical-sites/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { technicalSiteSchema } from '@/lib/shared-zod-schema';
import { Prisma } from '@prisma/client';

const allowedRoles = [
    'president', 'senior-general-manager', 'general-manager',
    'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
    'senior-manager', 'manager', 'assistant-manager',
    'senior-executive', 'executive',
];

export async function GET(request: NextRequest) {
    try {
        const claims = await getTokenClaims();

        // 1. Authentication Check
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Current User
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true }
        });

        // 3. Authorization Check
        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 4. Fetch Sites with Relations
        const sites = await prisma.technicalSite.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                // Fetch Users linked to the site
                associatedUsers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        phoneNumber: true,
                    }
                },
                // Fetch Dealers linked to the site
                associatedDealers: {
                    select: {
                        id: true,
                        name: true,
                        phoneNo: true,
                        type: true,
                        area: true,
                    }
                },
                // Fetch Masons linked to the site
                associatedMasons: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        kycStatus: true,
                    }
                },
                // Fetch Bag Lifts recorded for this site
                bagLifts: {
                    select: {
                        id: true,
                        bagCount: true,
                        pointsCredited: true,
                        status: true,
                        purchaseDate: true,
                        // Fetch mason name to display who lifted the bags
                        mason: {
                            select: { name: true }
                        }
                    },
                    orderBy: { purchaseDate: 'desc' }
                }
            }
        });

        // Helper to handle Prisma Decimals/Nulls
        function toNumberOrNull(val: Prisma.Decimal | null | number): number | null {
            if (val === null || val === undefined) return null;
            if (typeof val === 'object' && 'toNumber' in val) {
                return val.toNumber();
            }
            return Number(val);
        }

        // 5. Map and Format Data
        const formattedSites = sites.map((site) => ({
            // --- Scalar Fields ---
            id: site.id,
            siteName: site.siteName,
            concernedPerson: site.concernedPerson,
            phoneNo: site.phoneNo,
            address: site.address,
            latitude: toNumberOrNull(site.latitude),
            longitude: toNumberOrNull(site.longitude),
            siteType: site.siteType,
            area: site.area,
            region: site.region,
            keyPersonName: site.keyPersonName,
            keyPersonPhoneNum: site.keyPersonPhoneNum,
            stageOfConstruction: site.stageOfConstruction,
            convertedSite: site.convertedSite,
            needFollowUp: site.needFollowUp,
            imageUrl: site.imageUrl,

            // Dates
            constructionStartDate: site.constructionStartDate?.toISOString() ?? null,
            constructionEndDate: site.constructionEndDate?.toISOString() ?? null,
            firstVistDate: site.firstVistDate?.toISOString() ?? null,
            lastVisitDate: site.lastVisitDate?.toISOString() ?? null,
            createdAt: site.createdAt.toISOString(),
            updatedAt: site.updatedAt.toISOString(),

            // --- Nested Relations Mapped for API ---

            // 1. Users: Combine names, ensure ID is passed
            associatedUsers: site.associatedUsers.map(u => ({
                id: u.id,
                name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
                role: u.role,
                phoneNumber: u.phoneNumber
            })),

            // 2. Dealers: Pass basics
            associatedDealers: site.associatedDealers.map(d => ({
                id: d.id,
                name: d.name,
                phoneNo: d.phoneNo,
                type: d.type,
                area: d.area
            })),

            // 3. Masons: Pass basics
            associatedMasons: site.associatedMasons.map(m => ({
                id: m.id,
                name: m.name,
                phoneNumber: m.phoneNumber,
                kycStatus: m.kycStatus
            })),

            // 4. Bag Lifts: Flatten mason name
            bagLifts: site.bagLifts.map(bl => ({
                id: bl.id,
                bagCount: bl.bagCount,
                pointsCredited: bl.pointsCredited,
                status: bl.status,
                purchaseDate: bl.purchaseDate.toISOString(),
                masonName: bl.mason?.name ?? null
            })),
        }));

        // 6. Validate with Zod
        const validatedData = z.array(technicalSiteSchema).parse(formattedSites);

        return NextResponse.json(validatedData, { status: 200 });

    } catch (error) {
        console.error('Error fetching technical sites:', error);
        return NextResponse.json({
            error: 'Failed to fetch technical sites',
            details: (error as Error).message
        }, { status: 500 });
    }
}