// src/app/api/dashboardPagesAPI/technical-sites/route.ts
import 'server-only';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { technicalSiteSchema } from '@/lib/shared-zod-schema';

const allowedRoles =['president', 'senior-general-manager', 'general-manager',
  'assistant-sales-manager', 'area-sales-manager', 'regional-sales-manager',
  'senior-manager', 'manager', 'assistant-manager',
  'senior-executive','executive',];

export async function GET(request: NextRequest) {
    try {
        const claims = await getTokenClaims();

        // 1. Authentication Check
        if (!claims || !claims.sub) {
            return NextResponse.json({ error: 'Unauthorized: No claims found' }, { status: 401 });
        }

        // 2. Fetch Current User to check role and companyId
        const currentUser = await prisma.user.findUnique({
            where: { workosUserId: claims.sub },
            select: { id: true, role: true, companyId: true }
        });

        // 3. Authorization Check
        if (!currentUser || !allowedRoles.includes(currentUser.role)) {
            return NextResponse.json({
                error: `Forbidden: Your role (${currentUser?.role || 'None'}) is not authorized to view sites.`
            }, { status: 403 });
        }

        // 4. Fetch Sites
        // UPDATED: Removing strict ownership checks as requested. 
        // This allows fetching "independent" sites not yet linked to users/dealers.
        const sites = await prisma.technicalSite.findMany({
            // No 'where' clause here so we can see orphaned sites
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Helper to handle Prisma Decimal or nulls
        function toNumberOrNull(val: any): number | null {
            if (val === null || val === undefined || val === '') return null;
            if (typeof val === 'object' && typeof val.toNumber === 'function') {
                return val.toNumber();
            }
            const n = Number(val);
            return Number.isFinite(n) ? n : null;
        }

        // 5. Map and Format Data
        const formattedSites = sites.map((site: any) => ({
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

            // Date Handling
            constructionStartDate: site.constructionStartDate ? site.constructionStartDate.toISOString() : null,
            constructionEndDate: site.constructionEndDate ? site.constructionEndDate.toISOString() : null,
            firstVistDate: site.firstVistDate ? site.firstVistDate.toISOString() : null,
            lastVisitDate: site.lastVisitDate ? site.lastVisitDate.toISOString() : null,
            createdAt: site.createdAt.toISOString(),
            updatedAt: site.updatedAt.toISOString(),
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